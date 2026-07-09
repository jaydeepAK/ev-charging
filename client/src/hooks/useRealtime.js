// USAGE: useRealtime(['station', 'charger'], fetchStations)
// Runs `callback` whenever the server broadcasts a data:changed event whose
// `type` is in the given list.
//
// WHY THE REF? If this effect depended on `callback` directly, every render
// (e.g. every time `city`/`chargerType` filter state changes) would create a
// new callback identity, forcing the effect to unsubscribe and resubscribe
// from the socket. Storing the latest callback in a ref lets the socket
// listener stay registered exactly once (empty dependency array) while still
// always calling the MOST RECENT version of the callback — so it sees
// current filter state instead of a stale closure from first render.

import { useEffect, useRef } from 'react';
import { socket } from '../socket.js';

export function useRealtime(types, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback; // updated on every render, no effect re-run needed

  useEffect(() => {
    function handleChange({ type }) {
      if (types.includes(type)) {
        callbackRef.current();
      }
    }

    socket.on('data:changed', handleChange);
    return () => socket.off('data:changed', handleChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(',')]); // re-subscribe only if the actual list of types changes
}
