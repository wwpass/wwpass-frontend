const wait = (ms) => (ms ? (new Promise((r) => setTimeout(r, ms))) : null);

const absolutePath = (href) => {
  const link = document.createElement('a');
  link.href = href;
  return link.href;
};


export {
  absolutePath,
  wait
};
