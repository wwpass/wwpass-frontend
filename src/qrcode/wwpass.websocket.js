import { WWPASS_OK_MSG, WWPASS_STATUS } from '../passkey/constants';

class websocketPool {
  constructor(options) {
    this.connectionPool = [];
    const defaultOptions = {
      spfewsAddress: 'wss://spfews.wwpass.com',
      clientKeyOnly: false,
      log: () => {}
    };
    this.options = { ...defaultOptions, ...options };
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  onError(status, reason, ticket) {
    this.reject({
      status,
      reason,
      ticket
    });
    this.close();
  }

  close() {
    while (this.connectionPool.length) {
      const connection = this.connectionPool.shift();
      if (connection.readyState === WebSocket.OPEN) {
        connection.close();
      }
    }
  }

  watchTicket(ticket) {
    if (!('WebSocket' in window)) {
      this.onError(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket is not supported.', ticket);
      return;
    }
    const socket = new WebSocket(this.options.spfewsAddress);
    this.connectionPool.push(socket);
    const { log } = this.options;
    let clientKey = null;
    let originalTicket = null;
    let ttl = null;

    socket.onopen = () => {
      try {
        log(`Connected: ${this.options.spfewsAddress}`);
        const message = JSON.stringify({ ticket });
        log(`Sent message to server: ${message}`);
        socket.send(message);
      } catch (error) {
        log(error);
        this.onError(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket error', ticket);
      }
    };

    socket.onclose = () => {
      try {
        const index = this.connectionPool.indexOf(socket);
        if (index !== -1) {
          this.connectionPool.splice(index, 1);
        }
        log('Disconnected');
      } catch (error) {
        log(error);
        this.onError(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket error', ticket);
      }
    };

    socket.onmessage = (message) => {
      try {
        log(`Message received from server: ${message.data}`);
        const response = JSON.parse(message.data);
        const status = response.code;

        if ('clientKey' in response && !clientKey) {
          clientKey = response.clientKey;
          if (response.originalTicket !== undefined) {
            originalTicket = response.originalTicket;
            ttl = response.ttl;
          }
        }

        if (status !== 200) {
          return; // Skip all errors. Nothing to do about them
        }
        this.resolve({
          status,
          reason: WWPASS_OK_MSG,
          clientKey,
          ticket,
          ttl,
          originalTicket: originalTicket !== null ? originalTicket : ticket
        });
        this.close();
      } catch (error) {
        log(error);
        this.onError(WWPASS_STATUS.INTERNAL_ERROR, 'WebSocket error');
      }
    };
  }
}

export default websocketPool;
