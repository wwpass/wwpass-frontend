import './crypto.mock'
import {
    getClientKey,
    encodeClientKey,
    encodeBase64ForURI,
    saveBuffer,
    loadBuffer
  } from "../src/crypto";

test('getClientKey and encodeClientKey', (done) => {
    getClientKey(key => {
        expect(key).toBeInstanceOf(Buffer);
        expect(key.length).toEqual(32);
        expect(encodeClientKey(key)).toMatch(/[a-zA-Z0-9.-]{43}_/);
        done();
      }, (err) => {
          throw err;
      });
});

test('encodeBase64ForURI', () => {
    expect(encodeBase64ForURI("+/=")).toEqual("-._");
    expect(encodeBase64ForURI("a+z+/A/Z09=")).toEqual("a-z-.A.Z09_");
});

test('saveBuffer and loadBuffer', () => {
    const testBuffer = "TestBUFFER";
    saveBuffer(new Buffer(testBuffer));
    expect(loadBuffer()).toEqual(new ArrayBuffer(testBuffer));
});
