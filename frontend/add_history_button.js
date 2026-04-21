const fs = require('fs');
let content = fs.readFileSync('./script.js', 'utf8');

// Find and replace the Load for Edit link section
const oldButton = `<a href="#merchant-form-section" style="text-align: center; padding: 8px; background: rgba(124,58,237,0.1); border-radius: 6px; color: #7c3aed; text-decoration: none; font-size: 13px;">📝 Load for Edit</a>
            </div>
          </div>
        \`;`;

const newButton = `<a href="#merchant-form-section" style="text-align: center; padding: 8px; background: rgba(124,58,237,0.1); border-radius: 6px; color: #7c3aed; text-decoration: none; font-size: 13px;">📝 Load for Edit</a>

              <button type="button" class="btn-history" data-id="\${listing.id}" data-secret="\${secret}" style="width: 100%; margin-top: 10px; padding: 8px; background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid #3b82f6; border-radius: 6px; cursor: pointer; font-size: 12px;">📋 View History</button>
            </div>
          </div>

          <div id="moderationHistory_\${listing.id}" style="display: none; margin-top: 12px;"></div>
        \`;`;

if (content.includes(oldButton)) {
  content = content.replace(oldButton, newButton);
  fs.writeFileSync('./script.js', content, 'utf8');
  console.log('History button and container added');
} else {
  console.error('Could not find button section');
}
