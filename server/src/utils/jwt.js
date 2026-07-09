// WHAT IS A JWT (JSON Web Token)?
// It's a signed string with 3 parts separated by dots: header.payload.signature
// - header: says "this is a JWT, signed with HS256"
// - payload: the data you put in it (below: userId + role) — NOT encrypted,
//   just base64-encoded, so never put passwords or secrets in the payload
// - signature: HMAC of (header + payload) using JWT_SECRET. This is what
//   makes it trustworthy: if anyone edits the payload (e.g. changes role to
//   "ADMIN"), the signature won't match anymore and verify() will reject it.
//
// The server never "looks up a session" for a JWT — the token itself proves
// who the user is, as long as the signature checks out. That's why JWT auth
// is called "stateless."

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export function signToken(payload) {
  // payload = { userId, role } — small, non-sensitive data only
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  // Throws if signature is invalid or token is expired — caller must catch
  return jwt.verify(token, SECRET);
}
