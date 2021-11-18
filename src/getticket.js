import WebSocketPool from './qrcode/wwpass.websocket';
import { getClientNonce } from './nonce';
import { isClientKeyTicket } from './ticket';

const noCacheHeaders = { pragma: 'no-cache', 'cache-control': 'no-cache' };

function wait(ms) {
  if (ms) return new Promise((r) => setTimeout(r, ms));
  return null;
}

const getTicket = async (url) => {
  let response = null;
  for (let i = 0; i < 3; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await fetch(url, { cache: 'no-store', headers: noCacheHeaders });
    } catch (err) {
      /* Probably fetch() was cancelled because of page closing or user cancelling loads */
      // eslint-disable-next-line no-await-in-loop
      await wait(100);
    }
  }
  if (response === null || !response.ok) {
    throw Error(`Error fetching ticket from "${url}": ${response.statusText}`);
  }
  return response.json();
};

/* updateTicket should be called when the client wants to extend the session beyond
  ticket's TTL. The URL handler on the server should use putTicket to get new ticket
  whith the same credentials as the old one. The URL should return JSON object:
  {"oldTicket": "<previous_ticket>", "newTicket": "<new_ticket>", "ttl": <new_ticket_ttl>}
  The functions ultimately resolves to:
  {"ticket": "<new_ticket>", "ttl": <new_ticket_ttl>}
*/
const updateTicket = (url) => fetch(url, { cache: 'no-store', headers: noCacheHeaders }).then((response) => {
  if (!response.ok) {
    throw Error(`Error updating ticket from "${url}": ${response.statusText}`);
  }
  return response.json();
}).then((response) => {
  if (!response.newTicket || !response.oldTicket || !response.ttl) {
    throw Error(`Invalid response ot updateTicket: ${response}`);
  }
  const result = {
    ticket: response.newTicket,
    ttl: response.ttl
  };
  if (!isClientKeyTicket(response.newTicket)) {
    return result;
  }
  const websocketPool = new WebSocketPool({ clientKeyOnly: true });
  websocketPool.watchTicket(response.newTicket);
  // We have to call getWebSocketResult and getClientNonce to check for Nonce and update
  // TTL on original ticket
  return websocketPool.promise.then((wsResult) => {
    if (!wsResult.clientKey) {
      throw Error(`No client key associated with the ticket ${response.newTicket}`);
    }
    return getClientNonce(
      wsResult.originalTicket ? wsResult.originalTicket : response.newTicket,
      wsResult.ttl
    );
  })
  .then(() => result);
});


export {
  getTicket,
  updateTicket,
  wait
};
