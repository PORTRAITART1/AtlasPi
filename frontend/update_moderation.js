#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

// Find the moderateListing function and update it
const moderationStart = content.indexOf('async function moderateListing(id, newStatus, secret) {');
const moderationEnd = content.indexOf('\n  }', content.indexOf('Failed to contact backend for moderation', moderationStart)) + 4;

if (moderationStart > -1 && moderationEnd > moderationStart) {
  const newModerationFunc = `async function moderateListing(id, newStatus, secret) {
    if (!moderationStatus) return;

    const reasonTextarea = document.getElementById('moderationReason_' + id);
    const reason = reasonTextarea ? reasonTextarea.value.trim() : '';

    moderationStatus.innerHTML = '<p style="margin: 0;">⏳ Moderating listing #' + id + '...</p>';

    try {
      const response = await fetch(API_BASE_URL + '/api/merchant-listings/moderate/' + id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({
          listing_status: newStatus,
          moderation_reason: reason
        })
      });

      const data = await response.json();

      if (data.ok) {
        const reasonDisplay = reason ? ' | Reason: ' + reason : '';
        moderationStatus.innerHTML = '<p style="margin: 0; color: #10b981;">✅ Listing #' + id + ' status changed to <strong>' + newStatus + '</strong>' + reasonDisplay + '. Reloading...</p>';
        
        setTimeout(() => {
          loadPendingListings();
        }, 1500);
      } else {
        moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Moderation error: ' + (data.error || 'Unknown error') + '</p>';
      }
    } catch (error) {
      moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Failed to contact backend for moderation.</p>';
    }
  }`;

  content = content.substring(0, moderationStart) + newModerationFunc + content.substring(moderationEnd);
  fs.writeFileSync(scriptPath, content, 'utf8');
  console.log('✅ Updated moderateListing function');
} else {
  console.error('❌ Could not find moderateListing function');
  console.error('Start:', moderationStart, 'End:', moderationEnd);
}
