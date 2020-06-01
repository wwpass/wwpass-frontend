import { getCallbackURL } from './urls';

const navigateToCallback = (options) => {
  if (typeof (options.callbackURL) === 'function') {
    options.callbackURL(getCallbackURL(options));
  } else { // URL string
    window.location.href = getCallbackURL(options);
  }
};

export default navigateToCallback;
