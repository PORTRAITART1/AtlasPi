  async function loadModerationHistory(listingId, secret) {
    const historyContainer = document.getElementById('moderationHistory_' + listingId);
    if (!historyContainer) return;

    historyContainer.innerHTML = '<p style="margin: 0; color: #7c3aed;">⏳ Loading history...</p>';

    try {
      const response = await fetch(API_BASE_URL + '/api/merchant-listings/moderation-history/' + listingId, {
        method: 'GET',
        headers: {
          'x-admin-secret': secret
        }
      });

      const data = await response.json();

      if (!data.ok) {
        historyContainer.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Error: ' + (data.error || 'Failed to load history') + '</p>';
        return;
      }

      if (!data.history || data.history.length === 0) {
        historyContainer.innerHTML = '<p style="margin: 0; color: #3b82f6;">ℹ️ No moderation history yet.</p>';
        return;
      }

      let html = '<div style="margin-top: 12px; padding: 12px; background: rgba(59,130,246,0.1); border-radius: 6px; border-left: 3px solid #3b82f6;"><p style="margin: 0 0 12px 0; font-weight: bold; color: #3b82f6;">📋 Moderation History (' + data.count + '):</p>';

      data.history.forEach((entry, idx) => {
        const date = new Date(entry.created_at).toLocaleString();
        html += '<div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; font-size: 12px;">';
        html += '<p style="margin: 0; color: #a78bfa;"><strong>#' + (idx + 1) + '</strong> ' + date + '</p>';
        html += '<p style="margin: 2px 0; color: #f59e0b;"><strong>' + entry.previous_status + '</strong> → <strong>' + entry.new_status + '</strong></p>';
        if (entry.moderation_reason) {
          html += '<p style="margin: 2px 0; color: #10b981; font-style: italic;">📝 ' + entry.moderation_reason + '</p>';
        }
        html += '<p style="margin: 2px 0; color: #6b7280; font-size: 11px;">By: ' + entry.moderated_by + '</p>';
        html += '</div>';
      });

      html += '</div>';
      historyContainer.innerHTML = html;
    } catch (error) {
      historyContainer.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Failed to load history.</p>';
    }
  }
