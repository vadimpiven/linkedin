import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScript } from "./helpers/run-script.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDataDir = path.join(__dirname, "../.playwright/user_data");

runScript("LinkedIn Auth Setup", async () => {
  console.log("Opening browser for LinkedIn login...");
  console.log("Please login to LinkedIn and COMPLETE 2FA in the browser.");

  // Ensure the directory exists
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Use a persistent context - this stores fingerprints, local storage, and cookies like a real browser
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  await page.goto("https://www.linkedin.com/login");

  console.log("WAITING FOR LOGIN... Please complete 2FA if prompted.");

  try {
    // Wait for the feed page, but with a long timeout (5 mins)
    await page.waitForURL("**/feed/**", { timeout: 300000 });
    console.log("SUCCESS: Login detected and session saved in persistent profile.");

    // Give it a few seconds to settle and save all background cookies
    await page.waitForTimeout(5000);
  } catch {
    console.error("Timeout waiting for login. If you finished, just close the browser.");
  } finally {
    await context.close();
  }
});
