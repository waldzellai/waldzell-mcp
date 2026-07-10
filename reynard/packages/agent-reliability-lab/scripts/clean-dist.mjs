import { rm } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";

const packageDist = fileURLToPath(new URL("../dist/", import.meta.url));

await rm(packageDist, { recursive: true, force: true });
