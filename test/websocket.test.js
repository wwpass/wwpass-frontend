jest.mock('../src/navigation',()=>(jest.fn()));

import WebSocketPool from "../src/qrcode/wwpass.websocket";

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
  global.WebSocket = wsOnOpen;
});

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}
describe('wwpassWebSocket' ,() => {

  test('success', () => {
    const wsPool = new WebSocketPool({});
    wsPool.watchTicket("SP%20Name:scp:nonce@spfe.addr:1234");
    let socket = wsPool.connectionPool[0];
    expect(wsOnOpen).toBeCalledWith('wss://spfews.wwpass.com');
    socket.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name:scp:nonce@spfe.addr:1234" }));
    socket.onmessage({data:'{"code":100, "reason":"Starting"}'});
    socket.onmessage({data:'{"code":100, "reason":"Starting", "clientKey":"123456"}'});
    socket.onmessage({data:'{"code":200, "reason":"OK"}'});
    return wsPool.promise.then((result) => {
      expect(result).toEqual({
        originalTicket: "SP%20Name:scp:nonce@spfe.addr:1234",
        status: 200,
        reason: 'OK',
        ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        clientKey: '123456',
        ttl: undefined }
      );
    });
  });

  test('success with OriginalTicket', () => {
    const wsPool = new WebSocketPool({});
    wsPool.watchTicket("SP%20Name:p:some_new_nonce@spfe.addr:1234");
    let socket = wsPool.connectionPool[0];
    expect(wsOnOpen).toBeCalledWith('wss://spfews.wwpass.com');
    socket.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234" }));
    socket.onmessage({data:'{"code":100, "reason":"Starting"}'});
    socket.onmessage({data:'{"code":100, "reason":"Starting", "clientKey":"123456", "originalTicket":"SP%20Name:scp:nonce@spfe.addr:1234", "ttl": 123}'});
    socket.onmessage({data:'{"code":200, "reason":"OK"}'});
    return wsPool.promise.then((result) => {
      expect(result).toEqual({
        originalTicket: "SP%20Name:scp:nonce@spfe.addr:1234",
        status: 200,
        reason: 'OK',
        ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234",
        clientKey: '123456',
        ttl:123 }
      );
    });
  });

  test('wait fo two tickets', () => {
    const wsPool = new WebSocketPool({});
    wsPool.watchTicket("SP%20Name:p:some_new_nonce@spfe.addr:1234");
    let socket1 = wsPool.connectionPool[0];
    expect(wsOnOpen).toBeCalledWith('wss://spfews.wwpass.com');
    socket1.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234" }));
    socket1.onmessage({data:'{"code":100, "reason":"Starting"}'});

    wsPool.watchTicket("SP%20Name:p:some_new_nonce2@spfe.addr:1234");
    let socket2 = wsPool.connectionPool[1];
    expect(wsOnOpen).toBeCalledWith('wss://spfews.wwpass.com');
    socket2.onopen();
    expect(wsSend).toBeCalledWith(JSON.stringify({ ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234" }));
    socket2.onmessage({data:'{"code":100, "reason":"Starting"}'});
    socket1.onmessage({data:'{"code":100, "reason":"Starting", "clientKey":"123456", "originalTicket":"SP%20Name:scp:nonce@spfe.addr:1234", "ttl": 123}'});
    socket2.onmessage({data:'{"code":500, "reason":"FAIL"}'});
    socket1.onmessage({data:'{"code":200, "reason":"OK"}'});
    return wsPool.promise.then((result) => {
      expect(result).toEqual({
        originalTicket: "SP%20Name:scp:nonce@spfe.addr:1234",
        status: 200,
        reason: 'OK',
        ticket: "SP%20Name:p:some_new_nonce@spfe.addr:1234",
        clientKey: '123456',
        ttl:123 }
      );
    });
  });
});
