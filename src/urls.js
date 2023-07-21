import { PROTOCOL_VERSION } from './constants';

const getCallbackURL = (initialOptions = {}) => {
  const defaultOptions = {
    ppx: 'wwp_',
    version: PROTOCOL_VERSION,
    status: 200,
    reason: 'OK',
    ticket: undefined,
    callbackURL: undefined,
    hw: false // hardware legacy
  };

  const options = { ...defaultOptions, ...initialOptions };

  let url = '';
  if (typeof (options.callbackURL) === 'string') {
    url = options.callbackURL;
  }

  const firstDelimiter = (url.indexOf('?') === -1) ? '?' : '&';
  url += firstDelimiter;
  const callbackParameters = ['version', 'ticket', 'status', 'reason'];
  if (options.hw) {
    callbackParameters.push('hw');
    options.hw = 1;
  }

  callbackParameters.forEach((name, index) => {
    url += `${encodeURIComponent(options.ppx)}${name}=${encodeURIComponent(options[name])}${index === callbackParameters.length - 1 ? '' : '&'}`;
  });
  return url;
};

const getCurrentDh = (w) => w.screen.height - w.innerHeight;

const getUniversalURL = (initialOptions = {}, forQRCode = false) => {
  const defaultOptions = {
    universal: false,
    operation: 'auth',
    ppx: 'wwp_',
    version: PROTOCOL_VERSION,
    ticket: undefined,
    callbackURL: undefined,
    clientKey: undefined,
    dh: undefined
  };

  const options = { ...defaultOptions, ...initialOptions };

  let url = options.universal ? 'https://get.wwpass.com/' : 'wwpass://';

  if (options.operation === 'auth') {
    url += 'auth';
    url += `?v=${options.version}`;
    url += `&t=${encodeURIComponent(forQRCode ? options.shortTicket : options.ticket)}`;
    url += `&ppx=${encodeURIComponent(options.ppx)}`;

    if (options.clientKey) {
      url += `&ck=${options.clientKey}`;
    }

    if (options.callbackURL && !forQRCode) {
      url += `&c=${encodeURIComponent(options.callbackURL)}`;
    }
  } else {
    url += `${encodeURIComponent(options.operation)}?t=${encodeURIComponent(options.ticket)}`;
  }

  const dh = getCurrentDh(window) || 0;
  if (dh) {
    url += `&dh=${dh}`;
  }

  return url;
};

export {
  getCallbackURL,
  getUniversalURL,
  getCurrentDh
};
