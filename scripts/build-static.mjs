import { cp, mkdir, rm } from "node:fs/promises";

await rm("out", { recursive: true, force: true });
await mkdir("out", { recursive: true });
await cp("static", "out", { recursive: true });
console.log("Static site built in out/");
