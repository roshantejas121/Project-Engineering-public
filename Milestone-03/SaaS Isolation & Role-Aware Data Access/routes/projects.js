const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function safeProject(project) {
  return {
    id: project.id,
    tenant_id: project.tenant_id,
    name: project.name,
    description: project.description,
    status: project.status,
    budget: project.budget,
    owner_id: project.owner_id
  };
}

router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM projects WHERE tenant_id = $1';
    const params = [req.user.tenantId];

    if (req.user.role === 'employee') {
      query += ' AND owner_id = $2';
      params.push(req.user.id);
    }

    query += ' ORDER BY id';
    const { rows } = await db.query(query, params);
    return res.json(rows.map(safeProject));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to find projects.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const requestedId = Number(req.params.id);
    let query = 'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2';
    const params = [requestedId, req.user.tenantId];

    if (req.user.role === 'employee') {
      query += ' AND owner_id = $3';
      params.push(req.user.id);
    }

    const { rows } = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    return res.json(safeProject(rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve project info.' });
  }
});

module.exports = router;
