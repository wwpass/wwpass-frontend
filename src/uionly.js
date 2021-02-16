import {
  sameDeviceLogin,
  QRCodeLogin,
  isMobile
} from './qrcode/ui';

import { version } from '../package.json';

const wwpassUICycle = async (parentElement, wwpassURLoptions, ttl, callback) => {
  let handler = isMobile() ? sameDeviceLogin : QRCodeLogin;
  while (document.documentElement.contains(parentElement)) {
    // eslint-disable-next-line no-await-in-loop
    const result = await handler(parentElement, wwpassURLoptions, ttl);
    callback(result);
    if (result.qrcode) handler = QRCodeLogin;
    if (result.button) handler = sameDeviceLogin;
  }
  return { noElement: true };
};

const renderWWPassUI = (parentElement, wwpassURLoptions, ttl, callback) => {
  wwpassUICycle(parentElement, wwpassURLoptions, ttl, callback).then(
    (res) => {
      callback(res);
    }
  );
};

if ('console' in window && window.console.log) {
  window.console.log(`WWPass frontend library version ${version}`);
}

window.WWPassUI = {
  sameDeviceLogin,
  QRCodeLogin,
  renderWWPassUI
};
