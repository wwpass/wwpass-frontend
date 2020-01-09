import { WWPASS_STATUS, WWPASS_UNSUPPORTED_PLATFORM_MSG_TMPL } from './constants';

const prefix = (window.location.protocol === 'https:') ? 'https:' : 'http:';
const CSS = `${prefix}//cdn.wwpass.com/packages/wwpass.js/2.4/wwpass.js.css`;

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

const wwpassMessageForPlatform = (platformName) => `${WWPASS_UNSUPPORTED_PLATFORM_MSG_TMPL} ${platformName}`;


const wwpassShowError = (message, title, onCloseCallback) => {
  if (!document.getElementById('_wwpass_css')) {
    const l = document.createElement('link');
    l.id = '_wwpass_css';
    l.rel = 'stylesheet';
    l.href = CSS;
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
    onCloseCallback();
    return false;
  });
  return true;
};

const wwpassNoSoftware = (code, onclose) => {
  if (code === WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND) {
    const client = isNativeMessaging();
    let message = '';
    if (client) {
      if (client === 'Chrome') {
        const returnURL = encodeURIComponent(window.location.href);
        message = '<p>The WWPass Authentication extension for Chrome is not installed or is disabled in browser settings.';
        message += '<p>Click the link below to install and enable the WWPass Authentication extension.';
        message += `<p><a href="https://chrome.wwpass.com/?callbackURL=${returnURL}">Install WWPass Authentication Extension</a>`;
      } else if (client === 'Firefox') {
        // Firefox
        const returnURL = encodeURIComponent(window.location.href);
        message = '<p>The WWPass Authentication extension for Firefox is not installed or is disabled in browser settings.';
        message += '<p>Click the link below to install and enable the WWPass Authentication extension.';
        message += `<p><a href="https://firefox.wwpass.com/?callbackURL=${returnURL}">Install WWPass Authentication Extension</a>`;
      } else {
        // Wait Edge
      }
    } else {
      message = '<p>No Security Pack is found on your computer or WWPass&nbsp;Browser&nbsp;Plugin is disabled.</p><p>To install Security Pack visit <a href="https://ks.wwpass.com/download/">Key Services</a> or check plugin settings of your browser to activate WWPass&nbsp;Browser&nbsp;Plugin.</p><p><a href="https://support.wwpass.com/?topic=604">Learn more...</a></p>';
    }
    wwpassShowError(message, 'WWPass &mdash; No Software Found', onclose);
  } else if (code === WWPASS_STATUS.UNSUPPORTED_PLATFORM) {
    wwpassShowError(wwpassMessageForPlatform(wwpassPlatformName()), 'WWPass &mdash; Unsupported Platform', onclose);
  }
};

const renderPassKeyButton = () => {
  const button = document.createElement('button');
  button.innerHTML = '<svg id="icon-button_logo" viewBox="0 0 34 20" style="fill: none; left: 28px; stroke-width: 2px; width: 35px; height: 25px; top: 5px; position: absolute;"><switch><g><title>button_logo</title><path fill="#FFF" d="M31.2 20h-28c-1.7 0-3-1.3-3-3V3c0-1.7 1.3-3 3-3h27.4C32.5 0 34 1.6 34 3.6c0 1.3-.8 2.5-1.9 3L34 16.8c.2 1.6-.9 3-2.5 3.1-.1.1-.2.1-.3.1zM27 6h-1c-1.1 0-2 .9-2 2v1h-8.3c-.8-2.8-3.8-4.4-6.5-3.5S4.8 9.2 5.6 12s3.8 4.4 6.5 3.5c1.7-.5 3-1.8 3.5-3.5H27V6zm-1 1c-.6 0-1 .4-1 1v2H12.1V8.3c0-.2-.1-.3-.2-.3h-.2l-3.6 2.3c-.1.1-.2.3-.1.4l.1.1 3.6 2.2c.1.1.3 0 .4-.1V11H26V7z"></path></g></switch></svg> Log in with PassKey';
  button.setAttribute('style', 'color: white; background-color: #2277E6; font-weight: 400; font-size: 18px; line-height: 36px; font-family: "Arial", sans-serif; padding-right: 15px; cursor: pointer; height: 40px; width: 255px; border-radius: 3px; border: 1px solid #2277E6; padding-left: 60px; text-decoration: none; position: relative;');
  return button;
};

export {
  wwpassNoSoftware,
  wwpassShowError,
  wwpassMessageForPlatform,
  renderPassKeyButton
};
