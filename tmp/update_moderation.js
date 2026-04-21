const fs = require('fs');
const content = fs.readFileSync('./script.js', 'utf8');

const modFuncStart = content.indexOf('async function moderateListing(id, newStatus, secret) {');
const modFuncEnd = content.indexOf('}', content.indexOf('Failed to contact backend for moderation', modFuncStart)) + 1;

if (modFuncStart > -1 && modFuncEnd > -1) {
  const before = content.substring(0, modFuncStart);
  const after = content.substring(modFuncEnd);
  
  const newMod = `async function moderateListing(id, newStatus, secret) {
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

  fs.writeFileSync('./script.js', before + newMod + after, 'utf8');
  console.log('✅ Updated moderateListing function with reason support');
} else {
  console.error('❌ Could not find moderateListing function');
}
