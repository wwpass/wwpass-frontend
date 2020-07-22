import './crypto.mock';
import 'jest-canvas-mock';
import {TextEncoder} from 'text-encoding';
global.TextEncoder = TextEncoder;

import WebSocketPool from '../src/qrcode/wwpass.websocket';
jest.mock('../src/qrcode/wwpass.websocket');
jest.mock('../src/navigation',()=>( jest.fn()));



import { wwpassMobileAuth } from '../src/qrcode/auth';
import { QRCodeLogin, sameDeviceLogin } from '../src/qrcode/ui';
import { b64ToAb } from '../src/ab';


const UserAgent = {
  'MOBILE': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
  'DESKTOP': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.103 YaBrowser/18.7.1.924 Yowser/2.5 Safari/537.36'
};

let ticket = 'SP%20Name:scp:nonce@spfe.addr:1234';

global.fetch = jest.fn().mockImplementation(() => Promise.resolve(
  {
    ok: true,
    json: () => ({
      ticket: ticket,
      ttl: 10
    })
  }
));

beforeEach(() => {
  ticket = 'SP%20Name:scp:nonce@spfe.addr:1234';
  document.body.innerHTML = '<div id="qrcode"></div>';
  global.document = document;
  global.fetch.mockClear();
});

jest.useFakeTimers();

// todo chack for event listeners (click on QR code)

const initialOptions = Object.freeze({
  ticket: 'SP%20Name:sp:nonce@spfe.addr:1234',
  callbackURL: 'https://callback.url',
  fn: () => {}
});

const clientNonce = b64ToAb('iyJFFNoEh9PUeXqV+TwQ14+eT/zGkswdGx2WNhTxNkk=');

describe('renderQRcode', () => {
  test('should create element', () => {
    QRCodeLogin(document.getElementById('qrcode'),
    {
      ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    },10);
    expect(document.getElementById('qrcode').firstChild).toBeDefined();
  });

  test('should create element anchor with correct URL', () => {
    navigator.__defineGetter__('userAgent', () => UserAgent.MOBILE);
    const loginPromise = sameDeviceLogin(document.getElementById('qrcode'), {
      ticket: 'SP%20Name:sp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    },10);

    const element = document.getElementById('qrcode').firstChild;
    expect(element.tagName).toEqual('A');
    expect(element.href).toEqual('');
    element.click();
    return loginPromise.then((res) => {
      expect(res).toEqual({away: true});
    });
  });

  test('should create element canvas (desktop)', () => {
    navigator.__defineGetter__('userAgent', () => UserAgent.DESKTOP);
    QRCodeLogin(document.getElementById('qrcode'),
    {
      ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    },10);

    const element = document.getElementById('qrcode').firstChild;
    expect(element.tagName).toEqual('CANVAS');
  });
});

describe('wwpassMobileAuth', () => {
  test('successful test with clentKey',async () => {
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
      once: true,
    };
    const result = await wwpassMobileAuth(options);
    expect(global.fetch).toBeCalledWith('https://ticket.url/', { "cache": "no-store", "headers": { "cache-control": "no-cache", "pragma": "no-cache" } });
    expect(result).toEqual({
      ppx: 'wwp_',
      version: 2,
      callbackURL: 'https://callback.url/',
      ticket: "TestTicket"
    });
  });

  test('test element deletion',() => {
    WebSocketPool.prototype.promise = new Promise(()=>{});
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
      qrcode: document.getElementById('qrcode'),
    };
    const ret = wwpassMobileAuth(options).then((result) => {
      expect(global.fetch).toBeCalledWith('https://ticket.url/', {"cache": "no-store", "headers": {"cache-control": "no-cache", "pragma": "no-cache"}});
      expect(result).toEqual({
        reason: 'QRCode element is not in DOM',
        status: 500,
      });
    });
    return ret;
  });

  test('Unsuccessful test',() => {
    ticket = 'SP%20Name:sp:nonce@spfe.addr:1234';
    WebSocketPool.prototype.promise = Promise.reject({
      status: 500,
      reason: 'Fail',
    });
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode'),
    };
    return expect(wwpassMobileAuth(options)).resolves.toEqual(
      {
        status: 500,
        reason: 'Fail',
      }
    );
  });

  test('Successful test with timeouts',() => {
    ticket = 'SP%20Name:sp:nonce@spfe.addr:1234';
    let resolve;
    WebSocketPool.prototype.promise = new Promise((rs)=>{resolve = rs;});
    WebSocketPool.prototype.watchTicket.mockClear();
    WebSocketPool.prototype.watchTicket.mockImplementationOnce((t) => {
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
      once: true,
    };

    global.fetch.mockClear(0);
    return wwpassMobileAuth(options).then((result) => {
      expect(global.fetch).toBeCalledWith('https://ticket.url/', {"cache": "no-store", "headers": {"cache-control": "no-cache", "pragma": "no-cache"}});
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        callbackURL: 'https://callback.url/',
        ticket: "TestTicket"
      });
    });
  });

});
