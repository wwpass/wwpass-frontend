import QRCode from 'qrcode';

function qrToElements(qr, size) {
  const height = 0.9;
  const dy = (1 - height) / 2;
  const rx = 0.5;

  function isSpecial(x, y) {
    return ((x < 8 && y < 8) || (x < 8 && y > (size - 9)) || (x > (size - 9) && y < 8));
  }

  function drawRefSquaire(x, y) {
    const path = `<path d="M ${x} ${y} h 7 v 7 h -7 Z M ${x+1} ${y+1} v 5 h 5 v -5 Z"/>`;
    const rect = `<rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return path + rect;
  }

  function drawRef() {
    return drawRefSquaire(0, 0) + drawRefSquaire(0, size - 7) + drawRefSquaire(size - 7, 0);
  }

  function drawRect(x, y, length) {
    return `<rect height="${height}" rx="${rx}" x="${x + dy}" y="${y + dy}" width="${length - 2 * dy}"/>`;
  }

  function drawRects(res) {
    let i, j, paint, startj;
    for (i = 0; i < size; i++) {
      paint = false;
      startj = 0;
      for (j = 0; j <= size; j++) {
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

  return drawRects(drawRef());
}

function renderQR(text, opts) {
  const qrData = QRCode.create(text, opts);
  const color = 'black';
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

export {renderQR}
