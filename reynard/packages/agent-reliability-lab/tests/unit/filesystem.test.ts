import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import {
  directoryIdentity,
  normalizePrivateDirectory,
  removeOwnedDirectory,
} from "../../src/filesystem.js";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("filesystem directory identity", () => {
  test("never chmods a replacement installed after the trusted directory is opened", async () => {
    const root = await temporaryDirectory("reynard-directory-handle-race-");
    const directory = join(root, "runs");
    const original = join(root, "original-runs");
    const sentinel = join(directory, "keep.txt");
    await mkdir(directory, { mode: 0o755 });
    await chmod(directory, 0o755);

    await expect(
      normalizePrivateDirectory(directory, {
        beforeChmod: async () => {
          await rename(directory, original);
          await mkdir(directory, { mode: 0o755 });
          await chmod(directory, 0o755);
          await writeFile(sentinel, "foreign replacement");
        },
      }),
    ).rejects.toThrow(/identity/i);

    expect(await readFile(sentinel, "utf8")).toBe("foreign replacement");
    expect((await stat(directory)).mode & 0o777).toBe(0o755);
    expect((await stat(original)).mode & 0o777).toBe(0o700);
  });

  test("never recursively removes a replacement observed at the quarantine rename", async () => {
    const root = await temporaryDirectory("reynard-quarantine-race-");
    const parent = join(root, "private");
    const owned = join(parent, "owned-stage");
    const original = join(parent, "original-stage");
    const sentinel = join(owned, "keep.txt");
    await mkdir(owned, { recursive: true, mode: 0o700 });
    const expected = directoryIdentity(await lstat(owned));
    const recursivelyRemovedInodes: number[] = [];
    let attemptedRestore = false;

    await expect(
      removeOwnedDirectory(owned, parent, expected, {
        beforeRename: async () => {
          await rename(owned, original);
          await mkdir(owned, { mode: 0o700 });
          await writeFile(sentinel, "foreign replacement");
        },
        rename: async (source, target) => {
          if (source !== owned && target === owned) attemptedRestore = true;
          await rename(source, target);
        },
        remove: async (path, options) => {
          recursivelyRemovedInodes.push((await lstat(path)).ino);
          await rm(path, options);
        },
      }),
    ).rejects.toThrow(/identity/i);

    const [preservedName] = (await readdir(parent)).filter((name) =>
      name.startsWith(".reynard-preserved-foreign-"),
    );
    expect(attemptedRestore).toBe(false);
    expect(preservedName).toBeDefined();
    if (preservedName === undefined) return;
    const preserved = join(parent, preservedName);
    expect(await readFile(join(preserved, "keep.txt"), "utf8")).toBe(
      "foreign replacement",
    );
    expect(recursivelyRemovedInodes).not.toContain((await lstat(preserved)).ino);
    expect((await stat(original)).isDirectory()).toBe(true);
  });
});
