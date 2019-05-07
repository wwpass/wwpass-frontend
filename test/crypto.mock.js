import crypto from '@trust/webcrypto';

Object.defineProperty(window, 'crypto', {
  writable: false,
  value: crypto
});
