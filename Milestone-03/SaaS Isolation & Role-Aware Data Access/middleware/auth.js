const VALID_ROLES = new Set(['admin', 'manager', 'employee']);

/**
 * Demo authentication context.
 *
 * The starter repository has no authentication provider. For local verification,
 * the middleware accepts x-user-id, x-tenant-id, and x-role headers and applies
 * safe defaults. A production deployment must replace these headers with values
 * extracted from a verified session or JWT.
 */
function requireAuth(req, res, next) {
  const userId = Number(req.get('x-user-id') || 1);
  const tenantId = Number(req.get('x-tenant-id') || 1);
  const role = (req.get('x-role') || 'admin').toLowerCase();

  if (!Number.isInteger(userId) || userId < 1 || !Number.isInteger(tenantId) || tenantId < 1) {
    return res.status(400).json({ error: 'Invalid authentication context.' });
  }

  if (!VALID_ROLES.has(role)) {
    return res.status(403).json({ error: 'Unsupported role.' });
  }

  req.user = { id: userId, tenantId, role };
  return next();
}

module.exports = { requireAuth };
