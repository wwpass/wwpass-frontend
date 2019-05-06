import { getCallbackURL } from './urls';

const navigateToCallback = (options) => {
  window.location.href = getCallbackURL(options);
};

export default navigateToCallback;
