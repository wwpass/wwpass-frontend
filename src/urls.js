const getCallbackURL = (initialOptions = {}) => {
  const defaultOptions = {
    ppx: 'wwp_',
    version: 2,
    status: 200,
    reason: 'OK',
    ticket: undefined,
    callbackURL: undefined,
    hw: false // hardware legacy
  };

  const options = Object.assign({}, defaultOptions, initialOptions);

  let url = options.callbackURL;
  const firstDelimiter = (url.indexOf('?') === -1) ? '?' : '&';

  url += `${firstDelimiter + encodeURIComponent(options.ppx)}version=${options.version}`;
  url += `&${encodeURIComponent(options.ppx)}ticket=${encodeURIComponent(options.ticket)}`;
  url += `&${encodeURIComponent(options.ppx)}status=${encodeURIComponent(options.status)}`;
  url += `&${encodeURIComponent(options.ppx)}reason=${encodeURIComponent(options.reason)}`;
  if (options.hw) {
    url += `&${encodeURIComponent(options.ppx)}hw=1`;
  }

  return url;
};

const getUniversalURL = (initialOptions = {}, forQRCode) => {
  const defaultOptions = {
    universal: false,
    operation: 'auth',
    ppx: 'wwp_',
    version: 2,
    ticket: undefined,
    callbackURL: undefined,
    clientKey: undefined
  };

  const options = Object.assign({}, defaultOptions, initialOptions);

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

  return url;
};

export {
  getCallbackURL,
  getUniversalURL
};
