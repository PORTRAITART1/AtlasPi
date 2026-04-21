const http = require('http');
const data = JSON.stringify({listing_status: 'approved', moderation_reason: 'Complete info and valid business'});
const opts = {hostname: 'localhost', port: 3000, path: '/api/merchant-listings/moderate/29', method: 'POST', headers: {'Content-Type': 'application/json', 'x-admin-secret': 'atlaspi-dev-secret-change-in-prod', 'Content-Length': data.length}};
const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    const r = JSON.parse(body);
    console.log('Moderation 1: ' + (r.ok ? 'OK - ' + r.listing_status : 'FAIL'));
  });
});
req.write(data);
req.end();
