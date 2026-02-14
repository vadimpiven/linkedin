---
name: Scrape Connections
description: Opens the LinkedIn connections page, extracts the list of connections, and updates connections.md.
---

# Scrape Connections Skill

This skill is used to keep the list of connections in `connections.md` up to date.

## Usage

1. **Authentication (One-time)**:
   - Run `mise run auth` if not already logged in. This saves the session to `.playwright/storageState.json`.
2. **Action**:
   - Run `mise run connections`.
   - This script:
     - Navigates to the connections page.
     - Scrolls to load connections.
     - Extracts the data using the saved session.
     - Outputs the connections as Markdown table rows.
3. **Post-processing**:
   - Compare the extracted connections with the existing ones in `connections.md`.
   - Add new connections to the top of the table.
   - Set the default category to `Uncategorized`.

## Implementation Details

The extraction relies on `scripts/scrape_full_connections.ts`. The script formats output as Markdown table rows ready for insertion.
