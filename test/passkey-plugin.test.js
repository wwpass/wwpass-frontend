import './pluginMimeType.mock';

import {__RewireAPI__ as pkRewire, wwpassPluginExecute, pluginWaitForRemoval} from '../src/passkey/plugin_interface';
import {__RewireAPI__ as uiRewire, wwpassNoSoftware} from '../src/passkey/ui';
import {wwpassExecute, waitForRemoval} from '../src/passkey/passkey';

const PLUGIN_OBJECT_ID = pkRewire.__get__('PLUGIN_OBJECT_ID');

beforeEach(() => {
  pkRewire.__Rewire__('PLUGIN_TIMEOUT', 10);
});

afterEach(() => {
  try {
    document.getElementById(PLUGIN_OBJECT_ID).remove();
  } catch (e) {
  }
  __rewire_reset_all__();
  pkRewire.__Rewire__('savedPluginInstance', undefined);
});

test('wwpassNoSoftware', () => {
  let showError = jest.fn();
  uiRewire.__Rewire__('wwpassShowError', showError);
  wwpassNoSoftware(604);
  expect(showError).toBeCalledWith(expect.any(String),'WWPass &mdash; No Software Found',undefined);
  showError = jest.fn();
  uiRewire.__Rewire__('wwpassShowError', showError);
  wwpassNoSoftware(606);
  expect(showError).toBeCalledWith(expect.any(String),'WWPass &mdash; Unsupported Platform',undefined);
});

test('wwpassAuth - noPlugin', () => {
  expect.assertions(2);
  return wwpassPluginExecute({
    operation: 'auth',
    ticket: 'testTicket'
  }).catch( e => {
    expect(e.code).toBe(604);
    expect(e.message).toMatch(/No WWPass SecurityPack/);
  });
});

test('wwpassAuth - noPlugin from dispatcher', () => {
  expect.assertions(2);
  return wwpassExecute({
    operation: 'auth',
    ticket: 'testTicket'
  }).catch( e => {
    expect(e.code).toBe(604);
    expect(e.message).toMatch(/No WWPass SecurityPack/);
  });
});

test('wwpassAuth - PluginAuth', () => {
  let r = wwpassPluginExecute({
    operation: 'auth',
    ticket: 'testTicket'
  });
  pkRewire.__Rewire__('savedPluginInstance', {
    version: "3.4.9701",
    authenticate: (ticket, callback, keytype) => {
      expect(ticket).toBe('testTicket');
      expect(keytype).toBe('passkey');
      setImmediate(callback,200,ticket);
    }
  });
  window._wwpass_plugin_loaded();
  return expect(r).resolves.toBe('testTicket');
});

test('wwpassAuth - PluginAuth from dispatcher', () => {
  let r = wwpassExecute({
    operation: 'auth',
    ticket: 'testTicket'
  });
  pkRewire.__Rewire__('savedPluginInstance', {
    version: "3.4.9701",
    authenticate: (ticket, callback, keytype) => {
      expect(ticket).toBe('testTicket');
      expect(keytype).toBe('passkey');
      setImmediate(callback,200,ticket);
    }
  });
  window._wwpass_plugin_loaded();
  return expect(r).resolves.toBe('testTicket');
});

test('wwpassAuth - PluginExecuteFailure', () => {
  let r = wwpassPluginExecute({
    operation: 'auth',
    ticket: 'testTicket'
  });
  pkRewire.__Rewire__('savedPluginInstance', {
    version: "3.4.9701",
    execute: (request) => {
      expect(request.ticket).toBe('testTicket');
      setImmediate(request.callback,404,'FailureMessage');
    }
  });
  window._wwpass_plugin_loaded();
  return expect(r).rejects.toEqual({code: 404, message:'FailureMessage'});
});

test('wwpassAuth - PluginExecuteFailure from dispatxcher', () => {
  let r = wwpassExecute({
    operation: 'auth',
    ticket: 'testTicket'
  });
  pkRewire.__Rewire__('savedPluginInstance', {
    version: "3.4.9701",
    execute: (request) => {
      expect(request.ticket).toBe('testTicket');
      setImmediate(request.callback,404,'FailureMessage');
    }
  });
  window._wwpass_plugin_loaded();
  return expect(r).rejects.toEqual({code: 404, message:'FailureMessage'});
});

test('wwpassAuth - PluginWaitForRemoval', () => {
  let r = pluginWaitForRemoval();
  pkRewire.__Rewire__('savedPluginInstance', {
    version: "3.4.9701",
    on_key_removed: (callback) => {setImmediate(callback);}
  });
  window._wwpass_plugin_loaded();
  return expect(r).resolves.toBeUndefined();
});

test('wwpassAuth - PluginWaitForRemoval from dispatcher', () => {
  let r = waitForRemoval();
  pkRewire.__Rewire__('savedPluginInstance', {
    version: "3.4.9701",
    on_key_removed: (callback) => {setImmediate(callback);}
  });
  window._wwpass_plugin_loaded();
  return expect(r).resolves.toBeUndefined();
});
