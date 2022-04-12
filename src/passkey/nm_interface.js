import { WWPASS_STATUS, WWPASS_NO_AUTH_INTERFACES_FOUND_MSG } from '../constants';
import { wait } from '../util';
import { wwpassShowError } from './ui';
import { noSecurityPack } from './ui_elements';
import WWPassError from '../error';

const EXTENSION_POLL_TIMEOUT = 200;
const EXTENSION_POLL_ATTEMPTS = 15;

let extensionNotInstalled = false;

const isNativeMessagingExtensionReady = () => ((document.querySelector('meta[property="wwpass:extension:version"]')
  || document.getElementById('_WWAuth_Chrome_Installed_')) !== null);

const getNMresult = (id) => new Promise((reslove) => {
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'plugin' && event.data.id === id) {
      window.removeEventListener('message', onMessageCallee, false);
      reslove(event.data);
    }
  }, false);
});

const waitForExtension = async (timeout, attempts) => {
  let attemptsRemaining = attempts;
  while (!isNativeMessagingExtensionReady()) {
    if (attemptsRemaining <= 0) {
      return false;
    }
    // eslint-disable-next-line no-await-in-loop
    await wait(timeout);
    attemptsRemaining -= 1;
  }
  return true;
};

const randomID = () => (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1); // eslint-disable-line no-bitwise,max-len

const wwpassNMCall = async (func, args, log = () => {}) => {
  if (extensionNotInstalled) {
    log('%s: chrome native messaging extension is not installed', 'wwpassNMExecute');
    throw new WWPassError(
      WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
      WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
    );
  }
  if (!await waitForExtension(EXTENSION_POLL_TIMEOUT, EXTENSION_POLL_ATTEMPTS)) {
    extensionNotInstalled = true;
    log('%s: chrome native messaging extension is not installed', 'wwpassNMExecute');
    throw new WWPassError(
      WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
      WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
    );
  }
  const id = randomID();
  window.postMessage({
    type: '_WWAuth_Message',
    src: 'client',
    id,
    func,
    args: args ? JSON.parse(JSON.stringify(args)) : args
  }, '*');
  const result = await getNMresult(id);
  if (result.code !== WWPASS_STATUS.OK) {
    if (result.code === WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND) {
      await wwpassShowError(noSecurityPack, 'WWPass Error');
    }
    throw new WWPassError(
      result.code,
      result.ticketOrMessage
    );
  }
  return result.ticketOrMessage;
};

const wwpassNMExecute = (inputRequest) => {
  const defaultOptions = {
    log: () => {}
  };
  const request = { ...defaultOptions, ...inputRequest };
  const { log } = request;
  delete request.log;
  log('%s: called', 'wwpassNMExecute');
  request.uri = { domain: window.location.hostname, protocol: window.location.protocol };
  return wwpassNMCall('exec', [request], log);
};

const nmWaitForRemoval = (log = () => {}) => wwpassNMCall('on_key_rm', undefined, log);

export {
  wwpassNMExecute,
  nmWaitForRemoval,
  isNativeMessagingExtensionReady
};
