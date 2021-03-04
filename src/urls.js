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

const getUniversalURL = (initialOptions = {}, allowCallbackURL = true) => {
  const defaultOptions = {
    universal: false,
    operation: 'auth',
    ppx: 'wwp_',
    version: 2,
    ticket: undefined,
    callbackURL: undefined,
    clientKey: undefined
  };

  const options = { ...defaultOptions, ...initialOptions };

  let url = options.universal ? 'https://get.wwpass.com/' : 'wwpass://';

  if (options.operation === 'auth') {
    url += 'auth';
    url += `?v=${options.version}`;
    url += `&t=${encodeURIComponent(options.ticket)}`;
    url += `&ppx=${encodeURIComponent(options.ppx)}`;

    if (options.clientKey) {
      url += `&ck=${options.clientKey}`;
    }

    if (options.callbackURL && allowCallbackURL) {
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
