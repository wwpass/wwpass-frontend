import { WWPASS_OK_MSG, WWPASS_STATUS } from '../passkey/constants';

const connectionPool = [];
const closeConnectionPool = () => {
  while (connectionPool.length) {
    const connection = connectionPool.shift();
    if (connection.readyState === WebSocket.OPEN) {
      connection.close();
    }
  }
};

const applyDefaults = (initialOptions) => {
  const defaultOptions = {
    ppx: 'wwp_',
    version: 2,
    ticket: undefined,
    callbackURL: undefined,
    returnErrors: false,
    log: () => {},
    development: false,
    spfewsAddress: 'wss://spfews.wwpass.com',
    echo: undefined
  };
  return Object.assign({}, defaultOptions, initialOptions);
};
/**
* WWPass SPFE WebSocket connection
* @param {object} options
*
* options = {
*   'ticket': undefined, // stirng
*   'callbackURL': undefined, //string
*   'development': false || 'string' , // work with another spfews.wwpass.* server
*   'log': function (message) || console.log, // another log handler
*   'echo': undefined
* }
*/
const getWebSocketResult = initialOptions => new Promise((resolve, reject) => {
  const options = applyDefaults(initialOptions);
  let clientKey = null;
  let originalTicket = options.ticket;
  let ttl = null;
  const settle = (status, reason) => {
    if (status === 200) {
      resolve({
        ppx: options.ppx,
        version: options.version,
        status,
        reason: WWPASS_OK_MSG,
        ticket: options.ticket,
        callbackURL: options.callbackURL,
        clientKey,
        originalTicket,
        ttl
      });
    } else {
      reject({
        ppx: options.ppx,
        version: options.version,
        status,
        reason,
        ticket: options.ticket,
        callbackURL: options.callbackURL
      });
    }
  };
  if (!('WebSocket' in window)) {
    settle(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket is not supported.');
    return;
  }
  const websocketurl = options.spfewsAddress;
  const socket = new WebSocket(websocketurl);
  connectionPool.push(socket);
  const { log } = options;

  socket.onopen = () => {
    try {
      log(`Connected: ${websocketurl}`);
      const message = JSON.stringify({ ticket: options.ticket });
      log(`Sent message to server: ${message}`);
      socket.send(message);
    } catch (error) {
      log(error);
      settle(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket error');
    }
  };

  socket.onclose = () => {
    try {
      const index = connectionPool.indexOf(socket);
      if (index !== -1) {
        connectionPool.splice(index, 1);
      }
      log('Disconnected');
      resolve({ refresh: true });
    } catch (error) {
      log(error);
      settle(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket error');
    }
  };

  socket.onmessage = (message) => {
    try {
      log(`Message received from server: ${message.data}`);
      const response = JSON.parse(message.data);
      const status = response.code;
      const { reason } = response;

      if ('clientKey' in response && !clientKey) {
        clientKey = response.clientKey;
        if (response.originalTicket !== undefined) {
          originalTicket = response.originalTicket;
          ttl = response.ttl;
        }
      }

      if (status === 100) { return; }
      settle(status, reason);
      socket.close();
    } catch (error) {
      log(error);
      settle(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket error');
    }
  };
});


export {
  getWebSocketResult,
  closeConnectionPool
};
