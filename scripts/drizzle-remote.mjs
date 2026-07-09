import { spawnSync } from "node:child_process";

process.env.DRIZZLE_TARGET = "remote";

const args = process.argv.slice(2);
const result = spawnSync("drizzle-kit", args, {
	stdio: "inherit",
	shell: true,
	env: process.env,
});

process.exit(result.status ?? 1);
