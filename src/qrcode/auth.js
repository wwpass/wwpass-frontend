import WebSocketPool from './wwpass.websocket';
import { ticketAdapter } from '../ticket';
import { getTicket } from '../getticket';
import { encodeClientKey } from '../crypto';

import navigateToCallback from '../navigation';

import { getClientNonceWrapper } from '../nonce';

import { WWPASS_STATUS } from '../passkey/constants';

import {
  QRCodeLogin, clearQRCode, setRefersh, sameDeviceLogin, isMobile
} from './ui';
import { getUniversalURL } from '../urls';

const METHOD_KEY_NAME = 'wwpass.auth.method';
const METHOD_QRCODE = 'qrcode';
const METHOD_SAME_DEVICE = 'appRedirect';

const PROTOCOL_VERSION = 2;

const WAIT_ON_ERROR = 500;

function wait(ms) {
  if (ms) return new Promise((r) => setTimeout(r, ms));
  return null;
}

const appAuth = async (initialOptions) => {
  const defaultOptions = {
    universal: false,
    ticketURL: undefined,
    callbackURL: undefined,
    version: 2,
    ppx: 'wwp_',
    log: () => {}
  };
  const options = { ...defaultOptions, ...initialOptions };
  const result = await sameDeviceLogin(options.qrcode);
  if (result.away) {
    const json = await getTicket(options.ticketURL);
    const response = ticketAdapter(json);
    const { ticket } = response;
    const { ttl } = response;
    const key = await getClientNonceWrapper(ticket, ttl);
    window.localStorage.setItem(METHOD_KEY_NAME, METHOD_SAME_DEVICE);
    result.linkElement.href = getUniversalURL({
      ticket,
      callbackURL: options.callbackURL,
      clientKey: key ? encodeClientKey(key) : undefined,
      ppx: options.ppx,
      version: PROTOCOL_VERSION
    });
    result.linkElement.click();
  }
  return result;
};

const qrCodeAuth = async (options, websocketPool) => {
  // Continue until an exception is thrown or qrcode element is removed from DOM
  do {
    try {
      clearQRCode(options.qrcode, options.qrcodeStyle);
      // eslint-disable-next-line no-await-in-loop
      const json = await getTicket(options.ticketURL);
      const response = ticketAdapter(json);
      const { ticket } = response;
      const { ttl } = response;
      // eslint-disable-next-line no-await-in-loop
      const key = await getClientNonceWrapper(ticket, ttl);
      const wwpassURLoptions = {
        ticket,
        callbackURL: options.callbackURL,
        ppx: options.ppx,
        version: PROTOCOL_VERSION,
        clientKey: key ? encodeClientKey(key) : undefined
      };
      websocketPool.watchTicket(ticket);
      // eslint-disable-next-line no-await-in-loop
      const result = await QRCodeLogin(options.qrcode, wwpassURLoptions, ttl, options.qrcodeStyle);
      if (!result.refresh) return result;
    } catch (err) {
      if (!err.status) {
        options.log('QRCode auth error', err);
        // eslint-disable-next-line no-await-in-loop
        await setRefersh(options.qrcode, err);
        clearQRCode(options.qrcode, options.qrcodeStyle);
      } else {
        clearQRCode(options.qrcode, options.qrcodeStyle);
        if (err.status === WWPASS_STATUS.INTERNAL_ERROR || options.returnErrors) {
          return err;
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await wait(WAIT_ON_ERROR);
    }
  } while (document.documentElement.contains(options.qrcode));
  return {
    status: WWPASS_STATUS.TERMINAL_ERROR,
    reason: 'QRCode element is not in DOM'
  };
};

const qrCodeAuthWrapper = (options) => {
  const websocketPool = new WebSocketPool(options);
  return Promise.race([
    websocketPool.promise.then((result) => {
      if (result.clientKey && options.catchClientKey) {
        options.catchClientKey(result.clientKey);
      }
      window.localStorage.setItem(METHOD_KEY_NAME, METHOD_QRCODE);
      return ({
        ticket: result.ticket,
        callbackURL: options.callbackURL,
        ppx: options.ppx,
        version: PROTOCOL_VERSION
      });
    }).catch((err) => {
      options.log(err);
      if (err.status) return err;
      return { status: WWPASS_STATUS.INTERNAL_ERROR, reason: err };
    }),
    qrCodeAuth(options, websocketPool)])
  .finally(() => {
    websocketPool.close();
  });
};

/*
 * WWPass auth with mobile PassKey
 *
options = {
    'ticketURL': undefined, // string
    'callbackURL': undefined, // string
    'development': false, // work with dev server
    'log': function (message) || console.log, // another log handler
}
 */
const wwpassMobileAuth = async (initialOptions) => {
  const defaultOptions = {
    ticketURL: undefined,
    callbackURL: undefined,
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
  let executor;
  switch (window.localStorage.getItem(METHOD_KEY_NAME)) {
  case METHOD_QRCODE:
    executor = qrCodeAuthWrapper;
    break;
  case METHOD_SAME_DEVICE:
    executor = appAuth;
    break;
  default:
    executor = isMobile() ? appAuth : qrCodeAuthWrapper;
  }

  // Continue until an exception is thrown or qrcode element is removed from DOM
  do {
    // eslint-disable-next-line no-await-in-loop
    const result = await executor(options);
    if (result.button) {
      executor = appAuth;
    } else if (result.qrcode) {
      executor = qrCodeAuthWrapper;
    } else {
      navigateToCallback(result);
      return result;
    }
  } while (document.documentElement.contains(options.qrcode));
  return {
    status: WWPASS_STATUS.TERMINAL_ERROR,
    reason: 'QRCode element is not in DOM'
  };
};

export {
  getTicket,
  wwpassMobileAuth
};
