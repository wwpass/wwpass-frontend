import { wwpassQRCodeAuth } from './qrcode/auth';
import { wwpassPasskeyAuth } from './passkey/auth';

const absolutePath = (href) => {
  const link = document.createElement('a');
  link.href = href;
  return link.href;
};

const authInit = (initialOptions) => {
  const defaultOptions = {
    ticketURL: '',
    callbackURL: '',
    hw: false,
    ppx: 'wwp_',
    version: 2,
    log: () => {}
  };

  const options = { ...defaultOptions, ...initialOptions };
  options.callbackURL = absolutePath(options.callbackURL);
  options.passkeyButton = (typeof options.passkey === 'string') ? document.querySelector(options.passkey) : options.passkey;
  options.qrcode = (typeof options.qrcode === 'string') ? document.querySelector(options.qrcode) : options.qrcode;

  const promises = [];

  if (options.passkeyButton) {
    promises.push(wwpassPasskeyAuth(options));
  }
  promises.push(wwpassQRCodeAuth(options));
  return Promise.race(promises);
};

export default authInit;
