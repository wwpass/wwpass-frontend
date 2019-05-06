import { WWPASS_STATUS } from './constants';
import { havePlugin, wwpassPluginExecute, pluginWaitForRemoval } from './plugin_interface';
import { isNativeMessagingExtensionReady, wwpassNMExecute, nmWaitForRemoval } from './nm_interface';
import { wwpassNoSoftware, wwpassMessageForPlatform } from './ui';

const pluginPresent = () => (havePlugin() || isNativeMessagingExtensionReady());

const wwpassPlatformName = () => {
  const userAgent = navigator.userAgent;
  const knownPlatforms = ['Android', 'iPhone', 'iPad'];
  for (let i = 0; i < knownPlatforms.length; i += 1) {
    if (userAgent.search(new RegExp(knownPlatforms[i], 'i')) !== -1) {
      return knownPlatforms[i];
    }
  }
  return null;
};

// N.B. it call functions in REVERSE order
const chainedCall = (functions, request, resolve, reject) => {
  functions.pop()(request).then(
    resolve,
    (e) => {
      if (e.code === WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND) {
        if (functions.length > 0) {
          chainedCall(functions, request, resolve, reject);
        } else {
          wwpassNoSoftware(e.code, () => {});
          reject(e);
        }
      } else {
        reject(e);
      }
    }
  );
};

const wwpassCall = (nmFunc, pluginFunc, request) => new Promise((resolve, reject) => {
  const platformName = wwpassPlatformName();
  if (platformName !== null) {
    wwpassNoSoftware(WWPASS_STATUS.UNSUPPORTED_PLATFORM, () => {
      reject({
        code: WWPASS_STATUS.UNSUPPORTED_PLATFORM,
        message: wwpassMessageForPlatform(platformName)
      });
    });
    return;
  }

  if (havePlugin()) {
    chainedCall([nmFunc, pluginFunc], request, resolve, reject);
  } else {
    chainedCall([pluginFunc, nmFunc], request, resolve, reject);
  }
});

const wwpassAuth = request => (wwpassCall(wwpassNMExecute, wwpassPluginExecute, Object.assign({}, request, { operation: 'auth' })));

const wwpassExecute = request => (wwpassCall(wwpassNMExecute, wwpassPluginExecute, request));

const waitForRemoval = () => (wwpassCall(nmWaitForRemoval, pluginWaitForRemoval));

export {
    pluginPresent,
    wwpassAuth,
    wwpassExecute,
    waitForRemoval,
    WWPASS_STATUS
};
