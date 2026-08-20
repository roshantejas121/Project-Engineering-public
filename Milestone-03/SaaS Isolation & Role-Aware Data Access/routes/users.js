const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function safeUser(user, role) {
  const response = {
    id: user.id,
    tenant_id: user.tenant_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };

  if (role === 'admin') {
    response.salary = user.salary;
  }

  return response;
}

router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM users WHERE tenant_id = $1';
    const params = [req.user.tenantId];
    if (req.user.role === 'employee') {
      query += ' AND id = $2';
      params.push(req.user.id);
    }
    query += ' ORDER BY id';
    const { rows } = await db.query(query, params);
    return res.json(rows.map((user) => safeUser(user, req.user.role)));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const requestedId = Number(req.params.id);
    const { rows } = await db.query(
      'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
      [requestedId, req.user.tenantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (req.user.role === 'employee' && req.user.id !== requestedId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
    }

    return res.json(safeUser(rows[0], req.user.role));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to find user.' });
  }
});

module.exports = router;
