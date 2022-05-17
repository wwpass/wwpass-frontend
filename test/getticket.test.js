import './crypto.mock';
import {
  getTicket,
  updateTicket
} from '../src/getticket';
import { getClientNonce } from '../src/nonce';
import { b64ToAb } from '../src/ab';

import WebSocketPool from '../src/mobile/wwpass.websocket';

let fetchReply = {
  ticket: 'SP%20Name:scp:nonce@spfe.addr:1234',
  ttl: 10
};

jest.mock('../src/mobile/wwpass.websocket');

jest.mock('../src/mobile/wwpass.websocket');

let wsOriginalTicket = null;

beforeAll(() => {
  WebSocketPool.prototype.promise = Promise.resolve({
    clientKey: b64ToAb('7KHzhb6uH8LDNFgQkkUn1r7foj5e1TpeJEEArZnzLqc='),
    originalTicket: wsOriginalTicket,
    ttl: 300
  });
});

global.fetch = jest.fn().mockImplementation(() => Promise.resolve(
  {
    ok: true,
    json: () => fetchReply
  }
));

test('getTicket', () => getTicket('https://example.com/getticket.json').then((result) => {
  expect(result).toEqual({ ticket: 'SP%20Name:scp:nonce@spfe.addr:1234', ttl: 10 });
}));

test('updateTicket', () => {
  fetchReply = {
    oldTicket: 'SP%20Name:scp:nonce@spfe.addr:1234',
    newTicket: 'SP%20Name:scp:nonce2@spfe.addr:1234',
    ttl: 30
  };
  wsOriginalTicket = fetchReply.oldTicket;
  return updateTicket('https://example.com/updateticket.json').then((result) => {
    expect(result).toEqual({ ticket: 'SP%20Name:scp:nonce2@spfe.addr:1234', ttl: 30 });
    return getClientNonce(fetchReply.oldTicket);
  });
});
