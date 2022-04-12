import { WWPASS_STATUS, WWPASS_OK_MSG } from '../constants';
import { abToB64 } from '../ab';
import { ticketAdapter } from '../ticket';
import { getTicket } from '../getticket';
import { getClientNonceWrapper } from '../nonce';
import { wwpassAuth, waitForRemoval, pluginPresent } from './passkey';
import { renderPassKeyButton } from './ui';

const doWWPassPasskeyAuth = (options) => getTicket(options.ticketURL).then((json) => {
  const response = ticketAdapter(json);
  const { ticket } = response;
  return getClientNonceWrapper(ticket, response.ttl)
  .then((key) => wwpassAuth({
    ticket,
    clientKeyNonce: key !== undefined ? abToB64(key) : undefined,
    log: options.log
  })).then(() => ticket);
  /* We may receive new ticket here but we need
   * to keep the original one to find nonce */
});

const PASSKEY_BUTTON_TIMEOUT = 1000;

let recentlyClicked = false;
/* Setup the "Login with PassKey" button with appropriate event handler. */
const initPasskeyButton = (options, resolve, reject) => {
  const button = options.passkeyButton;

  // We render our desing only if provided element is empty
  if (button.innerHTML.length === 0) {
    button.appendChild(renderPassKeyButton());
  }

  // Not using addEventListener so on reinit the previous handler is overwritten.
  button.onclick = (e) => {
    if (recentlyClicked === false) {
      // Setting up guard against rapid double clicking
      // TODO: display a loader while the operation is in progress
      recentlyClicked = true;
      let enableButtonTimer = setTimeout(() => {
        recentlyClicked = false;
        enableButtonTimer = false;
      }, PASSKEY_BUTTON_TIMEOUT);

      doWWPassPasskeyAuth(options).then((newTicket) => {
        resolve({
          ppx: options.ppx,
          version: options.version,
          code: WWPASS_STATUS.OK,
          message: WWPASS_OK_MSG,
          ticket: newTicket,
          callbackURL: options.callbackURL,
          hw: true
        });
      }).catch((err) => {
        if (!err.code) {
          options.log('PassKey error: ', err);
        } else if (err.code === WWPASS_STATUS.INTERNAL_ERROR || options.returnErrors) {
          reject({
            ppx: options.ppx,
            version: options.version,
            code: err.code,
            message: err.message,
            callbackURL: options.callbackURL
          });
        }
      }).finally(() => {
        if (enableButtonTimer !== false) {
          clearTimeout(enableButtonTimer);
          enableButtonTimer = false;
          recentlyClicked = false;
        }
      });
    }
    e.preventDefault();
  };
};

const wwpassPasskeyAuth = (initialOptions) => (new Promise((resolve, reject) => {
  const defaultOptions = {
    ticketURL: '',
    callbackURL: '',
    ppx: 'wwp_',
    forcePasskeyButton: true,
    log: () => {}
  };
  const options = { ...defaultOptions, ...initialOptions };

  if (!options.passkeyButton) {
    reject({
      ppx: options.ppx,
      version: options.version,
      code: WWPASS_STATUS.INTERNAL_ERROR,
      message: 'Cannot find passkey element',
      callbackURL: options.callbackURL
    });
  }

  // Wait for WWPass Extension initialization and then render the button
  if (options.forcePasskeyButton || pluginPresent()) {
    if (options.passkeyButton.style.display === 'none') {
      options.passkeyButton.style.display = null;
    }
    initPasskeyButton(options, resolve, reject);
  } else {
    const displayBackup = options.passkeyButton.style.display;
    options.passkeyButton.style.display = 'none';

    const observer = new MutationObserver((_mutationsList, _observer) => {
      if (pluginPresent()) {
        _observer.disconnect();
        options.passkeyButton.style.display = displayBackup === 'none' ? null : displayBackup;
        initPasskeyButton(options, resolve, reject);
      }
    });

    observer.observe(document.head, {
      childList: true
    });
  }
}));

export {
  wwpassPasskeyAuth,
  waitForRemoval
};
