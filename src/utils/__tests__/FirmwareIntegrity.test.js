import {
  checkFirmware,
  getMirrorUrl,
  getValidated,
  sha256,
  VALIDATED,
} from '../FirmwareIntegrity';

const { webcrypto } = require('crypto');
const { TextEncoder } = require('util');

const testEntry = {
  url: 'https://example.org/releases/download/v1/TEST_24_v1.hex',
  file: 'test/v1/TEST_24_v1.hex',
  // SHA-256 of "abc"
  sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
};

describe('FirmwareIntegrity', () => {
  const originalCrypto = window.crypto;

  beforeAll(() => {
    if(typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = TextEncoder;
    }
    Object.defineProperty(window, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
    VALIDATED.push(testEntry);
  });

  afterAll(() => {
    VALIDATED.pop();
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('should list the Bluejay file validated in test TGE-P1', () => {
    const url = 'https://github.com/bird-sanctuary/bluejay/releases/download/v0.19.2/J_H_40_24_v0.19.2.hex';
    expect(getValidated(url).sha256).toEqual('0fbfc67814933fbac41c2430d235da73ed5e666b8df040eec596f4c0db0ff4c2');
    expect(getMirrorUrl(url)).toEqual('https://jschmiedd.github.io/TrueGlide-ESC-Configurator/firmwares/bluejay/v0.19.2/J_H_40_24_v0.19.2.hex');

    const url48 = 'https://github.com/bird-sanctuary/bluejay/releases/download/v0.19.2/J_H_40_48_v0.19.2.hex';
    expect(getValidated(url48).sha256).toEqual('8731a3570f8f4f3122cbd06d18f44fc06bccb4d27af4885853d5410eb701ac07');
    expect(getMirrorUrl(url48)).toEqual('https://jschmiedd.github.io/TrueGlide-ESC-Configurator/firmwares/bluejay/v0.19.2/J_H_40_48_v0.19.2.hex');
    expect(getMirrorUrl('https://github.com/bird-sanctuary/bluejay/releases/download/v0.19.2/J_H_25_24_v0.19.2.hex')).toBeNull();
  });

  it('should compute the SHA-256 of a text', async() => {
    expect(await sha256('abc')).toEqual(testEntry.sha256);
  });

  it('should accept a listed file only when it is intact', async() => {
    expect(await checkFirmware(testEntry.url, 'abc')).toEqual('valid');
    expect(await checkFirmware(testEntry.url, 'abd')).toEqual('mismatch');
    expect(await checkFirmware(testEntry.url, 'abc\n')).toEqual('mismatch');
  });

  it('should flag files that are not validated', async() => {
    expect(await checkFirmware('https://example.org/other.hex', 'abc')).toEqual('unlisted');
  });

  it('should recognise a local copy of a validated file', async() => {
    expect(await checkFirmware(null, 'abc')).toEqual('valid');
    expect(await checkFirmware(null, 'abd')).toEqual('unlisted');
  });

  it('should refuse a listed file when the hash cannot be computed', async() => {
    Object.defineProperty(window, 'crypto', {
      value: undefined,
      configurable: true,
    });
    expect(await checkFirmware(testEntry.url, 'abc')).toEqual('mismatch');
    Object.defineProperty(window, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
  });
});
