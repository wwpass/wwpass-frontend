import { abToB64, b64ToAb } from './ab';
import { isClientKeyTicket } from './ticket';
import {
  generateKey, exportKey, sha256, haveCryptoAPI
} from './crypto';
import WWPassError from './error';
import { WWPASS_STATUS } from './constants';

const clean = (items) => {
  const currentDate = window.Date.now();
  return items.filter((item) => item.deadline > currentDate);
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

// Retrieve client key nonce from local stroage
const getClientNonce = async (ticket, newTTL = null) => {
  if (!haveCryptoAPI) {
    throw new WWPassError(WWPASS_STATUS.SSL_REQUIRED, 'Client-side encryption requires https.');
  }

  const nonces = loadNonces();
  const hash = await sha256(ticket);
  const nonce = nonces.find((it) => hash === it.hash);

  const key = (nonce && nonce.key) ? b64ToAb(nonce.key) : undefined;
  if (newTTL && key) {
    nonce.deadline = window.Date.now() + (newTTL * 1000);
    saveNonces(nonces);
  }

  return key;
};

// generate Client Nonce and set it to localStorage
const generateClientNonce = async (ticket, ttl = 120) => {
  if (!haveCryptoAPI) {
    throw new WWPassError(WWPASS_STATUS.SSL_REQUIRED, 'Client-side encryption requires https.');
  }
  const loadedKey = await getClientNonce(ticket);
  if (loadedKey) {
    return loadedKey;
  }
  const keyPromise = generateKey();
  const [rawKey, digest] = await Promise.all(
    keyPromise.then((key) => exportKey('raw', key)),
    sha256(ticket)
  );
  const nonce = {
    hash: digest,
    key: abToB64(rawKey),
    deadline: window.Date.now() + (ttl * 1000)
  };
  const nonces = loadNonces();
  nonces.push(nonce);
  saveNonces(nonces);
  return rawKey;
};

const getClientNonceIfNeeded = async (ticket, ttl = 120) => {
  if (!isClientKeyTicket(ticket)) {
    return undefined;
  }
  return generateClientNonce(ticket, ttl);
};

const copyClientNonce = (oldTicket, newTicket, ttl) => getClientNonce(oldTicket).then((nonceKey) => sha256(newTicket) // eslint-disable-line max-len
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
  getClientNonceIfNeeded,
  copyClientNonce
};
