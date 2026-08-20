const assert = require('node:assert/strict');
const test = require('node:test');
const supertest = require('supertest');

const users = [
  { id: 1, tenant_id: 1, full_name: 'Alice Johnson', email: 'alice@pouch.io', password_hash: 'secret', role: 'admin', salary: '125000.00' },
  { id: 2, tenant_id: 1, full_name: 'Bob Smith', email: 'bob@pouch.io', password_hash: 'secret', role: 'manager', salary: '95000.00' },
  { id: 3, tenant_id: 2, full_name: 'Charlie Davis', email: 'charlie@velocity.com', password_hash: 'secret', role: 'admin', salary: '140000.00' }
];

const projects = [
  { id: 1, tenant_id: 1, name: 'Pouch Portal', description: 'Pouch', status: 'active', budget: '50000.00', owner_id: 1 },
  { id: 2, tenant_id: 2, name: 'Velocity Engine', description: 'Velocity', status: 'active', budget: '120000.00', owner_id: 3 }
];

const db = {
  async query(sql, params) {
    assert.match(sql, /tenant_id\s*=\s*\$/i, `query is not tenant-scoped: ${sql}`);
    if (/FROM users/i.test(sql)) {
      const tenantId = /tenant_id\s*=\s*\$2/i.test(sql) ? params[1] : params[0];
      let rows = users.filter((row) => row.tenant_id === tenantId);
      if (/\bid\b\s*=\s*\$2/i.test(sql)) rows = rows.filter((row) => row.id === params[1]);
      if (/\bid\b\s*=\s*\$1/i.test(sql)) rows = rows.filter((row) => row.id === params[0]);
      return { rows };
    }
    const tenantId = /tenant_id\s*=\s*\$2/i.test(sql) ? params[1] : params[0];
    let rows = projects.filter((row) => row.tenant_id === tenantId);
    if (/\bid\b\s*=\s*\$1/i.test(sql)) rows = rows.filter((row) => row.id === params[0]);
    if (/\bowner_id\b\s*=\s*\$2/i.test(sql)) rows = rows.filter((row) => row.owner_id === params[1]);
    if (/\bowner_id\b\s*=\s*\$3/i.test(sql)) rows = rows.filter((row) => row.owner_id === params[2]);
    return { rows };
  }
};

const dbModulePath = require.resolve('../db');
const realDb = require(dbModulePath);
realDb.query = db.query;
delete require.cache[require.resolve('../app')];
const app = require('../app');
const request = supertest(app);

test('root endpoint remains available', async () => {
  const response = await request.get('/');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'online');
});

test('admin receives only users from the active tenant and may see salary', async () => {
  const response = await request.get('/users').set({ 'x-tenant-id': '1', 'x-role': 'admin' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.map((user) => user.id), [1, 2]);
  assert.equal(response.body[0].salary, '125000.00');
  assert.equal(response.body[0].password_hash, undefined);
});

test('employee list is restricted to the employee profile and omits salary', async () => {
  const response = await request.get('/users').set({ 'x-user-id': '2', 'x-tenant-id': '1', 'x-role': 'employee' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.map((user) => user.id), [2]);
  assert.equal(response.body[0].salary, undefined);
});

test('cross-tenant user access is denied by the query boundary', async () => {
  const response = await request.get('/users/3').set({ 'x-tenant-id': '1', 'x-role': 'admin' });
  assert.equal(response.status, 404);
});

test('cross-tenant project access is denied by the query boundary', async () => {
  const response = await request.get('/projects/2').set({ 'x-tenant-id': '1', 'x-role': 'admin' });
  assert.equal(response.status, 404);
});

test('employee project list is restricted to projects they own', async () => {
  const response = await request.get('/projects').set({ 'x-user-id': '2', 'x-tenant-id': '1', 'x-role': 'employee' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});

test('invalid role is rejected', async () => {
  const response = await request.get('/users').set({ 'x-role': 'superuser' });
  assert.equal(response.status, 403);
});

test('missing endpoints return the existing 404 response', async () => {
  const response = await request.get('/missing');
  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'Endpoint not found.');
});
