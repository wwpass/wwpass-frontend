const abToB64 = (data) => btoa(String.fromCharCode.apply(null, new Uint8Array(data)));

const b64ToAb = (base64) => {
  const s = atob(base64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) {
    bytes[i] = s.charCodeAt(i);
  }
  return bytes.buffer;
};

const ab2str = (buf) => String.fromCharCode.apply(null, new Uint16Array(buf));

const str2ab = (str) => {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i += 1) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

export {
  ab2str,
  str2ab,
  abToB64,
  b64ToAb
};
