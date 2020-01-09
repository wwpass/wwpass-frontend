import { abToB64, b64ToAb, str2ab } from './ab';
import { isClientKeyTicket } from './ticket';
import { subtle } from './crypto';
import WWPassError from './error';
import { WWPASS_STATUS } from './passkey/constants';

const exportKey = (type, key) => subtle.exportKey(type, key);

// generate digest from string
const hex = (buffer) => {
  const hexCodes = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    const value = view.getUint32(i);
    // toString(16) will give the hex representation of the number without padding
    const stringValue = value.toString(16);
    // We use concatenation and slice for padding
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join('');
};

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
const sha256 = (str) => {
  // We transform the string into an arraybuffer.
  const buffer = str2ab(str);
  return subtle.digest({ name: 'SHA-256' }, buffer)
  .then(hash => hex(hash));
};

const clean = (items) => {
  const currentDate = window.Date.now();
  return items.filter(item => item.deadline > currentDate);
};

const loadNonces = () => {
  const wwpassNonce = window.localStorage.getItem('wwpassNonce');
  if (!wwpassNonce) {
    return [];
  }
  try {
    return clean(JSON.parse(wwpassNonce));
  } catch (error) {
    window.localStorage.removeItem('wwpassNonce');
    throw error;
  }
};

const saveNonces = (nonces) => {
  window.localStorage.setItem('wwpassNonce', JSON.stringify(nonces));
};

// get from localStorage Client Nonce
const getClientNonce = (ticket, newTTL = null) => {
  if (!subtle) {
    throw new WWPassError(WWPASS_STATUS.SSL_REQUIRED, 'Client-side encryption requires https.');
  }

  const nonces = loadNonces();

  return sha256(ticket)
  .then((hash) => {
    const nonce = nonces.find(it => hash === it.hash);
    const key = (nonce && nonce.key) ? b64ToAb(nonce.key) : undefined;
    if (newTTL && key) {
      nonce.deadline = window.Date.now() + (newTTL * 1000);
      saveNonces(nonces);
    }
    return key;
  });
};

// generate Client Nonce and set it to localStorage
const generateClientNonce = (ticket, ttl = 120) => {
  if (!subtle) {
    throw new WWPassError(WWPASS_STATUS.SSL_REQUIRED, 'Client-side encryption requires https.');
  }

  return getClientNonce(ticket).then((loadedKey) => {
    if (loadedKey) {
      return loadedKey;
    }

    return subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 256
      },
      true, // is extractable
      ['encrypt', 'decrypt']
    )
    .then(key => exportKey('raw', key))
    .then(rawKey => sha256(ticket).then((digest) => {
      const nonce = {
        hash: digest,
        key: abToB64(rawKey),
        deadline: window.Date.now() + (ttl * 1000)
      };
      const nonces = loadNonces();
      nonces.push(nonce);
      saveNonces(nonces);

      // hack for return key
      return rawKey;
    }));
  });
};

const getClientNonceWrapper = (ticket, ttl = 120) => {
  if (!isClientKeyTicket(ticket)) {
    return new Promise((resolve) => {
      resolve(undefined);
    });
  }

  return generateClientNonce(ticket, ttl);
};

const copyClientNonce = (oldTicket, newTicket, ttl) =>
  getClientNonce(oldTicket).then(nonceKey => sha256(newTicket)
  .then((digest) => {
    const nonces = loadNonces();
    nonces.push({
      hash: digest,
      key: abToB64(nonceKey),
      deadline: window.Date.now() + (ttl * 1000)
    });
    saveNonces(nonces);
  }));

export {
  getClientNonce,
  generateClientNonce,
  getClientNonceWrapper,
  copyClientNonce
};
