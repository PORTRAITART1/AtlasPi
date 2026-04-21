const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// Find and wrap the moderation status section with proper ID
const modStatusStart = content.indexOf('id=\"moderationStatus\"');
if (modStatusStart > -1) {
  // Find the parent div that should wrap the moderation section
  const beforeModStatus = content.substring(0, modStatusStart);
  const lastDivBefore = beforeModStatus.lastIndexOf('<div');
  
  // Look for the section containing moderationStatus and pendingListingsList
  const modDiv = content.indexOf('<div id=\"moderationStatus\"');
  const pendingDiv = content.indexOf('id=\"pendingListingsList\"');
  
  if (modDiv > -1 && pendingDiv > -1 && pendingDiv > modDiv) {
    // Check if there's a wrapper we can ID
    console.log('Found moderation and pending listings elements');
    console.log('moderation status at:', modDiv);
    console.log('pending listings at:', pendingDiv);
  }
}

// Add a wrapper for moderation history if not present
if (!content.includes('id=\"moderation-history-section\"')) {
  // Create a marker after pendingListingsList closes
  const pendingEnd = content.indexOf('</div>', content.indexOf('id=\"pendingListingsList\"'));
  if (pendingEnd > -1) {
    // Insert wrapper div for history section
    const historyWrapper = '<div id="moderation-history-section" style="margin-top: 20px;"></div>';
    content = content.substring(0, pendingEnd + 6) + historyWrapper + content.substring(pendingEnd + 6);
    console.log('Added moderation-history-section wrapper');
  }
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('HTML updated with section IDs');
