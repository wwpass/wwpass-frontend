import { isClientKeyTicket } from './ticket';
import { getUniversalURL } from './urls';
import {
  encodeClientNonce
} from './crypto';
import { generateClientNonce } from './nonce';

const openWithTicket = (initialOptions) => new Promise((resolve) => {
  const defaultOptions = {
    ticket: '',
    ttl: 120,
    callbackURL: '',
    ppx: 'wwp_',
    away: true
  };

  let options = { ...defaultOptions, ...initialOptions };

  if (isClientKeyTicket(options.ticket)) {
    generateClientNonce(options.ticket, options.ttl)
    .then((key) => {
      options = { ...options, clientKey: encodeClientNonce(key) };
      const url = getUniversalURL(options);
      if (options.away) {
        window.location.href = url;
      } else {
        resolve(url);
      }
    });
  } else {
    const url = getUniversalURL(options);
    if (options.away) {
      window.location.href = url;
    } else {
      resolve(url);
    }
  }
});

export default openWithTicket;
