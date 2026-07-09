import { constants, open } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalJson, sha256 } from "./canonical-json.js";
import {
  CandidateRequestSchema,
  EvaluationCaseSchema,
  V1_INPUT_LIMITS,
  type CandidateRequest,
  type EvaluationCase,
} from "./contracts.js";
import type { Result } from "./errors.js";

export interface LoadedEvaluationCases {
  readonly cases: readonly EvaluationCase[];
  readonly digest: `sha256:${string}`;
}

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
    const decoded: unknown = JSON.parse(bytes.toString("utf8"));
    if (!Array.isArray(decoded)) {
      return invalidInput("Case file must contain a JSON array");
    }
    if (decoded.length > V1_INPUT_LIMITS.caseCount) {
      return invalidInput(
        `Case count exceeds ${V1_INPUT_LIMITS.caseCount}`,
      );
    }
    const cases: EvaluationCase[] = [];
    for (const [index, value] of decoded.entries()) {
      const parsed = EvaluationCaseSchema.safeParse(value);
      if (!parsed.success) {
        return invalidInput(
          `Invalid case at index ${index}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
        );
      }
      const caseByteLength = Buffer.byteLength(canonicalJson(parsed.data));
      if (caseByteLength > V1_INPUT_LIMITS.caseBytes) {
        return invalidInput(
          `Case at index ${index} exceeds ${V1_INPUT_LIMITS.caseBytes} bytes`,
        );
      }
      cases.push({
        id: parsed.data.id,
        input: parsed.data.input,
        expected: parsed.data.expected,
      });
    }
    return { ok: true, value: { cases, digest: sha256(bytes) } };
  } catch (error) {
    return invalidInput(`Could not load cases: ${errorMessage(error)}`);
  }
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
