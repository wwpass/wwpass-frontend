import QRCode from 'qrcode';
import qrCodeLogoSVG from './gradient.svg';
import smallQrCodeLogoSVG from './small_gradient.svg';

function qrToElements(qr, size) {
  const height = 0.9;
  const dy = (1 - height) / 2;
  const rx = 0.5;

  function isSpecial(x, y) {
    // for a "pixel" of a QR-code, returns if it is in a reference squaire
    // (reference squaires are not rendered with our special round-cornered style)
    return ((x < 8 && y < 8) || (x < 8 && y > (size - 9)) || (x > (size - 9) && y < 8));
  }

  function drawRefSquaire(x, y) {
    // creates elements of SVG for big reference squaire
    const path = `<path d="M ${x} ${y} h 7 v 7 h -7 Z M ${x + 1} ${y + 1} v 5 h 5 v -5 Z"/>`;
    const rect = `<rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return path + rect;
  }

  function drawRef() {
    // creates three big reference squaires in the corners of QR-code
    return drawRefSquaire(0, 0) + drawRefSquaire(0, size - 7) + drawRefSquaire(size - 7, 0);
  }

  function drawRect(x, y, length) {
    // creates one rounded-cornered rectangle as an element of QR-code
    return `<rect height="${height}" rx="${rx}" x="${x + dy}" y="${y + dy}" width="${length - 2 * dy}"/>`;
  }

  function drawRects() {
    // creates the main part of QR-code, made of round-cornered rectangles
    let i;
    let j;
    let paint;
    let startj;
    let res = '';
    for (i = 0; i < size; i += 1) {
      paint = false;
      startj = 0;
      for (j = 0; j <= size; j += 1) {
        const index = i * size + j;
        if (paint && (isSpecial(j, i) || j === size || qr[index] === 0)) {
          res += drawRect(startj, i, j - startj);
          paint = false;
        } else if (!paint && j < size && !isSpecial(j, i) && qr[index] === 1) {
          startj = j;
          paint = true;
        }
      }
    }
    return res;
  }

  return `${drawRects()}${drawRef()}`;
}

export function renderQR(text, opts) {
  const qrData = QRCode.create(text, opts);
  const color = '#000F2C';
  const qrMargin = 4;
  const qrcodesize = qrData.modules.size + qrMargin * 2;

  const g = `<g fill="${color}"> ${qrToElements(qrData.modules.data, qrData.modules.size)} </g>`;
  const viewBox = `viewBox="${-qrMargin} ${-qrMargin} ${qrcodesize} ${qrcodesize}"`;
  const svgTag = `<svg xmlns="http://www.w3.org/2000/svg" ${viewBox}> ${g}
  </svg>`;

  return { svgTag, qrcodesize, qrMargin };
}

function createInnerSvg(isBig, innerOffset, innerSize) {
  let innerText;
  const viewBoxSize = 100;
  if (isBig) {
    innerText = qrCodeLogoSVG;
  } else {
    innerText = smallQrCodeLogoSVG;
  }
  const viewBox = `"0 0 ${viewBoxSize} ${viewBoxSize}"`;
  return `<svg x="${innerOffset}" y="${innerOffset}" width="${innerSize}" height="${innerSize}" viewBox=${viewBox}>
  ${innerText}
  </svg>`;
}

export function insertInnerSvg(QRCodeElement, qrcodesize, qrMargin) {
  const outerSvg = QRCodeElement.getElementsByTagName('svg')[0];

  /* Size of inner logo SVG. 24% rounded to match odd number of untis
   * + 0.1 to cover the gap between units */
  const innerSize = Math.floor(qrcodesize * 0.12) * 2 + 1.1;
  // Center the inner logo
  const innerOffset = (qrcodesize - innerSize) / 2 - qrMargin;

  const clientInnerSize = outerSvg.clientHeight * (innerSize / qrcodesize);

  const isBig = (clientInnerSize > 50);
  outerSvg.innerHTML += createInnerSvg(isBig, innerOffset, innerSize);
}
