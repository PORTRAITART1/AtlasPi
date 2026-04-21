const fs = require('fs');
let content = fs.readFileSync('./script.js', 'utf8');

// Find where btn-moderate listeners are added
const searchStr = `document.querySelectorAll(".btn-moderate").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const statusSelect = document.getElementById(\`moderationStatus_\${id}\`);
          const newStatus = statusSelect ? statusSelect.value : "approved";
          const adminSec = btn.getAttribute("data-secret");

          await moderateListing(id, newStatus, adminSec);
        });
      });`;

const newCode = `document.querySelectorAll(".btn-moderate").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const statusSelect = document.getElementById(\`moderationStatus_\${id}\`);
          const newStatus = statusSelect ? statusSelect.value : "approved";
          const adminSec = btn.getAttribute("data-secret");

          await moderateListing(id, newStatus, adminSec);
        });
      });

      // Add history button listeners
      document.querySelectorAll(".btn-history").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const secret = btn.getAttribute("data-secret");
          const historyContainer = document.getElementById("moderationHistory_" + id);
          if (historyContainer.style.display === "none") {
            historyContainer.style.display = "block";
            await loadModerationHistory(id, secret);
          } else {
            historyContainer.style.display = "none";
          }
        });
      });`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, newCode);
  fs.writeFileSync('./script.js', content, 'utf8');
  console.log('History button event listeners added');
} else {
  console.error('Could not find btn-moderate section');
}
