const http = require('http');
const data = JSON.stringify({listing_status: 'suspended', moderation_reason: 'Needs additional verification from frontend history test'});
const opts = {hostname: 'localhost', port: 3000, path: '/api/merchant-listings/moderate/29', method: 'POST', headers: {'Content-Type': 'application/json', 'x-admin-secret': 'atlaspi-dev-secret-change-in-prod', 'Content-Length': data.length}};
const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    const r = JSON.parse(body);
    console.log('Moderation 2: ' + (r.ok ? 'OK - ' + r.listing_status : 'FAIL'));
  });
});
req.write(data);
req.end();
