jest.mock('../src/navigation',()=>(jest.fn()));

import {
  getWebSocketResult,
  closeConnectionPool,
  __RewireAPI__ as wsRewire
} from "../src/qrcode/wwpass.websocket";

var wsOnOpen = () => {};
let wsSend =  () => {};

beforeEach( () => {
  wsSend = jest.fn();
  wsOnOpen = jest.fn().mockImplementation( (url) => {
    return {
      send: wsSend,
      close: jest.fn(),
    }
  });
  closeConnectionPool();
  global.WebSocket= wsOnOpen;
});

const connectionPool = wsRewire.__get__('connectionPool');

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}
describe('wwpassWebSocket' ,() => {

  test('success', () => {
    let options = {
      ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
      callbackURL: "https://www.example.com/path/to/callback.php?param=value",
    };
    const wsResult = getWebSocketResult(options);
    let socket = connectionPool[0];
    expect(wsOnOpen).toBeCalledWith('wss://spfews.wwpass.com');
    socket.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name:scp:nonce@spfe.addr:1234" }));
    socket.onmessage({data:'{"code":100, "reason":"Starting"}'});
    socket.onmessage({data:'{"code":100, "reason":"Starting", "clientKey":"123456"}'});
    socket.onmessage({data:'{"code":200, "reason":"OK"}'});
    return wsResult.then((result) => {
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        originalTicket: "SP%20Name:scp:nonce@spfe.addr:1234",
        status: 200,
        reason: 'OK',
        ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        callbackURL: 'https://www.example.com/path/to/callback.php?param=value',
        clientKey: '123456',
        ttl: null }
      );
    });
  });

  test('success with OriginalTicket', () => {
    let options = {
      ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234",
      callbackURL: "https://www.example.com/path/to/callback.php?param=value"
    };
    const wsResult = getWebSocketResult(options);
    let socket = connectionPool[0];
    expect(wsOnOpen).toBeCalledWith('wss://spfews.wwpass.com');
    socket.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234" }));
    socket.onmessage({data:'{"code":100, "reason":"Starting"}'});
    socket.onmessage({data:'{"code":100, "reason":"Starting", "clientKey":"123456", "originalTicket":"SP%20Name:scp:nonce@spfe.addr:1234", "ttl": 123}'});
    socket.onmessage({data:'{"code":200, "reason":"OK"}'});
    return wsResult.then((result) => {
      expect(result).toEqual({
        ppx: 'wwp_',
        version: 2,
        originalTicket: "SP%20Name:scp:nonce@spfe.addr:1234",
        status: 200,
        reason: 'OK',
        ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234",
        callbackURL: 'https://www.example.com/path/to/callback.php?param=value',
        clientKey: '123456',
        ttl:123 }
      );
    });
  });

  test('error 500', () => {
    let options = {
      ticket: "SP%20Name111:sp:nonce@spfe.addr:1234",
      callbackURL: "https://www.example.com/path/to/callback.php?param=value",
    };
    wsSend.mockReset();
    const wsResult = getWebSocketResult(options);
    let socket = connectionPool[0];
    socket.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name111:sp:nonce@spfe.addr:1234" }));
    socket.onmessage({data:'{"code":500, "reason":"FAIL"}'});
    return wsResult.then(()=>{expect(true).toBe(false);}, (result) => {
      expect(result.status).toEqual(500);
    });
  });
});
