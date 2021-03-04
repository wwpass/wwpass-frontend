import { renderQR, insertInnerSvg } from './renderQR';
import { getUniversalURL } from '../urls';
import WWPassError from '../error';
import { WWPASS_STATUS } from '../passkey/constants';

const isMobile = () => navigator && (
  ('userAgent' in navigator && navigator.userAgent.match(/iPhone|iPod|iPad|Android/i))
  || ((navigator.maxTouchPoints > 1) && (navigator.platform === 'MacIntel')));

const removeLoader = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};


let haveStyleSheet = false;
const setLoader = (element, styles) => {
  const loaderClass = `${styles.prefix || 'wwp_'}qrcode_loader`;
  const loader = document.createElement('div');
  loader.innerHTML = `<div style="width: 100%; height: 0; padding-block-end: 100%; position: relative;">
  <div class="${loaderClass}">
    <div class="${loaderClass}_blk"></div>
    <div class="${loaderClass}_blk ${loaderClass}_delay"></div>
    <div class="${loaderClass}_blk ${loaderClass}_delay"></div>
    <div class="${loaderClass}_blk"></div>
  </div>
</div>`;
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
      position: absolute;
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
  qrcodeStyle,
  showSwitch
) => new Promise((resolve) => {
  const QRCodeElement = document.createElement('div');
  const { svgTag, qrcodesize, qrMargin } = renderQR(
    getUniversalURL(wwpassURLoptions, false),
    qrcodeStyle || {}
  );
  QRCodeElement.innerHTML = svgTag;
  const svgDiv = QRCodeElement;
  if (qrcodeStyle) {
    QRCodeElement.className = `${qrcodeStyle.prefix}qrcode_div`;
    QRCodeElement.style.max_width = `${qrcodeStyle.width}px`;
    QRCodeElement.style.max_height = `${qrcodeStyle.width}px`;
  }
  QRCodeElement.style.position = 'relative';
  QRCodeElement.style.width = '100%';
  let authElement = null;
  if (showSwitch) {
    const universalLinkElement = document.createElement('a');
    if (wwpassURLoptions) universalLinkElement.href = getUniversalURL(wwpassURLoptions, true);
    else universalLinkElement.href = '#';
    universalLinkElement.addEventListener('click', (e) => {
      if (!universalLinkElement.href.endsWith('#')) return;
      resolve({ away: true, linkElement: universalLinkElement });
      e.preventDefault();
    });
    universalLinkElement.appendChild(QRCodeElement);
    authElement = universalLinkElement;
  } else authElement = QRCodeElement;

  const qrCodeSwitchLink = document.createElement('a');
  qrCodeSwitchLink.href = '#';
  qrCodeSwitchLink.style.background = '#FFFFFF';
  qrCodeSwitchLink.style.color = '#000F2C';
  qrCodeSwitchLink.style.textAlign = 'center';
  qrCodeSwitchLink.style.padding = '.3em 0';
  qrCodeSwitchLink.style.width = '100%';
  qrCodeSwitchLink.style.display = 'inline-block';
  qrCodeSwitchLink.style.textDecorationLine = 'underline';
  qrCodeSwitchLink.style.cursor = 'pointer';
  qrCodeSwitchLink.innerText = 'or use WWPass Key on this device';
  qrCodeSwitchLink.id = 'wwp_switch_to_button';
  qrCodeSwitchLink.addEventListener('click', () => {
    resolve({ button: true });
  });

  removeLoader(parentElement);
  parentElement.appendChild(authElement);
  if (showSwitch) {
    parentElement.appendChild(qrCodeSwitchLink);
  }
  insertInnerSvg(svgDiv, qrcodesize, qrMargin);
  if (ttl) {
    setTimeout(() => {
      debouncePageVisible(() => {
        resolve({ refresh: true });
      });
    }, ttl);
  }
});

let haveButtonStyleSheet = false;
const addButtonStyleSheet = () => {
  if (!haveButtonStyleSheet) {
    const style = document.createElement('style');
    style.innerHTML = `
      @font-face {
        font-family: "Roboto";
        font-style: normal;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url('https://fonts.gstatic.com/s/roboto/v18/Hgo13k-tfSpn0qi1SFdUfVtXRa8TVwTICgirnJhmVJw.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;
        font-display: swap;
      }

      .wwpassButtonContainer {
        min-width: 210px;
        /* margin: 20px 10px;
        display: flex; */
        justify-content: center;
      }

      .wwpassLoginButton {
        display: flex;


        height: 48px;

        background-color: #000F2C;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="110" height="48" viewBox="0 0 110 48"><defs><style>.a{fill:url(%23a);}.b{fill:url(%23b);}.c{fill:url(%23c);}.d{fill:url(%23d);}.e{fill:url(%23e);}%3C%2Fstyle%3E<linearGradient id="a" x1="33.07" y1="53.98" x2="103.63" y2="13.24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%2300a3ff"/><stop offset="0.66" stop-color="%23007fff"/><stop offset="1" stop-color="%234200ff"/></linearGradient><linearGradient id="b" x1="31.75" y1="45.12" x2="109.11" y2="0.46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%2300ff29"/><stop offset="0.39" stop-color="%2300a3ff"/><stop offset="0.65" stop-color="%23007fff"/><stop offset="1" stop-color="%234200ff"/></linearGradient><linearGradient id="c" x1="21.24" y1="35.3" x2="61.59" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%2300ff29"/><stop offset="1" stop-color="%2300a3ff"/></linearGradient><linearGradient id="d" x1="26.02" y1="28.76" x2="58.35" y2="10.09" xlink:href="%23c"/><linearGradient id="e" x1="32.49" y1="47.89" x2="97.86" y2="10.15" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%2300ff29"/><stop offset="0.36" stop-color="%2300a3ff"/><stop offset="0.61" stop-color="%23007fff"/><stop offset="1" stop-color="%234200ff"/></linearGradient></defs><polygon class="a" points="60 0 110 0 110 48 43 48 60 0"/><path class="b" d="M45.68,48h-.74l17-48h.9ZM60.8,0H60L42.91,48h.82ZM59.65,0h-.82L41.75,48h.83ZM58,0h-.71L40.21,48H41ZM55,0h-.82L37.13,48H38ZM76.85,0h-.7L59.08,48h.69ZM64,0h-.93l-17,48h.85Zm10.4,0h-.83L56.51,48h.82ZM72.23,0h-.7L54.46,48h.69Zm3.2,0h-.82L57.54,48h.82ZM71.07,0h-.69L53.3,48H54Zm-3,0h-.91l-17,48h.74Zm1.07,0h-.72L51.38,48h.8ZM66.45,0H65L47.91,48h1.47ZM53.87,0h-.82L36,48h.82ZM35,0h-.83L17.11,48h.83Zm2.05,0h-.82L19.16,48H20Zm1.13,0h-.9l-17,48H21Zm2.47,0H39.19L22.12,48h1.46ZM32.44,0h-.82L14.54,48h.83Zm1.41,0H33L16,48h.82ZM11.34,48h.82L29.23,0h-.82ZM44,0h-.82L26.09,48h.83Zm2.57,0h-.83L28.66,48h.83ZM42.22,0H41.5L24.43,48h.8Zm8.83,0h-.7L33.28,48H34ZM49.13,0H47.66L30.59,48h1.46Zm3.2,0h-.8l-17,48h.72ZM45.4,0h-.82L27.51,48h.82ZM57.08,0h-.82L39.18,48H40ZM110,3.2V1.15L93.31,48H94Zm0,3.25V4.39L94.47,48h.73ZM109.09,0h-1.38L90.62,48H92ZM110,12V10.15L96.52,48h.71ZM102.7,0H102L84.87,48h.81ZM78.13,0H77.3L60.23,48h.83Zm28.42,0h-1.4L88.08,48h1.45ZM110,29.87V26.2L102.27,48h1.27Zm0,9V36.81L106,48h.73Zm0,4.24v-2L107.56,48h.71Zm0-7.48V33.57L104.86,48h.73Zm0-14.41V17.36L99.09,48h1.37ZM100.87,0H100L83,48h.83ZM110,15.09V13.17L97.65,48h.63ZM104,0h-.85L86,48h.83ZM89.73,0H89L71.91,48h.81Zm-3.1,0h-.85L68.7,48h.83Zm2,0h-.86l-17,48h.83ZM85.47,0h-.85L67.55,48h.83ZM80.75,0h-1L62.67,48h1.06Zm3.18,0H83.1l-17,48h.73ZM82.16,0h-.75L64.34,48h.81ZM92.4,0h-.85L74.48,48h.83ZM97,0h-.85L79.1,48h.83Zm1.16,0h-.85L80.25,48h.83Zm-7,0H90.4L73.32,48h.81Zm3.72,0h-.65L77.07,48h.78Zm4.75,0h-.86l-17,48h.83ZM93.71,0h-.64L75.91,48h.79Z"/><path class="c" d="M16.13,48H15.6L32.67,0h.54ZM37,0h-.54L19.35,48h.53Zm2.83,0h-.62l-17,48h.54ZM39,0h-.62l-17,48h.45ZM34,0h-.54L16.35,48h.53Zm1.92,0h-.46L18.35,48h.53Zm-.59,0h-.53L17.68,48h.54Zm2.42,0h-.54L20.1,48h.53Zm3.66,0h-.95L23.35,48h.95Zm5.17,0H46L28.93,48h.54Zm.67,0h-.54L29.6,48h.53ZM45.12,0h-.45L27.6,48h.45ZM42.46,0h-.62l-17,48h.45Zm1.91,0h-.45L26.85,48h.45ZM43.13,0h-.46L25.6,48h.53ZM0,48H.54L17.61,0h-.54ZM22.29,0h-.53L4.68,48h.54ZM23,0h-.62l-17,48h.45ZM21,0h-.54L3.35,48h.53Zm3.66,0h-.95L6.6,48h1ZM20.21,0h-.54L2.6,48h.53Zm-.92,0h-.53L1.68,48h.54ZM48.12,0h-.45L30.6,48h.45ZM28.46,0h-.54L10.85,48h.53Zm1.66,0h-.95L12.1,48h1ZM25.63,0h-.46L8.1,48h.53Zm5.74,0h-.45L13.85,48h.45Zm.84,0h-.54l-17,48h.45ZM26.79,0h-.53L9.18,48h.54Zm.92,0h-.54L10.1,48h.53ZM74.56,0h-.89L56.57,48h.9ZM70.4,0h-.48L52.82,48h.48ZM69.06,0h-.89L51.07,48H52Zm2.09,0h-.48L53.57,48h.48ZM65.73,0h-.56L48.1,48h.53ZM64.9,0h-.48L47.35,48h.53ZM63.73,0h-.56L46.1,48h.53ZM67.4,0h-.89L49.43,48h1Zm5,0H72L54.91,48h.47Zm6.25,0h-.48L61.07,48h.48Zm.92,0h-.4L62.07,48h.48Zm2.08,0h-.48L64.07,48h.48Zm-8.5,0h-.48l-17,48h.39ZM49,0h-.54L31.35,48h.53Zm27.6,0h-.89l-17,48h.81ZM77.9,0h-.48L60.32,48h.48ZM54.48,0h-.56L36.85,48h.53Zm1.25,0h-.56l-17,48h.54Zm-2,0h-.56L36.1,48h.53ZM51.57,0h-.48L34,48h.54Zm-.92,0H50L32.93,48h.7Zm5.83,0H56L38.93,48h.54ZM52.73,0h-.56l-17,48h.45ZM62.9,0h-.56l-17,48h.53ZM61.23,0h-.56L43.6,48h.53ZM59.82,0h-.4L42.27,48h.53ZM62,0h-.56L44.35,48h.53ZM57.4,0h-.48L39.85,48h.53Zm.83,0h-.56L40.6,48h.53Zm.84,0h-.4L41.52,48h.53Z"/><path class="d" d="M22.5,48H21.35L38.43,0h1.14ZM35.57,0h-.64L17.85,48h.65Zm1.1,0H36L19,48h.65Zm7.5,0h-.64L26.45,48h.65Zm-10,0h-.55L16.55,48h.64Zm9.09,0h-.64L25.55,48h.65Zm-1.2,0h-.63l-17,48H25Zm-1,0h-.54L23.45,48H24ZM6.35,48H7L24.07,0h-.64ZM27.67,0H27L10,48h.65Zm-1.1,0h-.64L8.85,48H9.5Zm4.49,0h-.72l-17,48h.56ZM33,0H31.83L14.75,48H15.9Zm-2.8,0h-.64L12.45,48h.65Zm-1.6,0h-.64L10.85,48h.65Zm9,0h-.64L19.85,48h.65Zm20,0H57L40,48h.55Zm1.7,0h-.64L41.55,48h.65Zm-2.6,0h-.54L39.05,48h.55ZM55.18,0h-.55L37.55,48h.64ZM45.77,0h-.64L28.05,48h.65Zm15.4,0h-.54L43.55,48h.55Zm-1.1,0h-.64L42.35,48H43Zm2.1,0h-.64L44.45,48h.65ZM47.77,0h-.64L30.05,48h.65Zm6.59,0h-.72l-17,48h.56ZM46.48,0h-.55L28.85,48h.64Zm2.19,0H48L31,48h.65Zm4.4,0H51.93L34.85,48H36Zm-1.9,0h-.73l-17,48h.66Zm-.91,0h-.72l-17,48h.56Z"/><path class="e" d="M58.19,48h-.63L74.72,0h.49ZM74.31,0h-.49L56.66,48h.63Zm-1,0h-.67L55.55,48h.65Zm4.49,0h-.66L60.05,48h.65ZM76.9,0h-.67L59.15,48h.65Zm2,0h-.67l-17,48h.65Zm-11,0h-.67L50.15,48h.65ZM46.35,48h.84l17-48h-.78ZM71.21,0h-.58L53.55,48h.64Zm-5.9,0h-.58L47.65,48h.64ZM66.7,0H66L49,48h.56Zm3.61,0h-.67l-17,48h.65ZM68.8,0h-.67L51.05,48h.65ZM79.9,0h-.67L62.15,48h.65ZM72.31,0h-.58L54.65,48h.64Zm9,0h-.58L63.65,48h.64ZM92.9,0H91.82L74.73,48H75.8Zm4,0h-.58L79.23,48h.57Zm.9,0h-.58L80.13,48h.57ZM91.2,0h-.57l-17,48h.48Zm10.2,0h-.58L83.73,48h.57ZM98.91,0h-.49L81.33,48h.56ZM95.3,0H94.23l-17,48h1Zm-11,0H83.23L66.15,48h1.14Zm6,0h-.49L72.73,48h.56Zm-4,0H85.22L68.13,48H69.2Zm-4,0h-.66L64.55,48h.65ZM88.8,0h-.58L71.13,48h.57Zm-.9,0h-.58L70.23,48h.57Z"/></svg>');
        background-position: 190px;
        background-repeat: no-repeat;

        font-size: 18px;
        line-height: 48px;
        font-family: Roboto, Arial, Helvetica, sans-serif;

        padding-left: 24px;
        border: none;
        color: #FFFFFF;

        text-decoration: none;
    }

    .wwpassLoginButton:hover, .wwpassLoginButton:focus  {
        opacity: .9;
        color: #FFFFFF;
    }

    .wwpassQRButton {
      margin-top: 24px;
      display: flex;
      height: 48px;

      background-color: #000F2C;
      background-image: url('data:image/svg+xml;utf8,<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 17V25H18" stroke="white" stroke-width="2"/><rect x="3" y="22" width="7" height="7" stroke="white" stroke-width="2"/><rect x="3" y="3" width="7" height="7" stroke="white" stroke-width="2"/><rect x="22" y="3" width="7" height="7" stroke="white" stroke-width="2"/><path d="M19 7H14V14H10V18H2" stroke="white" stroke-width="2"/><path d="M2 14H7" stroke="white" stroke-width="2"/><path d="M29 17V25H25V18H18V10" stroke="white" stroke-width="2"/><path d="M13 3H19" stroke="white" stroke-width="2"/><path d="M13 29H18" stroke="white" stroke-width="2"/><path d="M24 29H30" stroke="white" stroke-width="2"/><path d="M21 14H30" stroke="white" stroke-width="2"/><path d="M21 30V22H17" stroke="white" stroke-width="2"/></svg>');
      background-position: right 8px top 8px;
      background-repeat: no-repeat;

      font-size: 18px;
      line-height: 48px;
      font-family: Roboto, Arial, Helvetica, sans-serif;

      padding-left:24px;
      border: none;
      color: #FFFFFF;
      text-decoration: none;
    }

    .wwpassQRButton:hover,
    .wwpassQRButton:focus {
      opacity: .9;
    }

    .wwpassQRButton:active {
      opacity: .7;
    }`;
    document.getElementsByTagName('head')[0].appendChild(style);
    haveButtonStyleSheet = true;
  }
};


const sameDeviceLogin = (
  parentElement,
  wwpassURLoptions,
  ttl,
  showSwitch = true
) => new Promise((resolve) => {
  addButtonStyleSheet();
  const universalLinkElement = document.createElement('a');
  universalLinkElement.className = 'wwpassLoginButton';
  universalLinkElement.classList.add('wwpass-frontend-custom');
  universalLinkElement.innerText = (wwpassURLoptions && wwpassURLoptions.buttonText) || 'Log in with WWPass';
  if (wwpassURLoptions) universalLinkElement.href = getUniversalURL(wwpassURLoptions, true);
  else universalLinkElement.href = '#';
  const qrCodeSwitchLink = document.createElement('a');
  if (showSwitch) {
    qrCodeSwitchLink.href = '#';
    qrCodeSwitchLink.className = 'wwpassQRButton';
    qrCodeSwitchLink.classList.add('wwpass-frontend-custom');
    qrCodeSwitchLink.innerText = 'Show QR code';
    qrCodeSwitchLink.addEventListener('click', (e) => {
      resolve({ qrcode: true });
      e.preventDefault();
    });
  }
  universalLinkElement.addEventListener('click', (e) => {
    if (!universalLinkElement.href.endsWith('#')) return;
    resolve({ away: true, linkElement: universalLinkElement });
    e.preventDefault();
  });
  const buttonContainer = document.createElement('div');
  buttonContainer.appendChild(universalLinkElement);
  if (showSwitch) {
    buttonContainer.appendChild(qrCodeSwitchLink);
  }
  buttonContainer.className = 'wwpassButtonContainer';
  removeLoader(parentElement);
  parentElement.appendChild(buttonContainer);
  if (ttl) {
    setTimeout(() => {
      debouncePageVisible(() => {
        resolve({ refresh: true });
      });
    }, ttl);
  }
});

const clearQRCode = (parentElement, style) => setLoader(parentElement, style);

export {
  QRCodeLogin,
  sameDeviceLogin,
  clearQRCode,
  setRefersh,
  isMobile
};
