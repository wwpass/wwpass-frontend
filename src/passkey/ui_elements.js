const noSecurityPack = `\
<p>No Security Pack is found on your computer or WWPass&nbsp;native&nbsp;host is not responding.</p>
<p>To install Security Pack visit <a href="https://ks.wwpass.com/download/">Key Services</a></p>
<p><a href="https://support.wwpass.com/?topic=604">Learn more...</a></p>`;

const noChromeExtension = (returnURL) => `\
<p>The WWPass Authentication extension for Chrome is not installed or is disabled in browser settings.</p>
<p>Click the link below to install and enable the WWPass Authentication extension.</p>
<p><a href="https://chrome.wwpass.com/?callbackURL=${encodeURIComponent(returnURL)}">Install WWPass Authentication Extension</a>`;

const noFirefoxExtension = (returnURL) => `\
<p>The WWPass Authentication extension for Firefox is not installed or is disabled in browser settings.</p>
<p>Click the link below to install and enable the WWPass Authentication extension.</p>
<p><a href="https://firefox.wwpass.com/?callbackURL=${encodeURIComponent(returnURL)}">Install WWPass Authentication Extension</a>`;

const noAuthInterfacesMessage = 'No WWPass SecurityPack is found on your computer or WWPass Browser Plugin is disabled';
const unsupprotedPlatfromMessage = 'WWPass authentication is not supported on';

const errorDialogCSS = `#_wwpass_err_dlg {
  display: block;
  position: fixed;
  top: 20%;
  left: 50%;
  width: 550px;
  margin-left: -315px; /* -(width + padding-left)px */

  padding: 20px 40px;
  background-color: #eee;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 300;
  box-shadow: 0 2px 5px;

  z-index: 1337;
  }

  #_wwpass_err_dlg a {
      color: #0074d9;
      }

  #_wwpass_err_dlg h1 {
      font-size: 1.3em;
      font-weight: 300;
      margin-bottom: 30px;
      }

#_wwpass_err_close {
  text-decoration: none;
  color: #0074d9;
  cursor: pointer;

  margin: 0 auto;
  display: block;
  max-width: 40px;
  min-width: 35px;

  margin-top: 30px;
  }

@media (max-width: 700px) {
  #_wwpass_err_dlg {
      width: 100%;
      height: 100%;
      margin: 0;
      left: 0;
      top: 0;
      padding: 10px;
      }

  #_wwpass_err_close {
      margin-top: 1em;
      }
}`;

const passkeyButtonHTML = `<svg id="icon-button_logo" viewBox="0 0 34 20" style="fill: none; left: 28px; stroke-width: 2px; width: 35px; height: 25px; top: 5px; position: absolute;">
<switch><g><title>button_logo</title><path fill="#FFF" d="M31.2 20h-28c-1.7 0-3-1.3-3-3V3c0-1.7 1.3-3 3-3h27.4C32.5 0 34 1.6 34 3.6c0 1.3-.8 2.5-1.9 3L34 16.8c.2 1.6-.9 3-2.5 3.1-.1.1-.2.1-.3.1zM27 6h-1c-1.1 0-2 .9-2 2v1h-8.3c-.8-2.8-3.8-4.4-6.5-3.5S4.8 9.2 5.6 12s3.8 4.4 6.5 3.5c1.7-.5 3-1.8 3.5-3.5H27V6zm-1 1c-.6 0-1 .4-1 1v2H12.1V8.3c0-.2-.1-.3-.2-.3h-.2l-3.6 2.3c-.1.1-.2.3-.1.4l.1.1 3.6 2.2c.1.1.3 0 .4-.1V11H26V7z"></path></g></switch></svg>
Log in with PassKey`;
const passkeyButtonCSS = `color: white;
background-color: #2277E6;
font-weight: 400;
font-size: 18px;
line-height: 36px;
font-family: "Arial", sans-serif;
padding-right: 15px;
padding-left: 60px;
cursor: pointer;
height: 40px;
width: 255px;
border-radius: 3px;
border: 1px solid #2277E6;
text-decoration: none;
position: relative;`;

export {
  noSecurityPack,
  noChromeExtension,
  noFirefoxExtension,
  errorDialogCSS,
  passkeyButtonCSS,
  passkeyButtonHTML,
  noAuthInterfacesMessage,
  unsupprotedPlatfromMessage
};
