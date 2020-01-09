import { getWebSocketResult, closeConnectionPool } from './wwpass.websocket';
import { ticketAdapter } from '../ticket';
import { getTicket } from '../getticket';
import { encodeClientKey } from '../crypto';

import navigateToCallback from '../navigation';

import { getClientNonceWrapper } from '../nonce';

import { WWPASS_STATUS } from '../passkey/constants';

import { QRCodePromise, clearQRCode, setRefersh } from './ui';

// todo: return style when qrcode updating
// const DEFAULT_WAIT_CLASS = 'focused';
// style.transition = 'all .4s ease-out';
// style.opacity = '.3';

const PROTOCOL_VERSION = 2;

/*
 * WWPass QR code auth function
 *
options = {
    'ticketURL': undefined, // string
    'callbackURL': undefined, // string
    'development': false, // work with dev server
    'log': function (message) || console.log, // another log handler
}
 */
const wwpassQRCodeAuth = (initialOptions) => {
  const defaultOptions = {
    universal: false,
    ticketURL: undefined,
    callbackURL: undefined,
    development: false,
    version: 2,
    ppx: 'wwp_',
    spfewsAddress: 'wss://spfews.wwpass.com',
    qrcodeStyle: {
      width: 256,
      prefix: 'wwp_'
    },
    log: () => {}
  };

  const options = { ...defaultOptions, ...initialOptions };
  options.qrcodeStyle = { ...defaultOptions.qrcodeStyle, ...initialOptions.qrcodeStyle };
  const { log } = options;

  if (!options.ticketURL) {
    throw Error('ticketURL not found');
  }

  if (!options.callbackURL) {
    throw Error('callbackURL not found');
  }

  if (!options.qrcode) {
    throw Error('Element not found');
  }

  let ticket = null;
  let ttl = null;
  clearQRCode(options.qrcode, options.qrcodeStyle);
  return getTicket(options.ticketURL)
  .then((json) => {
    const response = ticketAdapter(json);
    ticket = response.ticket;
    ttl = response.ttl;
    return getClientNonceWrapper(ticket, ttl);
  }).then((key) => {
    const wwpassURLoptions = {
      universal: options.universal,
      ticket,
      callbackURL: options.callbackURL,
      ppx: options.ppx,
      version: PROTOCOL_VERSION,
      clientKey: key ? encodeClientKey(key) : undefined
    };
    return Promise.race([
      QRCodePromise(options.qrcode, wwpassURLoptions, ttl, options.qrcodeStyle),
      getWebSocketResult({
        callbackURL: options.callbackURL,
        ticket,
        log,
        development: options.development,
        version: options.version,
        ppx: options.ppx,
        spfewsAddress: options.spfewsAddress
      })
    ]);
  }).then((result) => {
    clearQRCode(options.qrcode, options.qrcodeStyle);
    if (result.refresh) {
      return wwpassQRCodeAuth(initialOptions);
    }
    if (result.clientKey && options.catchClientKey) {
      options.catchClientKey(result.clientKey);
    }
    if (result.away) {
      closeConnectionPool();
      return {
        ppx: options.ppx,
        version: options.version,
        status: WWPASS_STATUS.CONTINUE,
        reason: 'User has clicked on QRCode',
        ticket: options.ticket,
        callbackURL: options.callbackURL
      };
    }
    navigateToCallback(result);
    return result;
  })
  .catch((err) => {
    if (!err.status) {
      log('QRCode auth error', err);
      return setRefersh(options.qrcode, err).then(() => {
        clearQRCode(options.qrcode, options.qrcodeStyle);
        return new Promise((resolve) => {
          setTimeout(() => { resolve(wwpassQRCodeAuth(initialOptions)); }, 500);
        });
      });
    }
    clearQRCode(options.qrcode, options.qrcodeStyle);
    if (err.status === WWPASS_STATUS.INTERNAL_ERROR || options.returnErrors) {
      navigateToCallback(err);
    } else if (err.status === WWPASS_STATUS.TICKET_TIMEOUT) {
      log('ticket timed out');
      return wwpassQRCodeAuth(initialOptions);
    }
    throw err;
  });
};

export {
  getTicket,
  wwpassQRCodeAuth
};
