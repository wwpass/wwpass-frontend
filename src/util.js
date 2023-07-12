const wait = (ms) => (ms ? (new Promise((r) => { setTimeout(r, ms); })) : Promise.resolve(null));

const absolutePath = (href) => {
  const link = document.createElement('a');
  link.href = href;
  return link.href;
};

const concatBuffers = (...args) => {
  const totalLen = args.reduce((accumulator, curentAB) => accumulator + curentAB.byteLength, 0);
  let i = 0;
  const result = new Uint8Array(totalLen);
  while (args.length > 0) {
    result.set(new Uint8Array(args[0]), i);
    i += args[0].byteLength;
    args.shift();
  }
  return result.buffer;
};

// Hexlify binary buffer
const hexlify = (buffer) => {
  const hexCodes = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    const value = view.getUint32(i);
    // toString(16) will give the hex representation of the number without padding
    const stringValue = value.toString(16);
    // We use concatenation and slice for padding
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join('');
};

export {
  absolutePath,
  concatBuffers,
  hexlify,
  wait
};
