import {
  authInit,
  openWithTicket,
  isClientKeyTicket,
  cryptoPromise,
  copyClientNonce,
  updateTicket,
  pluginPresent,
  waitForRemoval,
  WWPASS_STATUS
} from './lib';

import { version } from '../package.json';

if ('console' in window && window.console.log) {
  window.console.log(`WWPass frontend library version ${version}`);
}

window.WWPass = {
  authInit,
  openWithTicket,
  isClientKeyTicket,
  cryptoPromise,
  copyClientNonce,
  updateTicket,
  pluginPresent,
  waitForRemoval,
  STATUS: WWPASS_STATUS
};
