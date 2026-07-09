import { z } from "zod";

export type LabError =
  | { readonly _tag: "InvalidInput"; readonly message: string }
  | { readonly _tag: "SandboxUnavailable"; readonly message: string }
  | { readonly _tag: "ExecutionFailed"; readonly message: string }
  | { readonly _tag: "EvaluationFailed"; readonly message: string }
  | { readonly _tag: "ArtifactWriteFailed"; readonly message: string };

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: LabError };

const errorMessageSchema = z.string().min(1);

export const LabErrorSchema = z.discriminatedUnion("_tag", [
  z
    .object({
      _tag: z.literal("InvalidInput"),
      message: errorMessageSchema,
    })
    .strict(),
  z
    .object({
      _tag: z.literal("SandboxUnavailable"),
      message: errorMessageSchema,
    })
    .strict(),
  z
    .object({
      _tag: z.literal("ExecutionFailed"),
      message: errorMessageSchema,
    })
    .strict(),
  z
    .object({
      _tag: z.literal("EvaluationFailed"),
      message: errorMessageSchema,
    })
    .strict(),
  z
    .object({
      _tag: z.literal("ArtifactWriteFailed"),
      message: errorMessageSchema,
    })
    .strict(),
]);
