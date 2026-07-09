// WHAT IS MIDDLEWARE?
// A function that runs BETWEEN the request arriving and your route handler
// running. It has access to (req, res, next). Calling next() passes control
// to the next middleware/handler in the chain. NOT calling next() (e.g.
// because you called res.status(401).json(...) instead) stops the request
// there — the route handler never runs.
//
// We use two layers here:
// 1. requireAuth — "is there a valid token at all?" (attaches req.user)
// 2. requireRole  — "does req.user.role match what this route allows?"
// This separation matters: requireAuth alone is enough for e.g. GET /auth/profile,
// but POST /stations should also require requireRole('OWNER').

import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization; // expected format: "Bearer <token>"

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = verifyToken(token); // { userId, role, iat, exp }
    req.user = decoded; // now every downstream handler can read req.user
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Usage: requireRole('OWNER', 'ADMIN') — pass one or more allowed roles
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
