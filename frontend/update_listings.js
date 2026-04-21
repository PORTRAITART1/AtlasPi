#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

// Find the section where pending listings forEach loop builds the HTML
const loopStart = content.indexOf('listings.forEach((listing) => {');
const loopEnd = content.indexOf('document.querySelectorAll(".btn-moderate")', loopStart);

if (loopStart > -1 && loopEnd > loopStart) {
  console.log('Found loop section');
  
  const beforeLoop = content.substring(0, loopStart);
  const afterLoop = content.substring(loopEnd);

  const newLoop = `listings.forEach((listing) => {
        const item = document.createElement("div");
        item.style.background = "rgba(220,38,38,0.08)";
        item.style.border = "2px solid rgba(220,38,38,0.3)";
        item.style.borderRadius = "12px";
        item.style.padding = "16px";
        item.style.marginBottom = "16px";
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";
        item.style.transition = "opacity 0.3s, transform 0.3s";

        const currentReason = listing.moderation_reason ? listing.moderation_reason.substring(0, 60) + (listing.moderation_reason.length > 60 ? '...' : '') : "(none)";

        item.innerHTML = \`
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="margin: 0 0 12px 0;"><strong style="color: #7c3aed;">ID #\${listing.id}</strong> | UUID: \${(listing.listing_uuid || "-").substring(0, 8)}...</p>
              <p><strong>Name:</strong> \${listing.listing_public_name || "-"}</p>
              <p><strong>Business:</strong> \${listing.business_name || "-"}</p>
              <p><strong>Type:</strong> \${listing.profile_type || "-"}</p>
              <p><strong>Domain:</strong> \${listing.domain || "-"}</p>
              <p><strong>Category:</strong> \${listing.category || "-"}</p>
              <p><strong>Location:</strong> \${listing.city || "-"}, \${listing.country || "-"}</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">\${listing.listing_status || "-"}</span></p>
              <p><strong>Current Reason:</strong> <span style="color: #a78bfa;">\${currentReason}</span></p>
            </div>

            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
              <div style="margin-bottom: 12px;">
                <label for="moderationStatus_\${listing.id}" style="display: block; font-size: 13px; margin-bottom: 6px;"><strong>Change Status To:</strong></label>
                <select id="moderationStatus_\${listing.id}" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white;">
                  <option value="pending_review">📋 Pending Review</option>
                  <option value="approved" selected>✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="suspended">⛔ Suspended</option>
                </select>
              </div>

              <div style="margin-bottom: 12px;">
                <label for="moderationReason_\${listing.id}" style="display: block; font-size: 12px; margin-bottom: 4px;"><strong>Moderation Reason (optional)</strong></label>
                <textarea id="moderationReason_\${listing.id}" placeholder="e.g., Missing documents, incomplete info, duplicate listing..." style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white; min-height: 60px; resize: vertical; font-family: monospace; font-size: 11px;"></textarea>
              </div>

              <button type="button" class="btn-moderate" data-id="\${listing.id}" data-secret="\${secret}" style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: white; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
                ✓ Apply Moderation
              </button>

              <a href="#merchant-form-section" style="text-align: center; padding: 8px; background: rgba(124,58,237,0.1); border-radius: 6px; color: #7c3aed; text-decoration: none; font-size: 13px;">📝 Load for Edit</a>
            </div>
          </div>
        \`;

        pendingListingsList.appendChild(item);

        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, 50);
      });

      `;

  content = beforeLoop + newLoop + afterLoop;
  fs.writeFileSync(scriptPath, content, 'utf8');
  console.log('✅ Updated loadPendingListings listing display with moderation_reason textarea');
} else {
  console.error('❌ Could not find loop section');
  console.error('Start:', loopStart, 'End:', loopEnd);
}
