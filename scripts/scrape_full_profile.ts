import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScript } from "./helpers/run-script.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDataDir = path.join(__dirname, "../.playwright/user_data");

async function scrapeProfile(url: string) {
  // Use the SAME persistent context as the auth script
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true, // Can change to false for debugging
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to ${url}...`);
    // Increase timeout for LinkedIn's redirects
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Check if we are redirected to login
    if (
      page.url().includes("linkedin.com/checkpoint/lg/login") ||
      page.url().includes("linkedin.com/login")
    ) {
      console.error("ERROR: Not logged in! Please run 'mise run auth' first and complete 2FA.");
      return;
    }

    // Wait for profile content
    await page.waitForSelector("h1", { timeout: 20000 });

    // Internal Throttling: Random delay to mimic human reading speed
    const jitter = Math.floor(Math.random() * 2000) + 1000;
    await page.waitForTimeout(jitter);

    // Extract Profile Data
    const profileData = await page.evaluate(() => {
      const name = document.querySelector("h1")?.textContent?.trim() || "";
      const headline =
        document.querySelector(".text-body-medium.break-words")?.textContent?.trim() ||
        document.querySelector("[data-generated-suggestion-target]")?.textContent?.trim() ||
        "";

      let about = "";
      const aboutHeader = Array.from(document.querySelectorAll("h2, span")).find(
        (el) => el.textContent?.trim() === "About",
      );
      if (aboutHeader) {
        const section = aboutHeader.closest("section");
        if (section) {
          about = section.querySelector(".inline-show-more-text")?.textContent?.trim() || "";
        }
      }

      const experience: any[] = [];
      const expSection = document.getElementById("experience")?.parentElement;
      if (expSection) {
        expSection.querySelectorAll("li.artdeco-list__item").forEach((item) => {
          const role = item.querySelector(".t-bold span")?.textContent?.trim();
          const company = item
            .querySelector(".t-14.t-normal span")
            ?.textContent?.split("·")[0]
            .trim();
          const dates = item.querySelector(".t-14.t-black--light span")?.textContent?.trim();
          if (role || company) experience.push({ role, company, dates });
        });
      }

      const education: any[] = [];
      const eduSection = document.getElementById("education")?.parentElement;
      if (eduSection) {
        eduSection.querySelectorAll("li.artdeco-list__item").forEach((item) => {
          const school = item.querySelector(".t-bold span")?.textContent?.trim();
          const degree = item.querySelector(".t-14.t-normal span")?.textContent?.trim();
          if (school) education.push({ school, degree });
        });
      }

      const skills: string[] = [];
      const skillsSection = document.getElementById("skills")?.parentElement;
      if (skillsSection) {
        skillsSection.querySelectorAll(".hoverable-link-text span").forEach((span) => {
          const skill = span.textContent?.trim();
          if (skill && !skills.includes(skill) && !skill.includes("endorsement")) {
            skills.push(skill);
          }
        });
      }

      return {
        name,
        headline,
        about,
        experience,
        education,
        skills: skills.slice(0, 10),
        url: window.location.href.split("?")[0],
        scrapedAt: new Date().toISOString(),
      };
    });

    // Navigate to Activity/Posts
    const activityUrl = `${url.replace(/\/$/, "")}/recent-activity/shares/`;
    console.log(`Navigating to activity: ${activityUrl}...`);
    await page.goto(activityUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for posts
    await page.waitForTimeout(2000);

    const postsData = await page.evaluate(() => {
      const posts: any[] = [];
      document.querySelectorAll(".update-components-text").forEach((postEl) => {
        const content = postEl.textContent?.trim();
        const container = postEl.closest(".feed-shared-update-v2");
        const date = container
          ?.querySelector(".update-components-text-view__posted-at")
          ?.textContent?.trim();
        const link = (
          container?.querySelector("a.update-components-article__meta") as HTMLAnchorElement
        )?.href;

        if (content) {
          posts.push({
            content,
            date,
            link,
            isEnglish: true,
          });
        }
      });
      return posts.slice(0, 10);
    });

    // Save Results
    const dateStr = new Date().toISOString().split("T")[0];
    const safeName = profileData.name
      ? profileData.name.toLowerCase().replace(/\s+/g, "-")
      : "unknown";
    const folderName = `${dateStr}_${safeName}`;
    const dirPath = path.join(__dirname, "../profiles", folderName);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(path.join(dirPath, "profile.json"), JSON.stringify(profileData, null, 2));
    fs.writeFileSync(path.join(dirPath, "posts.json"), JSON.stringify(postsData, null, 2));

    console.log(`Successfully scraped and saved to ${dirPath}`);
  } catch (error) {
    await page.screenshot({ path: `error_${new Date().getTime()}.png` });
    throw error;
  } finally {
    await context.close();
  }
}

const url = process.argv[2];
if (!url) {
  console.error("Please provide a LinkedIn profile URL.");
  process.exit(1);
}

runScript("Scrape LinkedIn Profile", async () => {
  await scrapeProfile(url);
});
