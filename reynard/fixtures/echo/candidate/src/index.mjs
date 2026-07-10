import { createInterface } from "node:readline";

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalize(value[key])]),
    );
  }
  return value;
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  const request = JSON.parse(line);
  if (Object.prototype.hasOwnProperty.call(request, "expected")) {
    process.stderr.write("request.expected must not be provided\n");
    process.exitCode = 64;
    break;
  }
  const output =
    request.caseId === "derived-expected"
      ? { sum: request.input.left + request.input.right }
      : normalize(request.input);
  process.stdout.write(`${JSON.stringify(output)}\n`);
}
