import WebSocketPool from '../src/mobile/wwpass.websocket';

jest.mock('../src/navigation', () => (jest.fn()));

let wsOnOpen = () => {};
let wsSend = () => {};

beforeEach(() => {
  wsSend = jest.fn();
  wsOnOpen = jest.fn().mockImplementation(() => ({
    send: wsSend,
    close: jest.fn()
  }));
  global.WebSocket = wsOnOpen;
});

describe('wwpassWebSocket', () => {
  test('success', () => {
    const wsPool = new WebSocketPool({});
    wsPool.watchTicket('SP%20Name:scp:nonce@spfe.addr:1234');
    const socket = wsPool.connectionPool[0];
    expect(wsOnOpen).toHaveBeenCalledWith('wss://spfews.wwpass.com');
    socket.onopen();
    expect(wsSend).toHaveBeenCalledWith(JSON.stringify({ ticket: 'SP%20Name:scp:nonce@spfe.addr:1234' }));
    socket.onmessage({ data: '{"code":100, "reason":"Starting"}' });
    socket.onmessage({ data: '{"code":100, "reason":"Starting", "clientKey":"123456"}' });
    socket.onmessage({ data: '{"code":200, "reason":"OK"}' });
    return wsPool.promise.then((result) => {
      expect(result).toEqual({
        originalTicket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        status: 200,
        reason: 'OK',
        ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        clientKey: '123456',
        ttl: undefined
      });
    });
  });

  test('success with OriginalTicket', () => {
    const wsPool = new WebSocketPool({});
    wsPool.watchTicket('SP%20Name:p:some_new_nonce@spfe.addr:1234');
    const socket = wsPool.connectionPool[0];
    expect(wsOnOpen).toHaveBeenCalledWith('wss://spfews.wwpass.com');
    socket.onopen();
    expect(wsSend).toHaveBeenCalledWith(JSON.stringify({ ticket: 'SP%20Name:p:some_new_nonce@spfe.addr:1234' }));
    socket.onmessage({ data: '{"code":100, "reason":"Starting"}' });
    socket.onmessage({ data: '{"code":100, "reason":"Starting", "clientKey":"123456", "originalTicket":"SP%20Name:scp:nonce@spfe.addr:1234", "ttl": 123}' });
    socket.onmessage({ data: '{"code":200, "reason":"OK"}' });
    return wsPool.promise.then((result) => {
      expect(result).toEqual({
        originalTicket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        status: 200,
        reason: 'OK',
        ticket: 'SP%20Name:p:some_new_nonce@spfe.addr:1234',
        clientKey: '123456',
        ttl: 123
      });
    });
  });

  test('wait fo two tickets', () => {
    const wsPool = new WebSocketPool({});
    wsPool.watchTicket('SP%20Name:p:some_new_nonce@spfe.addr:1234');
    const socket1 = wsPool.connectionPool[0];
    expect(wsOnOpen).toHaveBeenCalledWith('wss://spfews.wwpass.com');
    socket1.onopen();
    expect(wsSend).toHaveBeenCalledWith(JSON.stringify({ ticket: 'SP%20Name:p:some_new_nonce@spfe.addr:1234' }));
    socket1.onmessage({ data: '{"code":100, "reason":"Starting"}' });

    wsPool.watchTicket('SP%20Name:p:some_new_nonce2@spfe.addr:1234');
    const socket2 = wsPool.connectionPool[1];
    expect(wsOnOpen).toHaveBeenCalledWith('wss://spfews.wwpass.com');
    socket2.onopen();
    expect(wsSend).toHaveBeenCalledWith(JSON.stringify({ ticket: 'SP%20Name:p:some_new_nonce@spfe.addr:1234' }));
    socket2.onmessage({ data: '{"code":100, "reason":"Starting"}' });
    socket1.onmessage({ data: '{"code":100, "reason":"Starting", "clientKey":"123456", "originalTicket":"SP%20Name:scp:nonce@spfe.addr:1234", "ttl": 123}' });
    socket2.onmessage({ data: '{"code":500, "reason":"FAIL"}' });
    socket1.onmessage({ data: '{"code":200, "reason":"OK"}' });
    return wsPool.promise.then((result) => {
      expect(result).toEqual({
        originalTicket: 'SP%20Name:scp:nonce@spfe.addr:1234',
        status: 200,
        reason: 'OK',
        ticket: 'SP%20Name:p:some_new_nonce@spfe.addr:1234',
        clientKey: '123456',
        ttl: 123
      });
    });
  });
});
