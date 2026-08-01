// express-jwt puts the decoded token on req.auth. It proves who the caller is
// and nothing else. Every write route needs this on top of it.
function requireAuth(req, res, next) {
  if (!req.auth || !req.auth._id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  next();
}

function requireRole(...allowed) {
  return function (req, res, next) {
    if (!req.auth || !req.auth._id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const role = req.auth.role || 'user';
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: 'Insufficient role for this action.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
