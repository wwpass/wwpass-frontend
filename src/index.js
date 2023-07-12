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
import packageInfo from '../package.json';

if ('console' in window && window.console.log) {
  window.console.log(`WWPass frontend library version ${packageInfo.version}`);
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
