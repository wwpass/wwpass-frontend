import {
  sameDeviceLogin,
  QRCodeLogin
} from './qrcode/ui';

import { version } from '../package.json';

if ('console' in window && window.console.log) {
  window.console.log(`WWPass frontend library version ${version}`);
}

window.WWPassUI = {
  sameDeviceLogin,
  QRCodeLogin
};
