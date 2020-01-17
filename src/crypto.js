import { abToB64, b64ToAb } from './ab';

const crypto = window.crypto || window.msCrypto;
const subtle = crypto ? (crypto.webkitSubtle || crypto.subtle) : null;

const encodeClientKey = (key) => abToB64(key).replace(/\+/g, '-').replace(/[/]/g, '.').replace(/=/g, '_');
const encodeBase64ForURI = (base64) => base64.replace(/\+/g, '-').replace(/[/]/g, '.').replace(/=/g, '_');

const encrypt = (options, key, data) => subtle.encrypt(options, key, data);
const decrypt = (options, key, data) => subtle.decrypt(options, key, data);
const exportKey = (type, key) => subtle.exportKey(type, key);
const importKey = (format, key, algoritm, extractable, operations) => subtle.importKey(format, key, algoritm, extractable, operations); // eslint-disable-line max-len
const getRandomData = (buffer) => crypto.getRandomValues(buffer);

const generateClientKey = (resolve, reject) => {
  subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 256
    },
    true, // is extractable
    ['encrypt', 'decrypt']
  )
  .then((key) => exportKey('raw', key))
  .then((rawKey) => {
    resolve(rawKey);
    return rawKey;
  }).catch((err) => {
    reject(err);
  });
};

const saveBuffer = (key) => {
  window.localStorage.setItem('wwpClientKey', abToB64(key));
};

const loadBuffer = () => {
  const data = window.localStorage.getItem('wwpClientKey');
  return data ? b64ToAb(data) : undefined;
};

const concatBuffers = (...args) => {
  const totalLen = args.reduce(
    (accumulator, curentAB) => accumulator + curentAB.byteLength, 0
  );
  let i = 0;
  const result = new Uint8Array(totalLen);
  while (args.length > 0) {
    result.set(new Uint8Array(args[0]), i);
    i += args[0].byteLength;
    args.shift();
  }
  return result.buffer;
};

const getClientKey = (resolve, reject) => {
  generateClientKey(resolve, reject);
};

export {
  exportKey,
  importKey,
  getClientKey,
  encodeClientKey,
  encodeBase64ForURI,
  encrypt,
  decrypt,
  saveBuffer,
  loadBuffer,
  getRandomData,
  concatBuffers,
  subtle
};
