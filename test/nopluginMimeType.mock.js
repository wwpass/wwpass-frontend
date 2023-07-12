const mimeTypeGetter = jest.spyOn(window.navigator, 'mimeTypes', 'get');
mimeTypeGetter.mockReturnValue({});

export {
  // eslint-disable-next-line import/prefer-default-export
  mimeTypeGetter
};
