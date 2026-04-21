const http = require('http');
const opts = {hostname: 'localhost', port: 3000, path: '/api/merchant-listings/moderation-history/28', method: 'GET', headers: {'x-admin-secret': 'atlaspi-dev-secret-change-in-prod'}};
const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log('History count:', result.count);
    result.history.forEach((h, i) => {
      console.log(`Entry ${i+1}:`);
      console.log(`  Previous: ${h.previous_status}`);
      console.log(`  New: ${h.new_status}`);
      console.log(`  Reason: ${h.moderation_reason || '(none)'}`);
      console.log(`  By: ${h.moderated_by}`);
      console.log(`  Date: ${h.created_at}`);
    });
  });
});
req.end();
