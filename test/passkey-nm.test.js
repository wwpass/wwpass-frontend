import './nopluginMimeType.mock';
import {__RewireAPI__ as pkRewire, wwpassNMExecute, nmWaitForRemoval} from '../src/passkey/nm_interface';
import {wwpassExecute, waitForRemoval} from '../src/passkey/passkey';

import {__RewireAPI__ as uiRewire, wwpassNoSoftware} from '../src/passkey/ui';


beforeEach(() => {
  pkRewire.__Rewire__('EXTENSION_POLL_TIMEOUT', 10);
  pkRewire.__Rewire__('EXTENSION_POLL_ATTEMPTS', 2);
});

afterEach(() => {
  __rewire_reset_all__();
  pkRewire.__Rewire__('extensionNotInstalled', false);
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


test('wwpassAuth - noExtension', () => {
  expect.assertions(2);
  return wwpassNMExecute({
    operation: 'auth',
    ticket: 'testTicket'
  }).catch( e => {
      expect(e.code).toBe(604);
      expect(e.message).toMatch(/.*No WWPass SecurityPack.*/);
    });
});

test('wwpassAuth - NmAuth', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type == '_WWAuth_Message' && event.data.src == 'client') {
      expect(event.data.func).toBe('exec');
      expect(event.data.args[0].operation).toBe('auth');
      window.postMessage({
        type: '_WWAuth_Message',
        src: 'plugin',
        id: event.data.id,
        code: 200,
        ticketOrMessage: event.data.args[0].ticket
      }, '*');
    }
    window.removeEventListener('message', onMessageCallee);
  }, false);

  return expect(wwpassNMExecute({
    operation: 'auth',
    ticket: 'testTicket'
  })).resolves.toBe('testTicket');
});

test('wwpassAuth - NmAuth from dispatcher', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type == '_WWAuth_Message' && event.data.src == 'client') {
      expect(event.data.func).toBe('exec');
      expect(event.data.args[0].operation).toBe('auth');
      window.postMessage({
        type: '_WWAuth_Message',
        src: 'plugin',
        id: event.data.id,
        code: 200,
        ticketOrMessage: event.data.args[0].ticket
      }, '*');
    }
    window.removeEventListener('message', onMessageCallee);
  }, false);

  return expect(wwpassExecute({
    operation: 'auth',
    ticket: 'testTicket'
  })).resolves.toBe('testTicket');
});

test('wwpassAuth - NmAuthFailure', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type == '_WWAuth_Message' && event.data.src == 'client') {
      expect(event.data.func).toBe('exec');
      expect(event.data.args[0].operation).toBe('auth');
      window.postMessage({
        type: '_WWAuth_Message',
        src: 'plugin',
        id: event.data.id,
        code: 404,
        ticketOrMessage: 'FailureMessage'
      }, '*');
    }
    window.removeEventListener('message', onMessageCallee);
  }, false);

  return expect(wwpassNMExecute({
    operation: 'auth',
    ticket: 'testTicket',
  })).rejects.toEqual({code: 404, message:'FailureMessage'});
});

test('wwpassAuth - NmAuthFailure from dispatcher', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type == '_WWAuth_Message' && event.data.src == 'client') {
      expect(event.data.func).toBe('exec');
      expect(event.data.args[0].operation).toBe('auth');
      window.postMessage({
        type: '_WWAuth_Message',
        src: 'plugin',
        id: event.data.id,
        code: 404,
        ticketOrMessage: 'FailureMessage'
      }, '*');
    }
    window.removeEventListener('message', onMessageCallee);
  }, false);

  return expect(wwpassExecute({
    operation: 'auth',
    ticket: 'testTicket',
  })).rejects.toEqual({code: 404, message:'FailureMessage'});
});

test('wwpassAuth - NmAuthWaitForeRemoval', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type == '_WWAuth_Message' && event.data.src == 'client') {
      expect(event.data.func).toBe('on_key_rm');
      expect(event.data.args).toBeUndefined();
      window.postMessage({
        type: '_WWAuth_Message',
        src: 'plugin',
        id: event.data.id,
        code: 200
      }, '*');
    }
    window.removeEventListener('message', onMessageCallee);
  }, false);

  return expect(nmWaitForRemoval()).resolves.toBeUndefined();
});

test('waitForeRemoval', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type == '_WWAuth_Message' && event.data.src == 'client') {
      expect(event.data.func).toBe('on_key_rm');
      expect(event.data.args).toBeUndefined();
      window.postMessage({
        type: '_WWAuth_Message',
        src: 'plugin',
        id: event.data.id,
        code: 200
      }, '*');
    }
    window.removeEventListener('message', onMessageCallee);
  }, false);

  return expect(waitForRemoval()).resolves.toBeUndefined();
});