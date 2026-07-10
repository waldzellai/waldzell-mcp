import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  const request = JSON.parse(line);
  writeFileSync(request.input.sentinel, "host execution occurred\n", {
    flag: "wx",
  });
  process.stdout.write(`${JSON.stringify(request.input)}\n`);
}
