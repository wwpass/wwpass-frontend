import './crypto.mock';
import {
  encodeClientNonce,
  exportKey,
  generateKey
} from '../src/crypto';

test('generateKey and encodeClientKey', async () => {
  const key = await exportKey('raw', await generateKey());
  expect(key).toBeInstanceOf(Buffer);
  expect(key.length).toEqual(32);
  expect(encodeClientNonce(key)).toMatch(/[a-zA-Z0-9.-]{43}_/);
});
