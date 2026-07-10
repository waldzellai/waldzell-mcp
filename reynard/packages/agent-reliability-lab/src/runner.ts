import { constants, open } from "node:fs/promises";
import { resolve } from "node:path";
import { TextDecoder } from "node:util";

import { sha256 } from "./canonical-json.js";
import {
  CandidateRequestSchema,
  EvaluationCaseSchema,
  V1_INPUT_LIMITS,
  type CandidateRequest,
  type EvaluationCase,
  type LoadedEvaluationCases,
} from "./contracts.js";
import type { Result } from "./errors.js";

function invalidInput<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "InvalidInput", message } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readCaseFileOnce(path: string): Promise<Buffer> {
  const handle = await open(
    resolve(path),
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  try {
    const before = await handle.stat({ bigint: true });
    if (!before.isFile()) throw new Error("Case input must be a regular file");
    if (before.size > BigInt(V1_INPUT_LIMITS.caseFileBytes)) {
      throw new Error(
        `Case file exceeds ${V1_INPUT_LIMITS.caseFileBytes} bytes`,
      );
    }
    const chunks: Buffer[] = [];
    let byteLength = 0;
    for (;;) {
      const chunk = Buffer.allocUnsafe(
        Math.min(65_536, V1_INPUT_LIMITS.caseFileBytes + 1 - byteLength),
      );
      const { bytesRead } = await handle.read(chunk, 0, chunk.byteLength, null);
      if (bytesRead === 0) break;
      byteLength += bytesRead;
      if (byteLength > V1_INPUT_LIMITS.caseFileBytes) {
        throw new Error(
          `Case file exceeds ${V1_INPUT_LIMITS.caseFileBytes} bytes`,
        );
      }
      chunks.push(chunk.subarray(0, bytesRead));
    }
    const after = await handle.stat({ bigint: true });
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeNs !== after.mtimeNs ||
      before.ctimeNs !== after.ctimeNs
    ) {
      throw new Error("Case file changed while it was being read");
    }
    return Buffer.concat(chunks, byteLength);
  } finally {
    await handle.close();
  }
}

export async function loadEvaluationCases(
  caseFilePath: string,
): Promise<Result<LoadedEvaluationCases>> {
  try {
    const bytes = await readCaseFileOnce(caseFilePath);
    const rawText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!Buffer.from(rawText, "utf8").equals(bytes)) {
      return invalidInput(
        "Case file must be canonical UTF-8 without a byte-order mark",
      );
    }
    return parseEvaluationCasesText(rawText);
  } catch (error) {
    return invalidInput(`Could not load cases: ${errorMessage(error)}`);
  }
}

export function parseEvaluationCasesText(
  rawText: string,
): Result<LoadedEvaluationCases> {
  const bytes = Buffer.from(rawText, "utf8");
  const roundTripped = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (roundTripped !== rawText) {
    return invalidInput("Case text must round-trip exactly through UTF-8");
  }
  if (bytes.byteLength === 0) {
    return invalidInput("Case file cannot be empty");
  }
  if (bytes.byteLength > V1_INPUT_LIMITS.caseFileBytes) {
    return invalidInput(
      `Case file exceeds ${V1_INPUT_LIMITS.caseFileBytes} bytes`,
    );
  }

  const lines = rawText.split("\n");
  if (rawText.endsWith("\n")) lines.pop();
  if (lines.length > V1_INPUT_LIMITS.caseCount) {
    return invalidInput(`Case count exceeds ${V1_INPUT_LIMITS.caseCount}`);
  }

  const cases: EvaluationCase[] = [];
  const caseIds = new Set<string>();
  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const lineBytes = Buffer.byteLength(line, "utf8");
    if (lineBytes > V1_INPUT_LIMITS.caseBytes) {
      return invalidInput(
        `Case at line ${lineNumber} exceeds ${V1_INPUT_LIMITS.caseBytes} bytes`,
      );
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(line);
    } catch {
      return invalidInput(`Malformed JSON at line ${lineNumber}`);
    }
    const parsed = EvaluationCaseSchema.safeParse(decoded);
    if (!parsed.success) {
      return invalidInput(
        `Invalid case at line ${lineNumber}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    if (caseIds.has(parsed.data.id)) {
      return invalidInput(
        `Duplicate case ID at line ${lineNumber}: ${parsed.data.id}`,
      );
    }
    caseIds.add(parsed.data.id);
    cases.push({
      id: parsed.data.id,
      input: parsed.data.input,
      expected: parsed.data.expected,
    });
  }
  return {
    ok: true,
    value: { rawText, cases, digest: sha256(bytes) },
  };
}

export function createCandidateRequests(
  cases: readonly EvaluationCase[],
  seed: number,
): Result<readonly CandidateRequest[]> {
  const requests: CandidateRequest[] = [];
  for (const evaluationCase of cases) {
    const request = CandidateRequestSchema.safeParse({
      schemaVersion: 1,
      caseId: evaluationCase.id,
      seed,
      input: structuredClone(evaluationCase.input),
    });
    if (!request.success) {
      return invalidInput(
        `Could not create candidate request: ${request.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    requests.push({
      schemaVersion: request.data.schemaVersion,
      caseId: request.data.caseId,
      seed: request.data.seed,
      input: request.data.input,
    });
  }
  return { ok: true, value: requests };
}
