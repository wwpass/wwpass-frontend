import {
    getCallbackURL,
    getUniversalURL
  } from "../src/urls";

test('getCallbackURL', () => {
    expect(getCallbackURL({
        ppx: 'wwp_',
        version: 2,
        status: 200,
        reason: 'OK',
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value"
      })).toEqual("https://www.example.com/path/to/callback.php?param=value&wwp_version=2&wwp_ticket=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&wwp_status=200&wwp_reason=OK");
      expect(getCallbackURL({
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value"
      })).toEqual("https://www.example.com/path/to/callback.php?param=value&wwp_version=2&wwp_ticket=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&wwp_status=200&wwp_reason=OK");
      expect(getCallbackURL({
        ppx: 'wtf_',
        version: 2,
        status: 200,
        reason: 'OK',
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value"
      })).toEqual("https://www.example.com/path/to/callback.php?param=value&wtf_version=2&wtf_ticket=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&wtf_status=200&wtf_reason=OK");
      expect(getCallbackURL({
        ppx: 'wwp_',
        version: 2,
        status: 200,
        reason: 'OK',
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php"
      })).toEqual("https://www.example.com/path/to/callback.php?wwp_version=2&wwp_ticket=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&wwp_status=200&wwp_reason=OK");
});

test('getCallbackURL', () => {
    expect(getUniversalURL({
        universal: false,
        operation: 'auth',
        ppx: 'wwp_',
        version: 2,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: undefined
      })).toEqual("wwpass://auth?v=2&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");
      expect(getUniversalURL({
        universal: false,
        operation: 'deletecode',
        ppx: 'wwp_',
        version: 2,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: undefined
      })).toEqual("wwpass://deletecode?t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234");
      expect(getUniversalURL({
        universal: false,
        operation: 'auth',
        ppx: 'wtf_',
        version: 1,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: undefined
      })).toEqual("wwpass://auth?v=1&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wtf_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");
      expect(getUniversalURL({
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
      })).toEqual("wwpass://auth?v=2&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");
      expect(getUniversalURL({
        universal: false,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: "ITcImWEdGSJFd60jGBLuRx5QGzZNoswIXPjWIShrK2A_"
      })).toEqual("wwpass://auth?v=2&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&ck=ITcImWEdGSJFd60jGBLuRx5QGzZNoswIXPjWIShrK2A_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");

      expect(getUniversalURL({
        universal: true,
        operation: 'auth',
        ppx: 'wwp_',
        version: 2,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: undefined
      })).toEqual("https://get.wwpass.com/auth?v=2&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");
      expect(getUniversalURL({
        universal: true,
        operation: 'auth',
        ppx: 'wtf_',
        version: 1,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: undefined
      })).toEqual("https://get.wwpass.com/auth?v=1&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wtf_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");
      expect(getUniversalURL({
        universal: true,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
      })).toEqual("https://get.wwpass.com/auth?v=2&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");
      expect(getUniversalURL({
        universal: true,
        ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
        callbackURL: "https://www.example.com/path/to/callback.php?param=value",
        clientKey: "ITcImWEdGSJFd60jGBLuRx5QGzZNoswIXPjWIShrK2A_"
      })).toEqual("https://get.wwpass.com/auth?v=2&t=SP%2520Name%3Ascp%3Anonce%40spfe.addr%3A1234&ppx=wwp_&ck=ITcImWEdGSJFd60jGBLuRx5QGzZNoswIXPjWIShrK2A_&c=https%3A%2F%2Fwww.example.com%2Fpath%2Fto%2Fcallback.php%3Fparam%3Dvalue");

});