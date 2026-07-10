import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  const request = JSON.parse(line);
  if (Object.prototype.hasOwnProperty.call(request, "expected")) {
    process.stderr.write("request.expected must not be provided\n");
    process.exitCode = 64;
    break;
  }
  const output =
    request.caseId === "unicode-text"
      ? { ...request.input, text: "[deliberately regressed]" }
      : request.caseId === "derived-expected"
        ? { sum: request.input.left + request.input.right }
        : request.input;
  process.stdout.write(`${JSON.stringify(output)}\n`);
}
