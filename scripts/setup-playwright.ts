import process from "node:process";
import { runCommand } from "./helpers/run-command.ts";
import { runScript } from "./helpers/run-script.ts";

runScript("Playwright setup", async () => {
  if (process.env.MISE_ENV !== "docker") {
    await runCommand("pnpm", ["exec", "playwright", "install", "chromium"]);
  }
});
