import { WWPassCryptoPromise as cryptoPromise } from './wwpass.crypto';
import { copyClientNonce } from './nonce';
import { wwpassMobileAuth as QRCodeAuth, authInit } from './auth';
import openWithTicket from './open';
import { wwpassPasskeyAuth as passkeyAuth } from './passkey/auth';
import { pluginPresent, waitForRemoval } from './passkey/passkey';
import { isClientKeyTicket } from './ticket';
import { updateTicket } from './getticket';


import { WWPASS_STATUS } from './constants';

export {
  authInit,
  QRCodeAuth,
  passkeyAuth,
  openWithTicket,
  isClientKeyTicket,
  cryptoPromise,
  copyClientNonce,
  updateTicket,
  pluginPresent,
  waitForRemoval,
  WWPASS_STATUS
};
