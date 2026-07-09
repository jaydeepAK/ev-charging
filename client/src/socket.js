// One shared socket connection for the whole app — imported by any page/
// component that wants to react to live changes, rather than each page
// opening its own connection.

import { io } from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(baseURL, {
  autoConnect: true,
});
