import './crypto.mock'
import { getUniversalURL } from '../src/urls';
import open from "../src/open";

import {TextEncoder} from 'text-encoding';
global.TextEncoder = TextEncoder;

import { generateClientNonce } from '../src/nonce';
import { b64ToAb } from '../src/ab';
jest.mock('../src/nonce');

beforeAll(() => {
    generateClientNonce.mockImplementation(() => {
        return new Promise((resolve) => {
            resolve(b64ToAb('7KHzhb6uH8LDNFgQkkUn1r7foj5e1TpeJEEArZnzLqc='));
        })
    });
});

test('openWithTicket with client nonce', () => {
    return expect(
        open({
            ticket: "SP%20Name:scp:nonce@spfe.addr:1234",
            callbackURL: "https://www.example.com/path/to/callback.php?param=value",
            away: false
        })
    ).resolves.toEqual(
        getUniversalURL({
            "callbackURL": "https://www.example.com/path/to/callback.php?param=value",
            "ppx": "wwp_",
            "ticket": "SP%20Name:scp:nonce@spfe.addr:1234",
            'clientKey': '7KHzhb6uH8LDNFgQkkUn1r7foj5e1TpeJEEArZnzLqc_'
        })
    );
});

test('openWithTicket without client nonce', () => {
    return expect(
        open({
            ticket: "SP%20Name:sp:nonce@spfe.addr:1234",
            callbackURL: "https://www.example.com/path/to/callback.php?param=value",
            away: false,
        })
    ).resolves.toEqual(
        getUniversalURL({
            "callbackURL": "https://www.example.com/path/to/callback.php?param=value",
            "ppx": "wwp_",
            "ticket": "SP%20Name:sp:nonce@spfe.addr:1234",
        })
    );
});

test('openWithTicket prefix check', () => {
    return expect(
        open({
            ticket: "SP%20Name:sp:nonce@spfe.addr:1234",
            callbackURL: "https://www.example.com/path/to/callback.php?param=value",
            away: false,
            "ppx": "wtf_"
        })
    ).resolves.toEqual(
        getUniversalURL({
            "callbackURL": "https://www.example.com/path/to/callback.php?param=value",
            "ppx": "wtf_",
            "ticket": "SP%20Name:sp:nonce@spfe.addr:1234",
        })
    );
});
