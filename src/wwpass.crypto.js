import WebSocketPool from './mobile/wwpass.websocket';
import {
  ab2str, str2ab, abToB64, b64ToAb
} from './ab';
import {
  encrypt, decrypt, importKey, getRandomData
} from './crypto';
import { concatBuffers } from './util';
import { getClientNonce } from './nonce';

const clientKeyIV = new Uint8Array(
  [176, 178, 97, 142, 156, 31, 45, 30,
    81, 210, 85, 14, 202, 203, 86, 240]
);

class WWPassCryptoPromise {
  /* Return Promise that will be resloved to actual crypto object
  with encrypt/decrypt String/ArrayBuffer methods and cleintKey member.
  Ticket must be authenticated with 'c' auth factor.
  Only supported values for algorithm are 'AES-GCM' and 'AES-CBC'.
  */
  static getWWPassCrypto(ticket, algorithmName = 'AES-GCM') {
    let encryptedClientKey = null;
    const algorithm = {
      name: algorithmName,
      length: 256
    };
    const websocketPool = new WebSocketPool({ clientKeyOnly: true });
    websocketPool.watchTicket(ticket);
    return websocketPool.promise.then((result) => {
      if (!result.clientKey) {
        throw Error(`No client key associated with the ticket ${ticket}`);
      }
      encryptedClientKey = result.clientKey;
      return getClientNonce(result.originalTicket ? result.originalTicket : ticket, result.ttl);
    })
    .then((key) => {
      if (!key) {
        throw new Error('No client key nonce associated with the ticket in this browser');
      }
      return importKey(key, { name: 'AES-CBC' }, false, [
        'encrypt',
        'decrypt',
        'wrapKey',
        'unwrapKey'
      ]);
    })
    .then((clientKeyNonce) => decrypt({ name: 'AES-CBC', iv: clientKeyIV }, clientKeyNonce, b64ToAb(encryptedClientKey)))
    .then((arrayBuffer) => importKey(arrayBuffer, algorithm, false, [
      'encrypt',
      'decrypt',
      'wrapKey',
      'unwrapKey']))
    .then((key) => new WWPassCryptoPromise(key, algorithm))
    .catch((error) => {
      if (error.reason !== undefined) {
        throw new Error(error.reason);
      }
      throw error;
    });
  }

  encryptArrayBuffer(arrayBuffer) {
    const iv = new Uint8Array(this.ivLen);
    getRandomData(iv);
    const { algorithm } = this;
    Object.assign(algorithm, {
      iv
    });
    return encrypt(algorithm,
      this.clientKey, arrayBuffer).then((encryptedAB) => concatBuffers(iv.buffer, encryptedAB));
  }

  encryptString(string) {
    return this.encryptArrayBuffer(str2ab(string)).then(abToB64);
  }

  decryptArrayBuffer(encryptedArrayBuffer) {
    const { algorithm } = this;
    Object.assign(algorithm, {
      iv: encryptedArrayBuffer.slice(0, this.ivLen)
    });
    return decrypt(algorithm,
      this.clientKey, encryptedArrayBuffer.slice(this.ivLen));
  }

  decryptString(encryptedString) {
    return this.decryptArrayBuffer(b64ToAb(encryptedString)).then(ab2str);
  }

  // Private
  constructor(key, algorithm) {
    this.ivLen = algorithm.name === 'AES-GCM' ? 12 : 16;
    this.algorithm = algorithm;
    if (algorithm.name === 'AES-GCM') {
      Object.assign(this.algorithm, {
        tagLength: 128
      });
    }
    this.clientKey = key;
  }
}

class WWPassCrypto {
  constructor(ticket, algorithm) {
    this.cryptoPromise = WWPassCryptoPromise.getWWPassCrypto(ticket, algorithm);
  }

  encryptArrayBuffer(arrayBuffer) {
    return this.cryptoPromise.then((crypto) => crypto.encryptArrayBuffer(arrayBuffer));
  }

  encryptString(string) {
    return this.cryptoPromise.then((crypto) => crypto.encryptString(string));
  }

  decryptArrayBuffer(encryptedArrayBuffer) {
    return this.cryptoPromise.then((crypto) => crypto.decryptArrayBuffer(encryptedArrayBuffer));
  }

  decryptString(encryptedString) {
    return this.cryptoPromise.then((crypto) => crypto.decryptString(encryptedString));
  }
}

export { WWPassCrypto, WWPassCryptoPromise };
