import { WWPASS_STATUS } from '../constants';
import {
  noChromeExtension,
  noFirefoxExtension,
  noSecurityPack,
  errorDialogCSS,
  passkeyButtonCSS,
  passkeyButtonHTML,
  unsupprotedPlatfromMessage
} from './ui_elements';

const isNativeMessaging = () => {
  const { userAgent } = navigator;

  let re = /Firefox\/([0-9]+)\./;
  let match = userAgent.match(re);
  if (match && match.length > 1) {
    const version = match[1];
    if (Number(version) >= 51) {
      return 'Firefox';
    }
  }

  re = /Chrome\/([0-9]+)\./;
  match = userAgent.match(re);
  if (match && match.length > 1) {
    const version = match[1];
    if (Number(version) >= 45) {
      return 'Chrome';
    }
  }

  return false;
};

const wwpassPlatformName = () => {
  const { userAgent } = navigator;
  const knownPlatforms = ['Android', 'iPhone', 'iPad'];
  for (let i = 0; i < knownPlatforms.length; i += 1) {
    if (userAgent.search(new RegExp(knownPlatforms[i], 'i')) !== -1) {
      return knownPlatforms[i];
    }
  }
  return null;
};

const wwpassMessageForPlatform = (platformName) => `${unsupprotedPlatfromMessage} ${platformName}`;

const wwpassShowError = (message, title) => new Promise((resolve) => {
  if (!document.getElementById('_wwpass_css')) {
    const l = document.createElement('style');
    l.id = '_wwpass_css';
    l.innerText = errorDialogCSS;
    document.head.appendChild(l);
  }

  const dlg = document.createElement('div');
  dlg.id = '_wwpass_err_dlg';

  const dlgClose = document.createElement('span');
  dlgClose.innerHTML = 'Close';
  dlgClose.id = '_wwpass_err_close';

  const header = document.createElement('h1');
  header.innerHTML = title;

  const text = document.createElement('div');
  text.innerHTML = message;


  dlg.appendChild(header);
  dlg.appendChild(text);
  dlg.appendChild(dlgClose);
  document.body.appendChild(dlg);

  document.getElementById('_wwpass_err_close').addEventListener('click', () => {
    const elem = document.getElementById('_wwpass_err_dlg');
    elem.parentNode.removeChild(elem);
    resolve();
    return false;
  });
  return true;
});

const wwpassNoSoftware = async (code) => {
  if (code === WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND) {
    const client = isNativeMessaging();
    let message = '';
    if (client) {
      if (client === 'Chrome') {
        message = noChromeExtension(encodeURIComponent(window.location.href));
      } else if (client === 'Firefox') {
        // Firefox
        message = noFirefoxExtension(encodeURIComponent(window.location.href));
      } else {
        // Wait for Edge extension
      }
    } else {
      message = noSecurityPack;
    }
    await wwpassShowError(message, 'WWPass &mdash; No Software Found');
  } else if (code === WWPASS_STATUS.UNSUPPORTED_PLATFORM) {
    await wwpassShowError(wwpassMessageForPlatform(wwpassPlatformName()), 'WWPass &mdash; Unsupported Platform');
  }
};

const renderPassKeyButton = () => {
  const button = document.createElement('button');
  button.innerHTML = passkeyButtonHTML;
  button.setAttribute('style', passkeyButtonCSS);
  return button;
};

export {
  wwpassNoSoftware,
  wwpassShowError,
  wwpassMessageForPlatform,
  renderPassKeyButton
};
