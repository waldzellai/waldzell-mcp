import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const _line of lines) {
  process.stdout.write("not-json\n");
}
