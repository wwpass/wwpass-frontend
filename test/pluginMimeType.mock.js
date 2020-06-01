
let mimeTypeGetter = jest.spyOn(window.navigator, 'mimeTypes', 'get');
mimeTypeGetter.mockReturnValue({'application/x-wwauth': true});

export {
    mimeTypeGetter
}
