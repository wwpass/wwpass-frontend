import { getCallbackURL, getUniversalURL } from './urls';

const navigateToCallback = (options) => {
  if (typeof (options.callbackURL) === 'function') {
    options.callbackURL(getCallbackURL(options));
  } else { // URL string
    window.location.href = getCallbackURL(options);
  }
};

const navigateToMobileApp = (options) => {
  window.location.href = getUniversalURL(options);
};

export { navigateToCallback, navigateToMobileApp };
