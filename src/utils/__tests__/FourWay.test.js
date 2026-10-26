import { TextDecoder } from 'util';

global.TextDecoder = TextDecoder;

let serial;
let resolve;
let reject;
let fourWay;
let FourWay;

describe('FourWay', () => {
  beforeAll(async() => {
    /**
     * require component instead of import so that we can properly
     * pre-populate the local storage
     */
    FourWay = require('../FourWay').default;
  });

  beforeEach(() => {
    serial = jest.fn();
    resolve = jest.fn();
    reject = jest.fn();
    fourWay = new FourWay(serial);
  });

  it('should handle starting with invalid serial', async() => {
    const failingSerial = () => { throw new Error(); };
    fourWay = new FourWay(failingSerial);

    expect(() => fourWay.start()).not.toThrow();

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });

  it('should start with valid  serial', async() => {
    fourWay.start();

    await new Promise((r) => {
      setTimeout(() => {
        r();
      }, 1000);
    });

    expect(serial).toHaveBeenCalled();
  });

  it('should exit', async() => {
    fourWay.exit();
    expect(serial).toHaveBeenCalled();
  });

  it('should reset', async() => {
    fourWay.reset();
    expect(serial).toHaveBeenCalled();
  });

  it('should writeEEprom', async() => {
    fourWay.writeEEprom();
    expect(serial).toHaveBeenCalled();
  });

  it('should write', async() => {
    fourWay.write();
    expect(serial).toHaveBeenCalled();
  });

  it('should readEEprom', async() => {
    fourWay.readEEprom();
    expect(serial).toHaveBeenCalled();
  });

  it('should read', async() => {
    fourWay.read();
    expect(serial).toHaveBeenCalled();
  });

  it('should page erase', async() => {
    fourWay.erasePage();
    expect(serial).toHaveBeenCalled();
  });

  it('should erase pages', async() => {
    fourWay.erasePages();
    expect(serial).not.toHaveBeenCalled();

    fourWay.erasePages(0, 1);
    expect(serial).toHaveBeenCalled();
  });

  it('should erase page', async() => {
    fourWay.erasePage(0);
    expect(serial).toHaveBeenCalled();
  });

  it('should init flash', async() => {
    fourWay.initFlash();
    expect(serial).toHaveBeenCalled();
  });

  it('should get info', async() => {
    await expect(fourWay.getInfo()).rejects.toThrow();
    expect(serial).toHaveBeenCalled();
  });

  it('should detect a probable BLHeli_32 ESC without reading it', async() => {
    fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x33, 4] }));
    fourWay.read = jest.fn();
    fourWay.logCallback = jest.fn();

    const info = await fourWay.getInfo(0);

    expect(info.firmwareName).toEqual('BLHeli_32');
    expect(info.settings.NAME).toEqual('BLHeli_32');
    expect(info.supported).toBeFalsy();
    expect(fourWay.read).not.toHaveBeenCalled();
    expect(fourWay.logCallback).toHaveBeenCalledWith('blheli32Detected', { index: 1 });
  });

  it('should name an AM32 ESC on an unsupported pin without reading it', async() => {
    fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x0F, 4] }));
    fourWay.read = jest.fn();
    fourWay.logCallback = jest.fn();

    const info = await fourWay.getInfo(0);

    expect(info.displayName).toEqual('AM32 (PA15)');
    expect(info.settings.NAME).toEqual('AM32-PIN');
    expect(info.supported).toBeFalsy();
    expect(fourWay.read).not.toHaveBeenCalled();
    expect(fourWay.logCallback).toHaveBeenCalledWith('am32PinUnsupported', {
      index: 1,
      pin: 'PA15',
    });
  });

  it('should treat pin PA0 (code 0) as AM32, not BLHeli_32', async() => {
    fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x00, 4] }));
    fourWay.read = jest.fn();

    const info = await fourWay.getInfo(0);

    expect(info.displayName).toEqual('AM32 (PA0)');
    expect(fourWay.read).not.toHaveBeenCalled();
  });

  it('should always write the AM32 low voltage cutoff as disabled', async() => {
    const am32Eeprom = require('../../sources/AM32/eeprom').default;
    const Convert = require('../helpers/Convert').default;
    const settings = {
      ...Convert.arrayToSettingsObject(new Uint8Array(am32Eeprom.LAYOUT_SIZE), am32Eeprom.LAYOUT),
      LOW_VOLTAGE_CUTOFF: 1,
    };
    const esc = {
      isArm: true,
      isSiLabs: false,
      layout: am32Eeprom.LAYOUT,
      layoutRevision: '2',
      layoutSize: am32Eeprom.LAYOUT_SIZE,
      meta: {
        interfaceMode: 4,
        signature: 0x1F06,
      },
      settingsArray: Array.from(Convert.objectToSettingsArray(settings, am32Eeprom.LAYOUT, am32Eeprom.LAYOUT_SIZE)),
    };

    let written = null;
    fourWay.sendMessagePromised = jest.fn(() => true);
    fourWay.write = jest.fn((address, data) => { written = data; });
    fourWay.read = jest.fn(() => ({ params: written }));
    fourWay.logCallback = jest.fn();

    await fourWay.writeSettings(0, esc, settings);

    expect(written[am32Eeprom.LAYOUT.LOW_VOLTAGE_CUTOFF.offset]).toEqual(0);
    expect(fourWay.logCallback).toHaveBeenCalledWith('lowVoltageCutDisabled', { index: 1 });
    expect(fourWay.logCallback).toHaveBeenCalledWith('escUpdateSuccess', { index: 1 });
  });

  describe('flashing an ESC with only the AM32 bootloader', () => {
    const record = (type, address, bytes) => {
      const all = [bytes.length, address >> 8, address & 0xFF, type, ...bytes];
      const checksum = (-all.reduce((a, b) => a + b, 0)) & 0xFF;
      return `:${[...all, checksum].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    };

    const esc = {
      firmwareName: 'AM32',
      isArm: true,
      isSiLabs: false,
      meta: {
        interfaceMode: 4,
        signature: 0x1F06,
      },
    };

    beforeEach(() => {
      fourWay.initFlash = jest.fn();
      fourWay.read = jest.fn((address, bytes) => ({ params: new Uint8Array(bytes).fill(0xFF) }));
      fourWay.write = jest.fn();
      fourWay.logCallback = jest.fn();
    });

    it('should refuse a file not built for the flash layout', async() => {
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');

      const result = await fourWay.writeHex(0, esc, hex, false, false, jest.fn());

      expect(result).toBeNull();
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscEmptyMismatch', { index: 1 });
      expect(fourWay.write).not.toHaveBeenCalled();
    });

    it('should accept a file built for the flash layout', async() => {
      const fileName = Array.from('AM32_TEST_F051').map((c) => c.charCodeAt(0));
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(0, 0x7BE0, [...fileName, 0x00]),
        record(1, 0, []),
      ].join('\n');

      // Flashing itself is not simulated here and fails after the check.
      await expect(fourWay.writeHex(0, esc, hex, false, false, jest.fn())).rejects.toThrow();

      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscEmpty', {
        index: 1,
        name: 'AM32_TEST_F051',
      });
      expect(fourWay.logCallback).not.toHaveBeenCalledWith('flashingEscEmptyMismatch', { index: 1 });
    });
  });

  it('should be possible to log', async() => {
    const logCallback = jest.fn();
    fourWay.setLogCallback(logCallback);

    fourWay.addLogMessage();
    expect(logCallback).toHaveBeenCalled();
  });

  it('should parse message without params', () => {
    const buffer = fourWay.createMessage(0x30, []);
    expect(buffer.byteLength).toEqual(8);
  });

  it('should parse message with too many params', () => {
    expect(() => fourWay.createMessage(0x30, new Array(300))).toThrow();
  });

  it('should parse empty message', () => {
    fourWay.parseMessage([], resolve, reject);
    expect(reject).toHaveBeenCalled();
  });

  it('should parse message which is too short', () => {
    fourWay.parseMessage([0x2e], resolve, reject);
    expect(reject).toHaveBeenCalled();
  });

  it('should parse message where parameters are too short', () => {
    fourWay.parseMessage([0x2e, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0], resolve, reject);
    expect(reject).toHaveBeenCalled();
  });

  it('should parse message where max parameters are too short', () => {
    fourWay.parseMessage([0x2e, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], resolve, reject);
    expect(reject).toHaveBeenCalled();
  });

  it('should handle a checksum mismatch', () => {
    fourWay.parseMessage([0x2e, 1, 2, 3, 1, 5, 6, 7, 8, 9, 10], resolve, reject);
    expect(reject).toHaveBeenCalled();
  });

  it('should parse a valid message', () => {
    fourWay.parseMessage([46, 48, 0, 0, 1, 0, 0, 68, 194], resolve, reject);
    expect(resolve).toHaveBeenCalled();
  });

  it('should handle serial error while sending', async() => {
    const failingSerial = () => { throw new Error(); };
    fourWay = new FourWay(failingSerial);
    expect(fourWay.testAlive()).toMatchObject({});
  });

  it('should handle serial resolve', async() => {
    const serial = () => ({
      "command": 48,
      "address": 0,
      "ack": 0,
      "checksum": 17602,
      "params": { "0": 0 },
    });

    fourWay = new FourWay(serial);
    await expect(fourWay.testAlive()).resolves.toMatchObject(serial());
  });

  it('should handle extended debug', async() => {
    const serial = () => ({
      "command": 48,
      "address": 0,
      "ack": 0,
      "checksum": 17602,
      "params": { "0": 0 },
    });

    fourWay = new FourWay(serial);
    await expect(fourWay.testAlive()).resolves.toMatchObject(serial());
  });
});
