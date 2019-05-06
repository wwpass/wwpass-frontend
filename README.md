# wwpass-frontend

wwpass-frontend is a WWPass authentication and client-side encryption library.

## Install

To install library dependencies, run:

```shell
npm install
```

To build a standalone library version, run:

```shell
npm run build
```

## Usage

To initialize WWPass QR-code authentication use:

(NPM module, import with namespace)
```js
import * as WWPass from 'wwpass-frontend';

WWPass.authInit({
  qrcode: document.querySelector('#qrcode-container'),
  ticketURL: `${urlBase}getticket.php`,
  callbackURL: `${urlBase}login.php`,
});
```

(NPM module, cherry-pick)
```js
import { authInit }  from 'wwpass-frontend';

authInit({
  qrcode: document.querySelector('#qrcode-container'),
  ticketURL: `${urlBase}getticket.php`,
  callbackURL: `${urlBase}login.php`,
});
```

(Standalone script)
```html
<script src="wwpass-frontend.js"></script>
<script>
WWPass.authInit({
  qrcode: document.querySelector('#qrcode'),
  passkey: document.querySelector('#button--login'),
  ticketURL: `${urlBase}getticket.php`,
  callbackURL: `${urlBase}login.php`,
});
</script>
```

## Support

If you have any questions, contact us support@wwpass.com.

## License

MIT © WWPass Corporation