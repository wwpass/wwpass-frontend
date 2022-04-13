import './crypto.mock';
import {
  encodeClientNonce,
  generateKey
} from '../src/crypto';

test('generateKey and encodeClientKey', () => new Promise((done) => {
  generateKey((key) => {
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toEqual(32);
    expect(encodeClientNonce(key)).toMatch(/[a-zA-Z0-9.-]{43}_/);
    done();
  }, (err) => {
    throw err;
  });
}));
