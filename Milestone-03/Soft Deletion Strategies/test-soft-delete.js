const assert = require('node:assert/strict');
const http = require('node:http');
const Module = require('node:module');

const queries = [];
const fakePool = {
  on() {},
  query(text) {
    queries.push(text);
    if (text.includes('UPDATE')) return Promise.resolve({ rowCount: 1, rows: [] });
    if (text.includes('IS NOT NULL')) return Promise.resolve({ rows: [{ id: 99, deleted_at: '2026-01-01T00:00:00Z' }] });
    return Promise.resolve({ rows: [{ id: 1, deleted_at: null }] });
  },
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'pg') return { Pool: function Pool() { return fakePool; } };
  return originalLoad.call(this, request, parent, isMain);
};

const app = require('./app');

function request(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 3000, method, path }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const activeUsers = await request('GET', '/users');
  assert.equal(activeUsers.status, 200);
  assert.match(queries.at(-1), /deleted_at IS NULL/);

  const deletedUsers = await request('GET', '/users/admin/deleted');
  assert.equal(deletedUsers.status, 200);
  assert.equal(deletedUsers.body[0].id, 99);
  assert.match(queries.at(-1), /deleted_at IS NOT NULL/);

  const deletedAccount = await request('DELETE', '/accounts/7');
  assert.equal(deletedAccount.status, 200);
  assert.match(queries.at(-1), /UPDATE accounts SET deleted_at = NOW\(\)/);

  const deletedTransaction = await request('DELETE', '/transactions/8');
  assert.equal(deletedTransaction.status, 200);
  assert.match(queries.at(-1), /UPDATE transactions SET deleted_at = NOW\(\)/);

  const deletedUser = await request('DELETE', '/users/9');
  assert.equal(deletedUser.status, 200);
  assert.match(queries.at(-1), /UPDATE users SET deleted_at = NOW\(\)/);

  console.log('soft-delete endpoint tests passed');
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
