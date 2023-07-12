const mimeTypeGetter = jest.spyOn(window.navigator, 'mimeTypes', 'get');
mimeTypeGetter.mockReturnValue({ 'application/x-wwauth': true });

export {
  // eslint-disable-next-line import/prefer-default-export
  mimeTypeGetter
};
