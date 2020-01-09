import { WWPASS_STATUS, WWPASS_NO_AUTH_INTERFACES_FOUND_MSG } from './constants';
import { wwpassShowError } from './ui';

const EXTENSION_POLL_TIMEOUT = 200;
const EXTENSION_POLL_ATTEMPTS = 15;

let extensionNotInstalled = false;

const timedPoll = (args) => {
  let { condition } = args;
  if (typeof (condition) === 'function') {
    condition = condition();
  }
  if (condition) {
    args.onCondition();
  } else {
    let attempts = args.attempts || 0;
    if (attempts--) { // eslint-disable-line no-plusplus
      const timeout = args.timeout || 100;
      setTimeout(((p => (() => { timedPoll(p); }))(
        {
          timeout,
          attempts,
          condition: args.condition,
          onCondition: args.onCondition,
          onTimeout: args.onTimeout
        })), timeout);
    } else {
      args.onTimeout();
    }
  }
};

const isNativeMessagingExtensionReady = () => ((document.querySelector('meta[property="wwpass:extension:version"]')
  || document.getElementById('_WWAuth_Chrome_Installed_')) !== null);

const randomID = () => (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1); // eslint-disable-line no-bitwise,max-len

const wwpassNMCall = (func, args, log = () => {}) =>
  new Promise((resolve, reject) => {
    if (extensionNotInstalled) {
      log('%s: chrome native messaging extension is not installed', 'wwpassNMExecute');
      reject({
        code: WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
        message: WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
      });
      return;
    }
    timedPoll({
      timeout: EXTENSION_POLL_TIMEOUT,
      attempts: EXTENSION_POLL_ATTEMPTS,
      condition: isNativeMessagingExtensionReady,
      onCondition() {
        const id = randomID();
        window.postMessage({
          type: '_WWAuth_Message',
          src: 'client',
          id,
          func,
          args: args ? JSON.parse(JSON.stringify(args)) : args
        }, '*');
        window.addEventListener('message', function onMessageCallee(event) {
          if (event.data.type === '_WWAuth_Message' && event.data.src === 'plugin' && event.data.id === id) {
            window.removeEventListener('message', onMessageCallee, false);
            if (event.data.code === WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND) {
              const message = '<p>No Security Pack is found on your computer or WWPass&nbsp;native&nbsp;host is not responding.</p><p>To install Security Pack visit <a href="https://ks.wwpass.com/download/">Key Services</a> </p><p><a href="https://support.wwpass.com/?topic=604">Learn more...</a></p>';
              wwpassShowError(message, 'WWPass Error',
                () => {
                  reject({
                    code: event.data.code,
                    message: event.data.ticketOrMessage
                  });
                });
            } else if (event.data.code === WWPASS_STATUS.OK) {
              resolve(event.data.ticketOrMessage);
            } else {
              reject({
                code: event.data.code,
                message: event.data.ticketOrMessage
              });
            }
          }
        }, false);
      },
      onTimeout: () => {
        extensionNotInstalled = true;
        log('%s: chrome native messaging extension is not installed', 'wwpassNMExecute');
        reject({
          code: WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
          message: WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
        });
      }
    });
  });

const wwpassNMExecute = (inputRequest) => {
  const defaultOptions = {
    log: () => {}
  };
  const request = Object.assign({}, defaultOptions, inputRequest);
  const { log } = request;
  delete request.log;
  log('%s: called', 'wwpassNMExecute');
  request.uri = { domain: window.location.hostname, protocol: window.location.protocol };
  return wwpassNMCall('exec', [request], log);
};

const nmWaitForRemoval = (log = () => {}) => wwpassNMCall('on_key_rm', undefined, log);

export { wwpassNMExecute, nmWaitForRemoval, isNativeMessagingExtensionReady };
