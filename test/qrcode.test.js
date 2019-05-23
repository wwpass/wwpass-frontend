import './crypto.mock';
import {TextEncoder} from 'text-encoding';
global.TextEncoder = TextEncoder;
import { getWebSocketResult } from '../src/qrcode/wwpass.websocket';
jest.mock('../src/qrcode/wwpass.websocket',()=>({
  getWebSocketResult: jest.fn()
}));

jest.mock('../src/navigation',()=>( jest.fn()
));


import { wwpassQRCodeAuth } from '../src/qrcode/auth';
import { QRCodePromise } from '../src/qrcode/ui';
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
    QRCodePromise(document.getElementById('qrcode'),
    {
      ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    },10);
    expect(document.getElementById('qrcode').firstChild).toBeDefined();
  });
  test('should create element anchor with correct URL', () => {
    navigator.__defineGetter__('userAgent', () => UserAgent.MOBILE);
    QRCodePromise(document.getElementById('qrcode'), {
      ticket: 'SP%20Name:sp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    },10);

    const element = document.getElementById('qrcode').firstChild;
    expect(element.tagName).toEqual('A');
    expect(element.href).toEqual('wwpass://auth?v=2&t=SP%2520Name%3Asp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&c=https%3A%2F%2Fcallback.url');
    expect(element.firstChild.tagName).toEqual('CANVAS');
  });
  test('should create element canvas (desktop)', () => {
    navigator.__defineGetter__('userAgent', () => UserAgent.DESKTOP);
    QRCodePromise(document.getElementById('qrcode'),
    {
      ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
      callbackURL: 'https://callback.url'
    },10);

    const element = document.getElementById('qrcode').firstChild;
    expect(element.tagName).toEqual('CANVAS');
  });
});

describe('wwpassQRcodeAuth', () => {
  test('successful test with clentKey',() => {
    getWebSocketResult.mockImplementation(() => Promise.resolve({
      ppx: 'wwp_',
      version: 2,
      status: 200,
      reason: 'OK',
      callbackURL: 'https://callback.url',
      clientKey: '123456'
    }));
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode')
    };
    return wwpassQRCodeAuth(options).then((result) => {
      expect(global.fetch).toBeCalledWith('https://ticket.url/', {"cache": "no-store", "headers": {"cache-control": "no-cache", "pragma": "no-cache"}});
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        status: 200,
        reason: 'OK',
        callbackURL: 'https://callback.url',
        clientKey: '123456'
      });
    });
  });

  test('Unsuccessful test with clentKey',() => {
    getWebSocketResult.mockImplementation(() => Promise.reject({
      ppx: 'wwp_',
      version: 2,
      status: 500,
      reason: 'Fail',
      callbackURL: 'https://callback.url',
    }));
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode')
    };
    expect.assertions(2);
    return wwpassQRCodeAuth(options).catch((result) => {
      expect(global.fetch).toBeCalledWith('https://ticket.url/', {"cache": "no-store", "headers": {"cache-control": "no-cache", "pragma": "no-cache"}});
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        status: 500,
        reason: 'Fail',
        callbackURL: 'https://callback.url',
      });
    });
  });

  test('Unsuccessful test without clentKey',() => {
    ticket = 'SP%20Name:sp:nonce@spfe.addr:1234';
    getWebSocketResult.mockImplementation(() => Promise.reject({
      ppx: 'wwp_',
      version: 2,
      status: 500,
      reason: 'Fail',
      callbackURL: 'https://callback.url',
    }));
    const options = {
      universal: false,
      ticketURL: 'https://ticket.url/',
      callbackURL: 'https://callback.url/',
      version: 2,
      ppx: 'wwp_',
      spfewsAddress: 'wss://spfews.wwpass.com',
      qrcode: document.getElementById('qrcode')
    };
    expect.assertions(2);
    return wwpassQRCodeAuth(options).then(jest.fa).catch((result) => {
      expect(global.fetch).toBeCalledWith('https://ticket.url/', {"cache": "no-store", "headers": {"cache-control": "no-cache", "pragma": "no-cache"}});
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        status: 500,
        reason: 'Fail',
        callbackURL: 'https://callback.url',
      });
    });
  });

  test('Successful test with timeouts',() => {

    ticket = 'SP%20Name:sp:nonce@spfe.addr:1234';
    getWebSocketResult.mockImplementation(() => {
      getWebSocketResult.mockImplementation(() =>
        Promise.resolve({
          ppx: 'wwp_',
          version: 2,
          status: 200,
          reason: 'OK',
          callbackURL: 'https://callback.url',
        }));
        jest.advanceTimersByTime(15000);
        return new Promise(()=>{});
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

    global.fetch.mockClear(0);
    return wwpassQRCodeAuth(options).then((result) => {
      expect(global.fetch).toBeCalledWith('https://ticket.url/', {"cache": "no-store", "headers": {"cache-control": "no-cache", "pragma": "no-cache"}});
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        status: 200,
        reason: 'OK',
        callbackURL: 'https://callback.url',
      });
    });
  });

});
