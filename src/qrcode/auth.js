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

const WAIT_ON_CLICK = 2000;
const WAIT_ON_ERROR = 500;

function wait(ms) {
  if (ms) return new Promise((r) => setTimeout(r, ms));
  return null;
}

const tryQRCodeAuth = async (options) => {
  const { log } = options;
  try {
    log(options);
    clearQRCode(options.qrcode, options.qrcodeStyle);
    const json = await getTicket(options.ticketURL);
    const response = ticketAdapter(json);
    const { ticket } = response;
    const { ttl } = response;
    const key = await getClientNonceWrapper(ticket, ttl);
    const wwpassURLoptions = {
      universal: options.universal,
      ticket,
      callbackURL: options.callbackURL,
      ppx: options.ppx,
      version: PROTOCOL_VERSION,
      clientKey: key ? encodeClientKey(key) : undefined
    };
    const result = await Promise.race([
      QRCodePromise(options.qrcode, wwpassURLoptions, ttl, options.qrcodeStyle),
      getWebSocketResult({
        callbackURL: options.callbackURL,
        ticket,
        log,
        development: options.development,
        version: options.version,
        ppx: options.ppx,
        spfewsAddress: options.spfewsAddress,
        returnErrors: options.returnErrors
      })
    ]);
    clearQRCode(options.qrcode, options.qrcodeStyle);
    if (result.refresh) {
      return {
        status: WWPASS_STATUS.CONTINUE,
        reason: 'Need to refresh QRCode'
      };
    }
    if (result.clientKey && options.catchClientKey) {
      options.catchClientKey(result.clientKey);
    }
    if (result.away) {
      closeConnectionPool();
      return {
        status: WWPASS_STATUS.OK,
        reason: 'User clicked on QRCode'
      };
    }
    return result;
  } catch (err) {
    if (!err.status) {
      log('QRCode auth error', err);
      await setRefersh(options.qrcode, err);
      clearQRCode(options.qrcode, options.qrcodeStyle);
      return {
        status: WWPASS_STATUS.NETWORK_ERROR,
        reason: err
      };
    }
    clearQRCode(options.qrcode, options.qrcodeStyle);
    if (err.status === WWPASS_STATUS.INTERNAL_ERROR || options.returnErrors) {
      navigateToCallback(err);
      return err;
    }
    if (err.status === WWPASS_STATUS.TICKET_TIMEOUT) {
      log('ticket timed out');
    }
    return err;
  }
};

const getDelay = (status) => {
  switch (status) {
  case WWPASS_STATUS.OK:
    return WAIT_ON_CLICK;
  case WWPASS_STATUS.CONTINUE:
    return 0;
  default:
    return WAIT_ON_ERROR;
  }
};


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
const wwpassQRCodeAuth = async (initialOptions) => {
  const defaultOptions = {
    universal: false,
    ticketURL: undefined,
    callbackURL: undefined,
    development: false,
    once: false, // Repeat authentication while possible
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


  if (!options.ticketURL) {
    throw Error('ticketURL not found');
  }

  if (!options.callbackURL) {
    throw Error('callbackURL not found');
  }

  if (!options.qrcode) {
    throw Error('Element not found');
  }
  // Continue until an exception is thrown or qrcode element is removed from DOM
  do {
    // eslint-disable-next-line no-await-in-loop
    const result = await tryQRCodeAuth(options);
    if (options.once && result.status !== WWPASS_STATUS.CONTINUE) return result;
    // eslint-disable-next-line no-await-in-loop
    await wait(getDelay(result.status));
  } while (document.documentElement.contains(options.qrcode));
  return {
    status: WWPASS_STATUS.TERMINAL_ERROR,
    reason: 'QRCode element is not in DOM'
  };
};

export {
  getTicket,
  wwpassQRCodeAuth
};
