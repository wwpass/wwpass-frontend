import QRCode from 'qrcode';
import { getUniversalURL } from '../urls';
import WWPassError from '../error';
import { WWPASS_STATUS } from '../passkey/constants';
import loginButtonSGV from './loginButton.svg';

const isMobile = () => navigator && (
  ('userAgent' in navigator && navigator.userAgent.match(/iPhone|iPod|iPad|Android/i))
  || ((navigator.maxTouchPoints > 1) && (navigator.platform === 'MacIntel')));

const removeLoader = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const switchLinkStyle = `
  background: #FFFFFF;
  color: #000F2C;
  text-align: center;
  padding: .3em 0;
  width: 100%;
  display: inline-block;
  text-decoration-line: underline;
`;

let haveStyleSheet = false;
const setLoader = (element, styles) => {
  const loaderClass = `${styles.prefix || 'wwp_'}qrcode_loader`;
  const loader = document.createElement('div');
  loader.className = loaderClass;
  loader.innerHTML = `<div class="${loaderClass}_blk"></div>
  <div class="${loaderClass}_blk ${loaderClass}_delay"></div>
  <div class="${loaderClass}_blk ${loaderClass}_delay"></div>
  <div class="${loaderClass}_blk"></div>`;
  if (!haveStyleSheet) {
    const style = document.createElement('style');
    style.innerHTML = `@keyframes ${styles.prefix || 'wwp_'}pulse {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
    .${loaderClass} {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-around;
      align-items: center;
      width: 30%;
      height: 30%;
      margin-left: 35%;
      padding-top: 35%;
    }
    .${loaderClass}_blk {
      height: 35%;
      width: 35%;
      animation: ${styles.prefix || 'wwp_'}pulse 0.75s ease-in infinite alternate;
      background-color: #cccccc;
    }
    .${loaderClass}_delay {
      animation-delay: 0.75s;
    }`;
    document.getElementsByTagName('head')[0].appendChild(style);
    haveStyleSheet = true;
  }
  removeLoader(element);
  element.appendChild(loader);
};

const setRefersh = (element, error) => {
  const httpsRequired = error instanceof WWPassError && error.code === WWPASS_STATUS.SSL_REQUIRED;
  const offline = window.navigator.onLine !== undefined && !window.navigator.onLine;
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.height = '100%';
  wrapper.style.width = '100%';
  const refreshNote = document.createElement('div');
  refreshNote.style.margin = '0 10%';
  refreshNote.style.width = '80%';
  refreshNote.style.textAlign = 'center';
  refreshNote.style.overflow = 'hidden';
  let text = 'Error occured';
  if (httpsRequired) {
    text = 'Please use HTTPS';
  } else if (offline) {
    text = 'No internet connection';
  }
  refreshNote.innerHTML = `<p style="margin:0; font-size: 1.2em; color: black;">${text}</p>`;
  let refreshButton = null;
  if (!httpsRequired) {
    refreshButton = document.createElement('a');
    refreshButton.textContent = 'Retry';
    refreshButton.style.fontWeight = '400';
    refreshButton.style.fontFamily = '"Arial", sans-serif';
    refreshButton.style.fontSize = '1.2em';
    refreshButton.style.lineHeight = '1.7em';
    refreshButton.style.cursor = 'pointer';
    refreshButton.href = '#';
    refreshNote.appendChild(refreshButton);
  }
  wrapper.appendChild(refreshNote);
  // eslint-disable-next-line no-console
  console.error(`Error in WWPass Library: ${error}`);
  removeLoader(element);
  element.appendChild(wrapper);
  return httpsRequired ? Promise.reject(error.message)
    : new Promise((resolve) => {
      // Refresh after 1 minute or on click
      setTimeout(() => {
        resolve({ refresh: true });
      }, 60000);
      refreshButton.addEventListener('click', (event) => {
        resolve({ refresh: true });
        event.preventDefault();
      });
      if (offline) {
        window.addEventListener('online', () => resolve({ refresh: true }));
      }
    });
};

const debouncePageVisibilityFactory = (state = 'visible') => {
  let debounce = null;
  return (fn) => {
    debounce = fn;

    const onDebounce = () => {
      if (document.visibilityState === state) {
        debounce();
        document.removeEventListener('visibilitychange', onDebounce);
      }
    };

    if (document.visibilityState === state) {
      debounce();
    } else {
      document.addEventListener('visibilitychange', onDebounce);
    }
  };
};

const debouncePageVisible = debouncePageVisibilityFactory();

const QRCodeLogin = (
  parentElement,
  wwpassURLoptions,
  ttl,
  qrcodeStyle
) => new Promise((resolve) => {
  const QRCodeElement = document.createElement('canvas');
  QRCode.toCanvas(QRCodeElement,
    getUniversalURL(wwpassURLoptions, false),
    qrcodeStyle || {}, (error) => {
      if (error) {
        throw error;
      }
    });
  if (qrcodeStyle) {
    QRCodeElement.className = `${qrcodeStyle.prefix}qrcode_canvas`;
    QRCodeElement.style.max_width = `${qrcodeStyle.width}px`;
    QRCodeElement.style.max_height = `${qrcodeStyle.width}px`;
  }
  QRCodeElement.style.height = '100%';
  QRCodeElement.style.width = '100%';

  const qrCodeSwitchLink = document.createElement('a');
  qrCodeSwitchLink.style = switchLinkStyle;
  qrCodeSwitchLink.innerText = 'or log in on this device';
  qrCodeSwitchLink.addEventListener('click', () => {
    resolve({ button: true });
  });
  removeLoader(parentElement);
  parentElement.appendChild(QRCodeElement);
  parentElement.appendChild(qrCodeSwitchLink);
  setTimeout(() => {
    debouncePageVisible(() => {
      resolve({ refresh: true });
    });
  }, ttl * 900);
});

const sameDeviceLogin = (parentElement) => new Promise((resolve) => {
  const universalLinkElement = document.createElement('a');
  universalLinkElement.style.display = 'inline-block';
  universalLinkElement.style.textAlign = 'center';
  universalLinkElement.style.width = '100%';
  universalLinkElement.innerHTML = loginButtonSGV;
  const qrCodeSwitchLink = document.createElement('a');
  qrCodeSwitchLink.style = switchLinkStyle;
  qrCodeSwitchLink.innerText = 'or show QRCode to login';
  universalLinkElement.addEventListener('click', () => {
    resolve({ away: true });
  });
  qrCodeSwitchLink.addEventListener('click', () => {
    resolve({ qrcode: true });
  });
  removeLoader(parentElement);
  parentElement.appendChild(universalLinkElement);
  parentElement.appendChild(qrCodeSwitchLink);
});

const clearQRCode = (parentElement, style) => setLoader(parentElement, style);

export {
  QRCodeLogin,
  sameDeviceLogin,
  clearQRCode,
  setRefersh,
  isMobile
};
