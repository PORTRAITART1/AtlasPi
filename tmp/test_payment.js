const http = require('http');

// Test payment creation
const data = JSON.stringify({uid: 'user-test', username: 'test_user', amount: 5.5, memo: 'Test'});
const opts = {hostname: 'localhost', port: 3000, path: '/api/payments/create-record', method: 'POST', headers: {'Content-Type': 'application/json', 'Content-Length': data.length}};
const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log('✅ Payment creation:', result.ok ? 'PASS' : 'FAIL');
  });
});
req.write(data);
req.end();
