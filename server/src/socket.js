// SOCKET.IO IN ONE SENTENCE: it upgrades a normal HTTP request to a
// persistent two-way connection, so the server can push messages to clients
// the instant something changes, instead of clients having to keep asking
// "anything new?" (polling).
//
// Design choice for this MVP: rather than a custom event name per resource
// (station:created, charger:updated, booking:cancelled, ...), every mutation
// broadcasts one event — "data:changed" — with a `type` field. Any page that
// cares about that type just refetches its own data over the normal REST API.
// This keeps the server simple (one function, `broadcastChange`) and keeps
// the "source of truth" as the REST response, not the socket payload itself
// — the socket is just a doorbell, not a data pipe.

import { Server } from 'socket.io';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }, // MVP: wide open; tighten to your deployed frontend URL in production
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Call this after any mutation that other connected clients should know about.
// `type` is one of: 'station' | 'charger' | 'booking' | 'session' | 'payment'
export function broadcastChange(type) {
  if (!io) return; // no-op if sockets haven't initialized (e.g. in a script/test)
  io.emit('data:changed', { type, at: new Date().toISOString() });
}
