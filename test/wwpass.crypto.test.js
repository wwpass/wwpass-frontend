import './crypto.mock';

import { testBuffer, testString } from './test_data';
import { getClientNonce } from '../src/nonce';
import { WWPassCrypto, WWPassCryptoPromise } from '../src/wwpass.crypto';

jest.mock('../src/nonce', () => ({ getClientNonce: jest.fn() }));
jest.mock('../src/mobile/wwpass.websocket', () => jest.fn().mockImplementation(() => {
  const th = {
    watchTicket: (t) => {
      th.promise = (t === 'mockTicket' ? Promise.resolve({
        clientKey: 'lbUqjnufubYo3pxhLhPGLWeg775T6oLbVE3ZHIxSME8pV5dtDvjF6nW3a8Kl+HV+'
      }) : Promise.reject({
        status: 421,
        reason: 'Invalid ticket'
      }));
    }
  };
  return th;
}));

getClientNonce.mockImplementation(
  () => Promise.resolve(
    new Uint8Array([
      48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102,
      48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102
    ]).buffer
  )
);

const equalAb = (a1, a2) => {
  const a81 = new Uint8Array(a1);
  const a82 = new Uint8Array(a2);
  if (a81.length !== a82.length) {
    return false;
  }
  for (let i = 0; i < a81.length; i += 1) {
    if (a81[i] !== a82[i]) {
      return false;
    }
  }
  return true;
};

describe('WWPassCryptoPromise', () => {
  // eslint-disable-next-line jest/expect-expect
  test('Create WWPassCryptoPromise', () => WWPassCryptoPromise.getWWPassCrypto('mockTicket'));

  test('Encrypt/decrypt string', () => WWPassCryptoPromise.getWWPassCrypto('mockTicket').then(
    (crypto) => crypto.encryptString(testString)
    .then((encrypedString) => crypto.decryptString(encrypedString))
    .then(
      (decryptedString) => expect(decryptedString).toEqual(testString)
    )
  ));

  test('Encrypt/decrypt arrayBuffer', () => WWPassCryptoPromise.getWWPassCrypto('mockTicket').then(
    (crypto) => crypto.encryptArrayBuffer(testBuffer)
    .then((encrypedBuffer) => crypto.decryptArrayBuffer(encrypedBuffer))
    .then(
      (decryptedBuffer) => expect(equalAb(testBuffer, decryptedBuffer)).toBeTruthy()
    )
  ));

  test('Invalid ticket', () => WWPassCryptoPromise.getWWPassCrypto('invalidTicket').then(() => { expect(true).toBe(false); }, (error) => {
    expect(error.message).toEqual('Invalid ticket');
    expect(error).toBeInstanceOf(Error);
  }));
});

describe('WWPassCryptoPromise with AES-CBC', () => {
  // eslint-disable-next-line jest/expect-expect
  test('Create WWPassCryptoPromise', () => WWPassCryptoPromise.getWWPassCrypto('mockTicket', 'AES-CBC'));

  test('Encrypt/decrypt string', () => WWPassCryptoPromise.getWWPassCrypto('mockTicket', 'AES-CBC').then(
    (crypto) => crypto.encryptString(testString)
    .then((encrypedString) => crypto.decryptString(encrypedString))
    .then(
      (decryptedString) => expect(decryptedString).toEqual(testString)
    )
  ));

  test('Encrypt/decrypt arrayBuffer', () => WWPassCryptoPromise.getWWPassCrypto('mockTicket', 'AES-CBC').then(
    (crypto) => crypto.encryptArrayBuffer(testBuffer)
    .then((encrypedBuffer) => crypto.decryptArrayBuffer(encrypedBuffer))
    .then(
      (decryptedBuffer) => expect(equalAb(testBuffer, decryptedBuffer)).toBeTruthy()
    )
  ));
});

describe('WWPassCrypto', () => {
  beforeEach(() => { window.console.error = null; });

  // eslint-disable-next-line jest/expect-expect
  test('Create WWPassCrypto', () => (new WWPassCrypto('mockTicket')).cryptoPromise);

  test('Encrypt/decrypt string', () => {
    const crypto = new WWPassCrypto('mockTicket');
    return crypto.encryptString(testString)
    .then((encrypedString) => crypto.decryptString(encrypedString))
    .then(
      (decryptedString) => expect(decryptedString).toEqual(testString)
    );
  });

  test('Encrypt/decrypt arrayBuffer', () => {
    const crypto = new WWPassCrypto('mockTicket');
    return crypto.encryptArrayBuffer(testBuffer)
    .then((encrypedBuffer) => crypto.decryptArrayBuffer(encrypedBuffer))
    .then(
      (decryptedBuffer) => expect(equalAb(testBuffer, decryptedBuffer)).toBeTruthy()
    );
  });
});
