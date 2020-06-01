
let mimeTypeGetter = jest.spyOn(window.navigator, 'mimeTypes', 'get');
mimeTypeGetter.mockReturnValue({});

export {
    mimeTypeGetter
}
