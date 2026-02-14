import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runScript } from "./helpers/run-script.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionsPath = path.join(__dirname, "../connections.md");
const profilesDir = path.join(__dirname, "../profiles");

async function getProfilesToScrape() {
  const content = fs.readFileSync(connectionsPath, "utf-8");
  const lines = content.split("\n");
  const profiles: { name: string; url: string; lineIndex: number }[] = [];

  lines.forEach((line, index) => {
    // We only scrape if it's Uncategorized AND the name is not yet a link
    if (line.includes("| Uncategorized |") && !line.match(/\| \[(.*)\]\(profiles\/.*\) \|/)) {
      const match = line.match(/\| .* \| (.*) \| <(https:\/\/www\.linkedin\.com\/in\/.*\/?)> \|/);
      if (match) {
        profiles.push({
          name: match[1].trim(),
          url: match[2].trim(),
          lineIndex: index,
        });
      }
    }
  });

  return profiles;
}

function updateMarkdownLink(name: string, folderName: string) {
  const content = fs.readFileSync(connectionsPath, "utf-8");
  const lines = content.split("\n");

  const updatedLines = lines.map((line) => {
    // Only update if it matches the name and isn't already linked
    if (line.includes(`| ${name} |`) && line.includes("| Uncategorized |")) {
      return line.replace(`| ${name} |`, `| [${name}](profiles/${folderName}) |`);
    }
    return line;
  });

  fs.writeFileSync(connectionsPath, updatedLines.join("\n"));
}

runScript("Batch Scrape Profiles", async () => {
  const allProfiles = await getProfilesToScrape();
  const limit = parseInt(process.argv[2] || "5", 10);
  const profilesToScrape = allProfiles.slice(0, limit);

  console.log(
    `Found ${allProfiles.length} uncategorized & unscraped profiles. Scraping the first ${profilesToScrape.length}...`,
  );

  if (profilesToScrape.length === 0) {
    console.log("No new profiles to scrape.");
    return;
  }

  const { execSync } = await import("node:child_process");

  for (const profile of profilesToScrape) {
    console.log(`\n--- Scraping ${profile.name} ---`);
    console.log(`URL: ${profile.url}`);

    try {
      execSync(`node scripts/scrape_full_profile.ts ${profile.url}`, {
        stdio: "inherit",
      });

      const dateStr = new Date().toISOString().split("T")[0];
      const safeName = profile.name.toLowerCase().replace(/\s+/g, "-");

      const folders = fs.readdirSync(profilesDir);
      const folderName =
        folders.find((f) => f.startsWith(dateStr) && f.includes(safeName)) ||
        `${dateStr}_${safeName}`;

      if (fs.existsSync(path.join(profilesDir, folderName))) {
        console.log(`Linking ${profile.name} to profiles/${folderName} in connections.md`);
        updateMarkdownLink(profile.name, folderName);
      }
    } catch (error) {
      console.error(`Failed to scrape ${profile.name}:`, error);
    }

    // Add a random delay between profiles (3-7 seconds)
    const delay = Math.floor(Math.random() * 4000) + 3000;
    console.log(`Waiting ${delay}ms before next profile...`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Batch Cooldown: Extra pause every 10 profiles
    const profileIndex = profilesToScrape.indexOf(profile) + 1;
    if (profileIndex % 10 === 0 && profileIndex !== profilesToScrape.length) {
      const cooldown = 30000 + Math.floor(Math.random() * 30000);
      console.log(
        `\nReached ${profileIndex} profiles. Taking a longer cooldown of ${Math.round(cooldown / 1000)}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, cooldown));
    }
  }

  console.log("\nBatch scraping complete!");
});
