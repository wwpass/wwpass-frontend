import { WWPASS_STATUS, WWPASS_NO_AUTH_INTERFACES_FOUND_MSG, WWPASS_KEY_TYPE_DEFAULT } from './constants';
import { wwpassShowError } from './ui';

const PLUGIN_OBJECT_ID = '_wwpass_plugin';
const PLUGIN_MIME_TYPE = 'application/x-wwauth';
const PLUGIN_TIMEOUT = 10000;
const REDUCED_PLUGIN_TIMEOUT = 1000;
const PLUGIN_AUTH_KEYTYPE_REVISION = 9701;
const PluginInfo = {};

let savedPluginInstance;
const pendingReqests = [];

const havePlugin = () => (navigator.mimeTypes[PLUGIN_MIME_TYPE] !== undefined);

const wwpassPluginShowsErrors = (pluginVersionString) => {
  if (typeof (pluginVersionString) === 'string') {
    const pluginVersion = pluginVersionString.split('.');
    for (let i = 0; i < pluginVersion.length; i += 1) {
      pluginVersion[i] = parseInt(pluginVersion[i], 10);
    }
    if (pluginVersion.length === 3) {
      if (
        (pluginVersion[0] > 2)
        || (pluginVersion[0] === 2 && pluginVersion[1] > 4)
        || (pluginVersion[0] === 2 && pluginVersion[1] === 4 && pluginVersion[2] >= 1305)
      ) {
        return true;
      }
    }
  }
  return false;
};

const getPluginInstance = (log) => new Promise((resolve, reject) => {
  if (savedPluginInstance) {
    if (window._wwpass_plugin_loaded !== undefined) { // eslint-disable-line no-underscore-dangle
      pendingReqests.push([resolve, reject]);
    } else {
      log('%s: plugin is already initialized', 'getPluginInstance');
      resolve(savedPluginInstance);
    }
  } else {
    const junkBrowser = (navigator.mimeTypes.length === 0);
    const pluginInstalled = havePlugin();
    const timeout = (junkBrowser) ? REDUCED_PLUGIN_TIMEOUT : PLUGIN_TIMEOUT;
    if (pluginInstalled || junkBrowser) {
      log('%s: trying to create plugin instance(junkBrowser=%s, timeout=%d)', 'getPluginInstance', junkBrowser, timeout);
      const pluginHtml = `<object id='${PLUGIN_OBJECT_ID}' width=0 height=0 type='${PLUGIN_MIME_TYPE}'><param name='onload' value='_wwpass_plugin_loaded'/></object>`;
      const pluginDiv = document.createElement('div');
      pluginDiv.setAttribute('style', 'position: fixed; left: 0; top:0; width: 1px; height: 1px; z-index: -1; opacity: 0.01');
      document.body.appendChild(pluginDiv);
      pluginDiv.innerHTML += pluginHtml;
      savedPluginInstance = document.getElementById(PLUGIN_OBJECT_ID);
      const timer = setTimeout(() => {
        delete window._wwpass_plugin_loaded; // eslint-disable-line no-underscore-dangle
        savedPluginInstance = null;
        log('%s: WWPass plugin loading timeout', 'getPluginInstance');
        reject({
          code: WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
          message: WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
        });
        for (let i = 0; i < pendingReqests.length; i += 1) {
          const pendingReject = pendingReqests[i][1];
          pendingReject({
            code: WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
            message: WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
          });
        }
      }, PLUGIN_TIMEOUT);
      window._wwpass_plugin_loaded = () => { // eslint-disable-line no-underscore-dangle
        log('%s: plugin loaded', 'getPluginInstance');
        delete window._wwpass_plugin_loaded; // eslint-disable-line no-underscore-dangle
        clearTimeout(timer);
        try {
          PluginInfo.versionString = savedPluginInstance.version;
          PluginInfo.revision = parseInt(savedPluginInstance.version.split('.')[2], 10);
          PluginInfo.showsErrors = wwpassPluginShowsErrors(PluginInfo.versionString);
        } catch (err) {
          log('%s: error parsing plugin version: %s', 'getPluginInstance', err);
        }
        resolve(savedPluginInstance);
        for (let i = 0; i < pendingReqests.length; i += 1) {
          const pendingResolve = pendingReqests[i][0];
          pendingResolve(savedPluginInstance);
        }
      };
    } else {
      log('%s: no suitable plugins installed', 'getPluginInstance');
      reject({
        code: WWPASS_STATUS.NO_AUTH_INTERFACES_FOUND,
        message: WWPASS_NO_AUTH_INTERFACES_FOUND_MSG
      });
    }
  }
});

const wrapCallback = (callback) => {
  if (!PluginInfo.showsErrors) {
    return (code, ticketOrMessage) => {
      if (code !== WWPASS_STATUS.OK && code !== WWPASS_STATUS.USER_REJECT) {
        const message = `<p><b>A error has occured:</b> ${ticketOrMessage}</p>`
                + `<p><a href="https://support.wwpass.com/?topic=${code}">Learn more</a></p>`;
        wwpassShowError(message, 'WWPass Error',
          () => {
            callback(code, ticketOrMessage);
          });
      } else {
        callback(code, ticketOrMessage);
      }
    };
  }
  return callback;
};

const wwpassPluginExecute = (inputRequest) => new Promise((resolve, reject) => {
  const defaultOptions = {
    log: () => {}
  };
  const request = { ...defaultOptions, ...inputRequest };
  request.log('%s: called, operation name is "%s"', 'wwpassPluginExecute', request.operation || null);
  getPluginInstance(request.log).then((plugin) => {
    const wrappedCallback = wrapCallback((code, ticketOrMessage) => {
      if (code === WWPASS_STATUS.OK) {
        resolve(ticketOrMessage);
      } else {
        reject({ code, message: ticketOrMessage });
      }
    });
    if (plugin.execute !== undefined) {
      request.callback = wrappedCallback;
      plugin.execute(request);
    } else if (request.operation === 'auth') {
      if (PluginInfo.revision < PLUGIN_AUTH_KEYTYPE_REVISION) {
        plugin.authenticate(request.ticket, wrappedCallback);
      } else {
        plugin.authenticate(request.ticket, wrappedCallback,
          request.firstKeyType || WWPASS_KEY_TYPE_DEFAULT);
      }
    } else {
      plugin.do_operation(request.operation, wrappedCallback);
    }
  }).catch(reject);
});

const pluginWaitForRemoval = (log = () => {}) => new Promise((resolve, reject) => {
  getPluginInstance(log).then((plugin) => {
    plugin.on_key_removed(resolve);
  }).catch(reject);
});

export {
  wwpassPluginExecute,
  pluginWaitForRemoval,
  havePlugin
};
