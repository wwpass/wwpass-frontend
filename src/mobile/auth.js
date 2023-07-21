import { wwpassPasskeyAuth } from '../passkey/auth';
import WebSocketPool from './wwpass.websocket';
import { wait } from '../util';
import { ticketAdapter, getShortTicketForm } from '../ticket';
import { getTicket } from '../getticket';
import { encodeClientNonce } from '../crypto';

import { getClientNonceIfNeeded } from '../nonce';

import { WWPASS_STATUS, PROTOCOL_VERSION } from '../constants';

import {
  QRCodeLogin, clearQRCode, setRefersh, sameDeviceLogin
} from './ui';
import { getUniversalURL } from '../urls';

const METHOD_KEY_NAME = 'wwpass.auth.method';
const METHOD_QRCODE = 'qrcode';

const WAIT_ON_ERROR = 500;

const isMobile = () => navigator && (
  ('userAgent' in navigator && navigator.userAgent.match(/iPhone|iPod|iPad|Android/i))
  || ((navigator.maxTouchPoints > 1) && (navigator.platform === 'MacIntel')));

const redirectToWWPassApp = async (options, authResult) => {
  const json = await getTicket(options.ticketURL);
  const response = ticketAdapter(json);
  const { ticket } = response;
  const { ttl } = response;
  const key = await getClientNonceIfNeeded(ticket, ttl);
  // eslint-disable-next-line no-param-reassign
  authResult.linkElement.href = getUniversalURL({
    ticket,
    callbackURL: options.callbackURL,
    clientKey: key ? encodeClientNonce(key) : undefined,
    ppx: options.ppx,
    version: PROTOCOL_VERSION,
    universal: options.universal || false,
    dh: options.dh
  });
  authResult.linkElement.click();
};

const appAuth = (initialOptions) => {
  const defaultOptions = {
    universal: false,
    ticketURL: undefined,
    callbackURL: undefined,
    version: PROTOCOL_VERSION,
    ppx: 'wwp_',
    log: () => {}
  };
  const options = { ...defaultOptions, ...initialOptions };
  return sameDeviceLogin(options.qrcode, null, null, true);
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
      const key = await getClientNonceIfNeeded(ticket, ttl);
      const wwpassURLoptions = {
        ticket,
        shortTicket: getShortTicketForm(ticket),
        callbackURL: options.callbackURL,
        ppx: options.ppx,
        version: PROTOCOL_VERSION,
        clientKey: key ? encodeClientNonce(key) : undefined,
        universal: options.universal || false
      };
      websocketPool.watchTicket(ticket);
      // eslint-disable-next-line no-await-in-loop
      const result = await QRCodeLogin(
        options.qrcode,
        wwpassURLoptions,
        ttl * 900,
        options.qrcodeStyle,
        (options.uiSwitch === 'auto' && isMobile()) || options.uiSwitch === 'always'
      );
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

const qrCodeAndPasskeyAuth = (options) => {
  const websocketPool = new WebSocketPool(options);
  const promises = [
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
    qrCodeAuth(options, websocketPool)];

  if (options.passkeyButton) {
    promises.push(wwpassPasskeyAuth(options));
  }

  return Promise.race(promises).finally(() => {
    websocketPool.close();
  });
};

export {
  isMobile,
  getTicket,
  redirectToWWPassApp,
  appAuth,
  qrCodeAndPasskeyAuth
};
