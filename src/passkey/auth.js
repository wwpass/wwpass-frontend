import { WWPASS_STATUS, WWPASS_OK_MSG } from './constants';
import { abToB64 } from '../ab';
import { ticketAdapter } from '../ticket';
import { getTicket } from '../getticket';
import { getClientNonceWrapper } from '../nonce';
import { wwpassAuth, waitForRemoval } from './passkey';
import navigateToCallback from './../navigation';
import { renderPassKeyButton } from './ui';

const doWWPassPasskeyAuth = options => getTicket(options.ticketURL).then((json) => {
  const response = ticketAdapter(json);
  const ticket = response.ticket;
  return getClientNonceWrapper(ticket, response.ttl)
  .then(key => wwpassAuth({
    ticket,
    clientKeyNonce: key !== undefined ? abToB64(key) : undefined,
    log: options.log
  })).then(() => ticket);
  /* We may receive new ticket here but we need
   * to keep the original one to find nonce */
});

const wwpassPasskeyAuth = initialOptions => (new Promise((resolve, reject) => {
  const defaultOptions = {
    ticketURL: '',
    callbackURL: '',
    ppx: 'wwp_',
    log: () => {}
  };
  const options = Object.assign({}, defaultOptions, initialOptions);
  if (!options.passkeyButton) {
    reject({
      ppx: options.ppx,
      version: options.version,
      code: WWPASS_STATUS.INTERNAL_ERROR,
      message: 'Cannot find passkey element',
      callbackURL: options.callbackURL
    });
  }
  if (options.passkeyButton.children.length === 0) {
    options.passkeyButton.appendChild(renderPassKeyButton());
  }
  let authUnderway = false;
  options.passkeyButton.addEventListener('click', (e) => {
    if (!authUnderway) {
      authUnderway = true;
      doWWPassPasskeyAuth(options).then((newTicket) => {
        authUnderway = false;
        resolve({
          ppx: options.ppx,
          version: options.version,
          code: WWPASS_STATUS.OK,
          message: WWPASS_OK_MSG,
          ticket: newTicket,
          callbackURL: options.callbackURL,
          hw: true
        });
      }, (err) => {
        authUnderway = false;
        if (!err.code) {
          initialOptions.log('passKey error', err);
        } else if (err.code === WWPASS_STATUS.INTERNAL_ERROR || initialOptions.returnErrors) {
          reject({
            ppx: options.ppx,
            version: options.version,
            code: err.code,
            message: err.message,
            callbackURL: options.callbackURL
          });
        }
      });
    }
    e.preventDefault();
  }, false);
})).then(navigateToCallback, navigateToCallback);

export {
  wwpassPasskeyAuth,
  waitForRemoval
};
