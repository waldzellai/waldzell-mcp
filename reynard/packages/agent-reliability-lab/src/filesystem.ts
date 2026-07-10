import { randomUUID } from "node:crypto";
import {
  constants,
  lstat,
  open,
  rename,
  rm,
} from "node:fs/promises";
import type { Stats } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface DirectoryIdentity {
  readonly dev: number;
  readonly ino: number;
  readonly uid: number;
  readonly mode: number;
}

export interface PrivateDirectoryOptions {
  readonly beforeChmod?: () => Promise<void>;
  readonly rejectWritable?: boolean;
}

export interface QuarantineRemovalOptions {
  readonly beforeRename?: () => Promise<void>;
  readonly rename?: typeof rename;
  readonly remove?: typeof rm;
  readonly recoverableName?: (token: string) => string;
  readonly uniqueId?: () => string;
}

export function directoryIdentity(metadata: Stats): DirectoryIdentity {
  return {
    dev: metadata.dev,
    ino: metadata.ino,
    uid: metadata.uid,
    mode: metadata.mode,
  };
}

export function matchesDirectoryIdentity(
  metadata: Stats,
  expected: DirectoryIdentity,
): boolean {
  return (
    metadata.isDirectory() &&
    !metadata.isSymbolicLink() &&
    metadata.dev === expected.dev &&
    metadata.ino === expected.ino &&
    metadata.uid === expected.uid &&
    metadata.mode === expected.mode
  );
}

function currentUserOwns(metadata: Stats): boolean {
  const currentUid = process.getuid?.();
  return currentUid === undefined || metadata.uid === currentUid;
}

export async function normalizePrivateDirectory(
  path: string,
  options: PrivateDirectoryOptions = {},
): Promise<DirectoryIdentity> {
  const absolutePath = resolve(path);
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
  );
  try {
    const before = await handle.stat();
    if (
      !before.isDirectory() ||
      !currentUserOwns(before) ||
      ((before.mode & 0o022) !== 0 && options.rejectWritable !== false)
    ) {
      throw new Error("Directory must be a current-user-owned real directory");
    }
    if ((before.mode & 0o077) !== 0) {
      await options.beforeChmod?.();
      await handle.chmod(0o700);
    }
    const after = await handle.stat();
    if (
      !after.isDirectory() ||
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.uid !== before.uid ||
      !currentUserOwns(after) ||
      (after.mode & 0o077) !== 0
    ) {
      throw new Error("Directory handle identity changed while permissions were tightened");
    }
    const pathEntry = await lstat(absolutePath);
    if (!matchesDirectoryIdentity(pathEntry, directoryIdentity(after))) {
      throw new Error("Directory pathname identity changed while permissions were tightened");
    }
    return directoryIdentity(after);
  } finally {
    await handle.close();
  }
}

async function preserveIdentityMismatch(
  quarantine: string,
  parent: string,
  renameEntry: typeof rename,
  uniqueId: () => string,
): Promise<void> {
  const preserved = join(parent, `.reynard-preserved-foreign-${uniqueId()}`);
  await renameEntry(quarantine, preserved);
}

export async function removeOwnedDirectory(
  path: string,
  parent: string,
  expected: DirectoryIdentity,
  options: QuarantineRemovalOptions = {},
): Promise<void> {
  const absolutePath = resolve(path);
  const absoluteParent = resolve(parent);
  if (dirname(absolutePath) !== absoluteParent) {
    throw new Error("Owned directory must be a direct child of its private parent");
  }
  const parentMetadata = await lstat(absoluteParent);
  if (
    !parentMetadata.isDirectory() ||
    parentMetadata.isSymbolicLink() ||
    !currentUserOwns(parentMetadata) ||
    (parentMetadata.mode & 0o077) !== 0
  ) {
    throw new Error("Owned directory parent is not private");
  }
  const before = await lstat(absolutePath);
  if (!matchesDirectoryIdentity(before, expected)) {
    throw new Error("Owned directory identity changed before quarantine");
  }

  const renameEntry = options.rename ?? rename;
  const removeEntry = options.remove ?? rm;
  const uniqueId = options.uniqueId ?? randomUUID;
  const token = uniqueId();
  const quarantineName =
    options.recoverableName?.(token) ??
    `.reynard-quarantine-p${process.pid}-${token}`;
  const quarantine = join(absoluteParent, quarantineName);

  await options.beforeRename?.();
  await renameEntry(absolutePath, quarantine);
  const moved = await lstat(quarantine);
  if (!matchesDirectoryIdentity(moved, expected)) {
    await preserveIdentityMismatch(
      quarantine,
      absoluteParent,
      renameEntry,
      uniqueId,
    );
    throw new Error("Owned directory identity changed at the quarantine rename");
  }
  await removeEntry(quarantine, { recursive: true, force: false });
}
