import { isClientKeyTicket, ticketAdapter } from '../src/ticket';

test('ticket with :c: is correctly identified as having client key', () => {
  expect(isClientKeyTicket('SPName:c:nonce@spfe.address:1234')).toBe(true);
  expect(isClientKeyTicket('SPName:cp:nonce@spfe.address:1234')).toBe(true);
  expect(isClientKeyTicket('SPName:psc:nonce@spfe.address:1234')).toBe(true);
});
test('ticket without :c: is correctly identified as having no client key', () => {
  expect(isClientKeyTicket('SPNamec:cnonce@spfe.address:1234')).toBe(false);
  expect(isClientKeyTicket('SPNamec:p:cnonce@spfe.address:1234')).toBe(false);
  expect(isClientKeyTicket('SPNamec:ps:cnonce@spfe.addressc:c1234')).toBe(false);
});

describe('ticketAdapter', () => {
  test('should convert SPFe response to ticket object', () => {
    const spfeParsedResponse = {
      data: 'Human%20QR%20Code%20Test:e0c6f2b89ff4ed596cdd388c77df3517@p-sp-03-30:16033',
      encoding: 'plain',
      result: true,
      ttl: 600
    };
  
    const goldTicket = {
      ticket: 'Human%20QR%20Code%20Test:e0c6f2b89ff4ed596cdd388c77df3517@p-sp-03-30:16033',
      ttl: 600
    };
  
    expect(ticketAdapter(spfeParsedResponse)).toEqual(goldTicket);
  });
  
  test('should convert SPFe response to ticket object and add TTL', () => {
    const spfeParsedResponse = {
      data: 'Human%20QR%20Code%20Test:e0c6f2b89ff4ed596cdd388c77df3517@p-sp-03-30:16033',
      encoding: 'plain',
      result: true
    };
  
    const goldTicket = {
      ticket: 'Human%20QR%20Code%20Test:e0c6f2b89ff4ed596cdd388c77df3517@p-sp-03-30:16033',
      ttl: 120
    };
  
    expect(ticketAdapter(spfeParsedResponse)).toEqual(goldTicket);
  });  
});
