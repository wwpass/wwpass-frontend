import { abToB64, str2ab } from './ab';
import { hexlify } from './util';

const crypto = window.crypto || window.msCrypto;
const subtle = crypto ? (crypto.webkitSubtle || crypto.subtle) : null;

const encodeClientNonce = (key) => abToB64(key).replace(/\+/g, '-').replace(/[/]/g, '.').replace(/=/g, '_');

const {
  encrypt, decrypt, importKey, exportKey, getRandomValues
} = subtle;

const generateKey = () => subtle.generateKey(
  {
    name: 'AES-CBC',
    length: 256
  },
  true, // is extractable
  ['encrypt', 'decrypt']
);

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
const sha256 = async (str) => hexlify(await subtle.digest({ name: 'SHA-256' }, str2ab(str)));

const haveCryptoAPI = Boolean(subtle);

export {
  generateKey,
  encodeClientNonce,
  sha256,
  importKey,
  exportKey,
  encrypt,
  decrypt,
  getRandomValues as getRandomData,
  haveCryptoAPI
};
