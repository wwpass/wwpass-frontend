import WWPassError from '../error';
import { WWPASS_STATUS } from '../constants';
import { isNativeMessagingExtensionReady, wwpassNMExecute, nmWaitForRemoval } from './nm_interface';
import { wwpassNoSoftware, wwpassMessageForPlatform } from './ui';

const pluginPresent = isNativeMessagingExtensionReady;

const wwpassPlatformName = () => {
  const { userAgent } = navigator;
  const knownPlatforms = ['Android', 'iPhone', 'iPad'];
  for (let i = 0; i < knownPlatforms.length; i += 1) {
    if (userAgent.search(new RegExp(knownPlatforms[i], 'i')) !== -1) {
      return knownPlatforms[i];
    }
  }
  return null;
};

const wwpassCall = async (nmFunc, request) => {
  const platformName = wwpassPlatformName();
  if (platformName !== null) {
    await wwpassNoSoftware(WWPASS_STATUS.UNSUPPORTED_PLATFORM);
    throw new WWPassError(
      WWPASS_STATUS.UNSUPPORTED_PLATFORM,
      wwpassMessageForPlatform(platformName)
    );
  }
  try {
    const result = await nmFunc(request);
    return result;
  } catch (err) {
    if (err instanceof WWPassError && err.code === WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND) {
      await wwpassNoSoftware(err.code);
    }
    throw err;
  }
};

const wwpassAuth = async (request) => wwpassCall(wwpassNMExecute, { ...request, operation: 'auth' });

const wwpassExecute = async (request) => wwpassCall(wwpassNMExecute, request);

const waitForRemoval = async () => wwpassCall(nmWaitForRemoval);

export {
  pluginPresent,
  wwpassAuth,
  wwpassExecute,
  waitForRemoval,
  WWPASS_STATUS
};
