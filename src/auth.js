import { absolutePath } from './util';
import navigateToCallback from './navigation';
import { WWPASS_STATUS } from './constants';
import {
  appAuth,
  qrCodeAuthWrapper,
  redirectToWWPassApp,
  isMobile
} from './qrcode/auth';

/*
 * WWPass auth with mobile PassKey
 *
options = {
    'ticketURL': undefined, // string
    'callbackURL': undefined, // string
    'uiType': 'auto', // 'auto' | 'button' | 'qrcode'
    'uiSwitch': 'auto', // 'auto' | 'always' | 'never'
    'development': false, // work with dev server
    'log': function (message) || console.log, // another log handler
}
 */
const wwpassMobileAuth = async (initialOptions) => {
  const defaultOptions = {
    ticketURL: undefined,
    callbackURL: undefined,
    uiType: 'auto',
    uiSwitch: 'auto',
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

  let executor = null;
  switch (options.uiType) {
  case 'button':
    executor = appAuth;
    break;
  case 'qrcode':
    executor = qrCodeAuthWrapper;
    break;
  case 'auto':
  default:
    executor = isMobile() ? appAuth : qrCodeAuthWrapper;
    break;
  }

  if (options.uiCallback) {
    options.uiCallback(executor === appAuth ? { button: true } : { qrcode: true });
  }

  // Continue until an exception is thrown or qrcode element is removed from DOM
  do {
    // eslint-disable-next-line no-await-in-loop
    const result = await executor(options);
    if (options.uiCallback) options.uiCallback(result);
    if (result.away) {
      // eslint-disable-next-line no-await-in-loop
      await redirectToWWPassApp(options, result);
    } else if (result.button) {
      executor = appAuth;
    } else if (result.qrcode) {
      executor = qrCodeAuthWrapper;
    }
    if (result.ticket) {
      navigateToCallback(result);
    }
    if (!result.refresh) {
      if (options.once || result.status === WWPASS_STATUS.TERMINAL_ERROR) return result;
    }
  } while (document.documentElement.contains(options.qrcode));
  return {
    status: WWPASS_STATUS.TERMINAL_ERROR,
    reason: 'QRCode element is not in DOM'
  };
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
  if (typeof (options.callbackURL) === 'string') {
    options.callbackURL = absolutePath(options.callbackURL);
  }
  options.passkeyButton = (typeof options.passkey === 'string') ? document.querySelector(options.passkey) : options.passkey;
  options.qrcode = (typeof options.qrcode === 'string') ? document.querySelector(options.qrcode) : options.qrcode;

  return wwpassMobileAuth(options);
};

export {
  authInit,
  wwpassMobileAuth
};
