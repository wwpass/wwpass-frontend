import QRCode from 'qrcode';
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

function qrToElements(qr, size) {
  const refTable = [
    [],
    [18],
    [22],
    [26],
    [30],
    [34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170]
  ];
  const version = (size - 17) / 4;
  const height = 0.9;
  const dy = (1 - height) / 2;
  const rx = 0.5;

  let res = "";

  function getCenters() {
    if (version == 1) return [];
    const index  = version - 1;
    if (version < 7) {
      return [[refTable[index][0], refTable[index][0]]];
    }
    const len = refTable[index].length;
    let result = [];
    for (let i=1; i<len; i++) {
      for (let j=1; j<len; j++) {
        result.push([refTable[index][i], refTable[index][j]]);
      }
    }
    for (let i=1; i<len - 1; i++) {
      result.push([refTable[index][i], refTable[index][0]]);
      result.push([refTable[index][0], refTable[index][i]]);
    }
    return result;
  }

  const centers = getCenters();

  function isSpecial(x, y) {
    if ((x<8 && y<8) || (x<8 && y>(size-9)) || (x>(size-9) && y<8)) return true;
    return centers.some(center => (Math.abs(x-center[0]) < 3 && Math.abs(y-center[1]) < 3));
  }

  function drawBig(x, y) {
    const path = `<path d="M ${x} ${y} h 7 v 7 h -7 Z M ${x+1} ${y+1} v 5 h 5 v -5 Z"/>`;
    const rect = `<rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`
    return path + rect;
  }

  function drawSmall(x, y) {
    const path = `<path d="M ${x} ${y} h 5 v 5 h -5 Z M ${x+1} ${y+1} v 3 h 3 v -3 Z"/>`;
    const rect = `<rect x="${x + 2}" y="${y + 2}" width="1" height="1"/>`
    return path + rect;
  }

  function drawRef(res) {
    res += drawBig(0, 0);
    res += drawBig(0, size - 7);
    res += drawBig(size - 7, 0);
    for (let center of centers) {
      res += drawSmall(center[0] - 2, center[1] - 2);
    }
    return res;
  }

  function drawRect(x, y, length) {
    return `<rect height="${height}" rx="${rx}" x="${x + dy}" y="${y + dy}" width="${length - 2 * dy}"/>`
  }

  function drawRects(res) {
    let i, j, paint, startj;
    for (i=0; i<size; i++) {
      paint = false;
      startj = 0;
      for (j=0; j<=size; j++) {
        const index = i * size + j;
        if (paint && (isSpecial(j, i) || j == size || qr[index] == 0)) {
          res += drawRect(startj, i, j - startj);
          paint = false;
        } else {
          if (!paint && j<size && !isSpecial(j, i) && qr[index] == 1) {
            startj = j;
            paint = true;
          }
        }
      }
    }
    return res;
  }

  return drawRef(drawRects(res));
}

function renderQR (qrData) {
  const color = "black";
  const qrMargin = 4;
  const size = qrData.modules.size;
  const data = qrData.modules.data;
  const qrcodesize = size + qrMargin * 2;
  const g =
    `<g fill="${color}">
      ${qrToElements(data, size)}
    </g>`;
  const viewBox = `viewBox="${-qrMargin} ${-qrMargin} ${qrcodesize} ${qrcodesize}"`;
  const svgTag = `<svg xmlns="http://www.w3.org/2000/svg" ${viewBox}> ${g} </svg>\n`;

  return svgTag;
}

function toRoundedQR(text, cb) {
  try {
    const data = QRCode.create(text);
    cb(null, renderQR(data));
  } catch (e) {
    cb(e);
  }
};

const QRCodePromise = (
  parentElement,
  wwpassURLoptions,
  ttl,
  qrcodeStyle
) => new Promise((resolve) => {
  let QRCodeElement = document.createElement('div');
  toRoundedQR(
    getUniversalURL(wwpassURLoptions, false), (error, result) => {
      if (error) {
        throw error;
      }
      QRCodeElement.innerHTML = result;
    });
  if (qrcodeStyle) {
    QRCodeElement.className = `${qrcodeStyle.prefix}qrcode_div`;
    QRCodeElement.style.max_width = `${qrcodeStyle.width}px`;
    QRCodeElement.style.max_height = `${qrcodeStyle.width}px`;
  }
  QRCodeElement.style.height = '100%';
  QRCodeElement.style.width = '100%';

  if (isMobile()) {
    // Wrapping QRCode canvas in <a>
    const universalLinkElement = document.createElement('a');
    universalLinkElement.href = getUniversalURL(wwpassURLoptions);

    universalLinkElement.appendChild(QRCodeElement);
    universalLinkElement.addEventListener('click', () => {
      resolve({ away: true });
    });
    QRCodeElement = universalLinkElement;
  }

  removeLoader(parentElement);
  parentElement.appendChild(QRCodeElement);
  setTimeout(() => {
    debouncePageVisible(() => {
      resolve({ refresh: true });
    });
  }, ttl * 900);
});

const clearQRCode = (parentElement, style) => setLoader(parentElement, style);

export {
  QRCodePromise,
  clearQRCode,
  setRefersh
};
