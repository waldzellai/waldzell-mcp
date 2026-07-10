import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  const request = JSON.parse(line);
  await new Promise((resolve) => setTimeout(resolve, 30_000));
  process.stdout.write(`${JSON.stringify(request.input)}\n`);
}
