/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import './nopluginMimeType.mock';
import { __RewireAPI__ as pkRewire, wwpassNMExecute, nmWaitForRemoval } from '../src/passkey/nm_interface';

import { __RewireAPI__ as uiRewire, wwpassNoSoftware } from '../src/passkey/ui';


beforeEach(() => {
  pkRewire.__Rewire__('EXTENSION_POLL_TIMEOUT', 10);
  pkRewire.__Rewire__('EXTENSION_POLL_ATTEMPTS', 2);
});

afterEach(() => {
  // eslint-disable-next-line no-undef
  __rewire_reset_all__();
  pkRewire.__Rewire__('extensionNotInstalled', false);
});

test('wwpassNoSoftware', () => {
  let showError = jest.fn();
  uiRewire.__Rewire__('wwpassShowError', showError);
  wwpassNoSoftware(604);
  expect(showError).toBeCalledWith(expect.any(String), 'WWPass &mdash; No Software Found');
  showError = jest.fn();
  uiRewire.__Rewire__('wwpassShowError', showError);
  wwpassNoSoftware(606);
  expect(showError).toBeCalledWith(expect.any(String), 'WWPass &mdash; Unsupported Platform');
});


test('wwpassAuth - noExtension', () => {
  expect.assertions(1);
  return expect(wwpassNMExecute({
    operation: 'auth',
    ticket: 'testTicket'
  })).rejects.toMatchObject({ code: 604, message: /.*No WWPass SecurityPack.*/ });
});

test('wwpassAuth - NmAuth', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'client') {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(event.data.func).toBe('exec');
      // eslint-disable-next-line jest/no-conditional-expect
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
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'client') {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(event.data.func).toBe('exec');
      // eslint-disable-next-line jest/no-conditional-expect
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

test('wwpassAuth - NmAuthFailure', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'client') {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(event.data.func).toBe('exec');
      // eslint-disable-next-line jest/no-conditional-expect
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
    ticket: 'testTicket'
  })).rejects.toMatchObject({ code: 404, message: 'FailureMessage' });
});

test('wwpassAuth - NmAuthFailure from dispatcher', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'client') {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(event.data.func).toBe('exec');
      // eslint-disable-next-line jest/no-conditional-expect
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
    ticket: 'testTicket'
  })).rejects.toMatchObject({ code: 404, message: 'FailureMessage' });
});

test('wwpassAuth - NmAuthWaitForeRemoval', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'client') {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(event.data.func).toBe('on_key_rm');
      // eslint-disable-next-line jest/no-conditional-expect
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

test('waitForRemoval', () => {
  document.querySelector('head').innerHTML += '<meta property="wwpass:extension:version" content="1.0.8" />';
  window.addEventListener('message', function onMessageCallee(event) {
    if (event.data.type === '_WWAuth_Message' && event.data.src === 'client') {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(event.data.func).toBe('on_key_rm');
      // eslint-disable-next-line jest/no-conditional-expect
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
