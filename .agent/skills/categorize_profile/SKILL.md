---
name: Categorize Profile
description: Tools and instructions for extracting LinkedIn profile data and categorizing connections based on a predefined strategy.
---

# Categorize Profile Skill

This skill helps in efficiently processing LinkedIn profiles to categorize connections according to the `strategy.md` document.

## Components

1. **Extraction Script**: `scripts/scrape_profile.js` - A browser-side script to extract name, headline, experience, education, and recent posts.
2. **Analysis Logic**: A set of criteria derived from `strategy.md` to be applied to the extracted data.

## Workflow

1. **Open Profile**: Navigate to the LinkedIn profile URL.
2. **Extract Data**: Run the extraction script in the browser console.
3. **Analyze**: Use the extracted JSON data to determine the category.
    - Check `profile.md` for Peer/Alumnus matches.
    - Check `strategy.md` for professional role matches (Acquisition, Executive, Tech Leader, Contributor).
    - If it's a Leader/Contributor, check recent posts in the extraction data.
4. **Update**: Mark the category in `connections.md`.

## Data Schema

The extraction script returns:

```json
{
  "name": "Full Name",
  "headline": "Current Professional Headline",
  "experience": [{ "company": "...", "role": "..." }],
  "education": [{ "school": "..." }],
  "recentPosts": ["Post content 1", "Post content 2"]
}
```
