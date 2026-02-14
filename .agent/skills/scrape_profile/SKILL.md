---
name: Scrape Profile
description: Opens a LinkedIn profile, extracts the data using scrape_profile.js, and returns the result.
---

# Scrape Profile Skill

This skill is used to extract detailed information from a LinkedIn profile.

## Usage

1. **Authentication (One-time)**:
   - Run `mise run auth` if not already logged in. This opens a browser for manual login and saves the session.
2. **Argument**: A LinkedIn profile URL (e.g., `https://www.linkedin.com/in/username/`).
3. **Action**:
   - Run `mise run scrape <url>`.
   - This script automatically:
     - Navigates to the profile and activity pages.
     - Extracts data using the local session.
     - Creates the directory in `profiles/` named `YYYY-MM-DD_name-surname`.
     - Saves `profile.json` and `posts.json`.
4. **Output**: A directory containing `profile.json` and `posts.json`.

## Data Schema (profile.json)

```json
{
  "name": "Full Name",
  "headline": "Headline",
  "about": "About text",
  "experience": [{"role": "...", "company": "...", "dates": "..."}],
  "education": [{"school": "...", "degree": "..."}],
  "skills": ["Skill 1", "Skill 2"],
  "url": "Profile URL",
  "scrapedAt": "ISO Timestamp"
}
```

## Data Schema (posts.json)

```json
[
  {
    "content": "Post content...",
    "date": "2 weeks ago",
    "link": "Post URL",
    "isEnglish": true
  }
]
```
