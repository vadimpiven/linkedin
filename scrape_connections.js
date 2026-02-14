/**
 * LinkedIn Connections Scraper
 * 
 * This script extracts the latest LinkedIn connections from the current page
 * and formats them as Markdown table rows.
 * 
 * To use:
 * 1. Go to https://www.linkedin.com/mynetwork/invite-connect/connections/
 * 2. Open Browser Console (F12)
 * 3. Paste this script and press Enter
 */

(async () => {
    const MAX_CONNECTIONS = 100;
    const connectionRows = [];

    // 1. Find all text nodes containing "Connected on "
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const dateNodes = [];
    let currentNode;
    while (currentNode = walker.nextNode()) {
        if (currentNode.textContent.includes('Connected on ')) {
            dateNodes.push(currentNode);
        }
    }

    // 2. Extract data for each connection
    for (let i = 0; i < Math.min(dateNodes.length, MAX_CONNECTIONS); i++) {
        const dateNode = dateNodes[i];
        const connectedDate = dateNode.textContent.replace('Connected on ', '').trim();

        // Find the profile link by walking up the DOM tree from the date node
        let container = dateNode.parentElement;
        let profileLinkEl = null;

        // Search up to 10 levels up for a link containing "/in/"
        for (let depth = 0; depth < 10; depth++) {
            profileLinkEl = container.querySelector('a[href*="/in/"]');
            if (profileLinkEl) break;
            container = container.parentElement;
            if (!container) break;
        }

        if (profileLinkEl) {
            const name = profileLinkEl.innerText.split('\n')[0].trim();
            const profileUrl = profileLinkEl.href.split('?')[0];

            // Format as Markdown table row
            connectionRows.push(`| ${connectedDate} | ${name} | <${profileUrl}> | Uncategorized |`);
        }
    }

    // 3. Output results
    if (connectionRows.length > 0) {
        console.log(connectionRows.join('\n'));
    } else {
        console.error('No connections found. Make sure you are on the LinkedIn connections page.');
    }
})();
