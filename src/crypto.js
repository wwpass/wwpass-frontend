import { abToB64, str2ab } from './ab';
import { hexlify } from './util';

const crypto = window.crypto || window.msCrypto;
const subtle = crypto ? (crypto.webkitSubtle || crypto.subtle) : null;

const encodeClientNonce = (key) => abToB64(key).replace(/\+/g, '-').replace(/[/]/g, '.').replace(/=/g, '_');

// These functions cannot be just reexported. We have to capture "subtle"
const encrypt = (options, key, data) => subtle.encrypt(options, key, data);
const decrypt = (options, key, data) => subtle.decrypt(options, key, data);
const exportKey = (key) => subtle.exportKey('raw', key);
const importKey = (key, algoritm, extractable, operations) => subtle.importKey('raw', key, algoritm, extractable, operations);
const getRandomData = (buffer) => crypto.getRandomValues(buffer);
const generateKey = () => subtle.generateKey(
  {
    name: 'AES-CBC',
    length: 256
  },
  true, // is extractable
  ['encrypt', 'decrypt']
);
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
  getRandomData,
  haveCryptoAPI,
  subtle
};
