/**
 * @jest-environment jsdom
 */

import { setImmediate } from 'timers';
import './crypto.mock';
import 'jest-canvas-mock';

import { b64ToAb } from '../src/ab';
import WebSocketPool from '../src/mobile/wwpass.websocket';
import navigateToCallback from '../src/navigation';
import { getClientNonceIfNeeded } from '../src/nonce';

import { wwpassMobileAuth } from '../src/auth';
import { QRCodeLogin, sameDeviceLogin } from '../src/mobile/ui';

jest.mock('../src/mobile/wwpass.websocket');
jest.mock('../src/nonce', () => ({ getClientNonceIfNeeded: jest.fn() }));
jest.mock('../src/navigation', () => (jest.fn()));
getClientNonceIfNeeded.mockImplementation(() => Promise.resolve(b64ToAb('y1HeSxudpHRgbSVNIQeWhpggsejSaEFkN4E0uW1h2X4=')));

const UserAgent = {
  MOBILE: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
  DESKTOP: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.103 YaBrowser/18.7.1.924 Yowser/2.5 Safari/537.36'
};

let ticket = 'SP%20Name:scp:nonce@spfe.addr:1234';

global.fetch = jest.fn().mockImplementation(() => Promise.resolve(
  {
    ok: true,
    json: () => ({
      ticket,
      ttl: 10
    })
  }
));

beforeEach(() => {
  // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
  navigator.__defineGetter__('userAgent', () => UserAgent.DESKTOP);
  ticket = 'SP%20Name:scp:nonce@spfe.addr:1234';
  document.body.innerHTML = '<div id="qrcode"></div>';
  global.fetch.mockClear();
  jest.useFakeTimers();
});

describe('renderQRcode', () => {
  test('should create element', () => {
    QRCodeLogin(
      document.getElementById('qrcode'),
      {
        ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        callbackURL: 'https://callback.url'
      },
      10
    );
    expect(document.getElementById('qrcode').firstChild).toBeDefined();
  });

  test('should create element anchor with click listener', async () => {
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.MOBILE);
    const loginPromise = sameDeviceLogin({ qrcode: document.getElementById('qrcode') });

    const element = document.getElementById('qrcode').firstChild.firstChild;
    expect(element.tagName).toEqual('A');
    expect(element.href).toEqual('http://localhost/#');
    element.click();
    const res = await loginPromise;
    expect(res.away).toEqual(true);
    expect(res.linkElement).toBeDefined();
  });

  test('should create element anchor for switching to QR code', async () => {
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.MOBILE);
    const loginPromise = sameDeviceLogin({ qrcode: document.getElementById('qrcode') }, {
      ticket: 'SP%20Name:sp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    }, 10);

    const element = document.getElementById('qrcode').firstChild.firstChild.nextSibling;
    expect(element.tagName).toEqual('A');
    expect(element.href).toEqual('http://localhost/#');
    element.click();
    const res = await loginPromise;
    expect(res).toEqual({ qrcode: true });
  });

  test('should create element svg (desktop)', () => {
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.DESKTOP);
    QRCodeLogin(
      document.getElementById('qrcode'),
      {
        ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        callbackURL: 'https://callback.url'
      },
      10
    );

    const element = document.getElementById('qrcode').firstChild;
    expect(element.tagName).toEqual('DIV');
  });

  test('should create element anchor for switching to button', async () => {
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.MOBILE);
    const loginPromise = QRCodeLogin(
      document.getElementById('qrcode'),
      {
        ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        callbackURL: 'https://callback.url'
      },
      10,
      null,
      true
    );
    const element = document.getElementById('qrcode').firstChild.nextSibling;
    expect(element.tagName).toEqual('A');
    expect(element.href).toEqual('http://localhost/#');
    element.click();
    const res = await loginPromise;
    expect(res).toEqual({ button: true });
  });
});

describe('wwpassMobileAuth', () => {
  test('mobile detection and switching to button', async () => {
    WebSocketPool.prototype.promise = new Promise(() => {});
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode'),
      uiCallback: jest.fn(),
      uiSwitch: 'always'
    };
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.DESKTOP);
    // Do not await it. Let it run
    wwpassMobileAuth(options);
    jest.useRealTimers();
    await new Promise((r) => { setTimeout(r, 10); });
    expect(global.fetch).toHaveBeenCalledWith('https://ticket.url/', { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
    global.fetch.mockClear();
    const switchElement = document.getElementById('qrcode').firstChild.nextSibling;
    options.uiCallback.mockClear();
    switchElement.click();
    await new Promise((r) => { options.uiCallback.mockImplementation(r); });
    expect(options.uiCallback).toHaveBeenCalledWith({ button: true });
    options.uiCallback.mockClear();
    await new Promise((r) => { setTimeout(r, 10); });
    const buttonElement = document.getElementById('qrcode').firstChild.firstChild;
    expect(buttonElement.tagName).toEqual('A');
    buttonElement.addEventListener('click', (e) => { e.preventDefault(); });
    getClientNonceIfNeeded.mockImplementationOnce(() => Promise.resolve(b64ToAb('y1HeSxudpHRgbSVNIQeWhpggsejSaEFkN4E0uW1h2X4=')));
    buttonElement.click();
    await new Promise((r) => { setTimeout(r, 10); });
    expect(options.uiCallback).toHaveBeenCalledWith(
      expect.objectContaining({ away: true, linkElement: expect.anything() })
    );
    expect(global.fetch).toHaveBeenCalledWith('https://ticket.url/', { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
  });

  test('mobile detection and switching to qrcode', async () => {
    let resolve;
    WebSocketPool.prototype.promise = new Promise((r) => { resolve = r; });
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode'),
      uiCallback: jest.fn()
    };
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.MOBILE);
    // Do not awit it. Let it run
    wwpassMobileAuth(options);
    jest.useRealTimers();
    await new Promise((r) => { setTimeout(r, 10); });
    expect(global.fetch).not.toHaveBeenCalled();
    global.fetch.mockClear();
    const switchElement = document.getElementById('qrcode').firstChild.firstChild.nextSibling;
    switchElement.click();
    await new Promise((r) => { options.uiCallback.mockImplementation(r); });
    expect(options.uiCallback).toHaveBeenCalledWith({ qrcode: true });
    options.uiCallback.mockClear();
    const qrcodeElement = document.getElementById('qrcode').firstChild;
    expect(qrcodeElement.tagName).toEqual('DIV');
    await new Promise((r) => { setTimeout(r, 10); });
    expect(global.fetch).toHaveBeenCalledWith('https://ticket.url/', { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
    expect(getClientNonceIfNeeded).toHaveBeenCalledWith('SP%20Name:scp:nonce@spfe.addr:1234', 10);
    resolve({
      status: 200,
      reason: 'OK',
      clientKey: '123456',
      ticket: 'TestTicket',
      ttl: 120,
      originalTicket: 'TestTicket'
    });
    const result = await new Promise((r) => { options.uiCallback.mockImplementation(r); });
    expect(result).toEqual({
      callbackURL: 'https://callback.url/',
      ppx: 'wwp_',
      ticket: 'TestTicket',
      version: 2
    });
    expect(navigateToCallback).toHaveBeenCalledWith({
      callbackURL: 'https://callback.url/',
      ppx: 'wwp_',
      ticket: 'TestTicket',
      version: 2
    });
  });

  test('successful test with clentKey', async () => {
    WebSocketPool.prototype.promise = Promise.resolve({
      status: 200,
      reason: 'OK',
      clientKey: '123456',
      ticket: 'TestTicket',
      ttl: 120,
      originalTicket: 'TestTicket'
    });
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode'),
      once: true
    };
    const result = await wwpassMobileAuth(options);
    expect(global.fetch).toHaveBeenCalledWith('https://ticket.url/', { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
    expect(result).toEqual({
      ppx: 'wwp_',
      version: 2,
      callbackURL: 'https://callback.url/',
      ticket: 'TestTicket'
    });
  });

  test('element deletion', () => {
    WebSocketPool.prototype.promise = new Promise(() => {});
    WebSocketPool.prototype.watchTicket.mockImplementationOnce(() => {
      setImmediate(() => {
        document.getElementById('qrcode').remove();
        jest.advanceTimersByTime(150000);
      });
    });
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode')
    };
    const ret = wwpassMobileAuth(options).then((result) => {
      expect(global.fetch).toHaveBeenCalledWith('https://ticket.url/', { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
      expect(result).toEqual({
        reason: 'QRCode element is not in DOM',
        status: 500
      });
    });
    return ret;
  });

  test('Unsuccessful test', () => {
    ticket = 'SP%20Name:sp:nonce@spfe.addr:1234';
    WebSocketPool.prototype.promise = Promise.reject({
      status: 500,
      reason: 'Fail'
    });
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode')
    };
    return expect(wwpassMobileAuth(options)).resolves.toEqual(
      {
        status: 500,
        reason: 'Fail'
      }
    );
  });

  test('Successful test with timeouts', async () => {
    ticket = 'SP%20Name:sp:nonce@spfe.addr:1234';
    let resolve;
    WebSocketPool.prototype.promise = new Promise((rs) => { resolve = rs; });
    WebSocketPool.prototype.watchTicket.mockClear();
    WebSocketPool.prototype.watchTicket.mockImplementationOnce(() => {
      setImmediate(() => {
        jest.advanceTimersByTime(150000);
        WebSocketPool.prototype.watchTicket.mockImplementationOnce(() => {
          resolve({
            status: 200,
            reason: 'OK',
            clientKey: '123456',
            ticket: 'TestTicket',
            ttl: 120,
            originalTicket: 'TestTicket'
          });
        });
      });
    });
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode'),
      once: true
    };
    // eslint-disable-next-line no-underscore-dangle, no-restricted-properties
    navigator.__defineGetter__('userAgent', () => UserAgent.DESKTOP);
    global.fetch.mockClear(0);
    const result = await wwpassMobileAuth(options);
    expect(global.fetch).toHaveBeenCalledWith('https://ticket.url/', { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      ppx: 'wwp_',
      version: 2,
      callbackURL: 'https://callback.url/',
      ticket: 'TestTicket'
    });
  });
});
