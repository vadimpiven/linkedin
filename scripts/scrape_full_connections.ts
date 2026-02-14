import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScript } from "./helpers/run-script.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDataDir = path.join(__dirname, "../.playwright/user_data");

async function scrapeConnections() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    const url = "https://www.linkedin.com/mynetwork/invite-connect/connections/";
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Check if we are redirected to login
    if (
      page.url().includes("linkedin.com/checkpoint/lg/login") ||
      page.url().includes("linkedin.com/login")
    ) {
      console.error("ERROR: Not logged in! Please run 'mise run auth' first and complete 2FA.");
      return;
    }

    // Wait for connections list
    await page.waitForSelector("li.mn-connection-card", { timeout: 20000 });

    // Scroll to load some connections
    console.log("Scrolling to load connections...");
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(1000);
    }

    const connections = await page.evaluate(() => {
      const MAX_CONNECTIONS = 100;
      const results: any[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const dateNodes: Text[] = [];
      let currentNode: Node | null;
      while ((currentNode = walker.nextNode())) {
        if (currentNode.textContent?.includes("Connected on ")) {
          dateNodes.push(currentNode as Text);
        }
      }

      for (let i = 0; i < Math.min(dateNodes.length, MAX_CONNECTIONS); i++) {
        const dateNode = dateNodes[i];
        const connectedDate = dateNode.textContent?.replace("Connected on ", "").trim() || "";
        let container = dateNode.parentElement;
        let profileLinkEl: HTMLAnchorElement | null = null;

        for (let depth = 0; depth < 10; depth++) {
          if (!container) break;
          profileLinkEl = container.querySelector('a[href*="/in/"]');
          if (profileLinkEl) break;
          container = container.parentElement;
        }

        if (profileLinkEl) {
          const name = profileLinkEl.textContent?.split("\n")[0].trim() || "";
          const profileUrl = profileLinkEl.href.split("?")[0];
          results.push({ connectedDate, name, profileUrl });
        }
      }
      return results;
    });

    const rows = connections.map(
      (c) => `| ${c.connectedDate} | ${c.name} | <${c.profileUrl}> | Uncategorized |`,
    );
    console.log(rows.join("\n"));
  } catch (error) {
    await page.screenshot({ path: `error_connections_${new Date().getTime()}.png` });
    throw error;
  } finally {
    await context.close();
  }
}

runScript("Scrape LinkedIn Connections", async () => {
  await scrapeConnections();
});
