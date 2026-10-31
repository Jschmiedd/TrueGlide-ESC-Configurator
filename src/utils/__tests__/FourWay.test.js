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

  it('should reject exit when the port is closed', async() => {
    const { PortClosedError } = require('../Errors');
    const failingSerial = () => Promise.reject(new PortClosedError('closed'));
    fourWay = new FourWay(failingSerial);

    await expect(fourWay.exit()).rejects.toThrow(PortClosedError);
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

  it('should say that a blank BLHeli_S EEPROM cannot be checked, even when forced', async() => {
    const fs = require('fs');
    const General = require('../helpers/General');
    const validSpy = jest.spyOn(General, 'isValidFlash').mockImplementation(() => true);
    const hex = fs.readFileSync(`${__dirname}/../helpers/__tests__/valid.hex`).toString();
    const esc = {
      firmwareName: 'BLHeli_S',
      isArm: false,
      isSiLabs: true,
      meta: {
        interfaceMode: 1,
        signature: 0xE8B2,
      },
    };

    fourWay.initFlash = jest.fn(() => ({ params: [0xB2, 0xE8, 0x00, 0x01] }));
    // Erased EEPROM
    fourWay.read = jest.fn((address, bytes) => ({ params: new Uint8Array(bytes).fill(0xFF) }));
    fourWay.write = jest.fn();
    fourWay.erasePage = jest.fn();
    fourWay.logCallback = jest.fn();

    await fourWay.writeHex(0, esc, hex, true, false, jest.fn());

    expect(fourWay.logCallback).toHaveBeenCalledWith('escSettingsMcuUnknown', undefined);
    expect(fourWay.logCallback).not.toHaveBeenCalledWith('escSettingsMcuMismatch', undefined);
    expect(fourWay.erasePage).not.toHaveBeenCalled();
    expect(fourWay.write).not.toHaveBeenCalled();
    validSpy.mockRestore();
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

    it('should check the MCU type even when flashing is forced', async() => {
      const fileName = Array.from('AM32_TEST_G071').map((c) => c.charCodeAt(0));
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(0, 0x7BE0, [...fileName, 0x00]),
        record(1, 0, []),
      ].join('\n');
      fourWay.getInfo = jest.fn(() => ({
        isArm: true,
        meta: {
          am32: {
            fileName: 'AM32_TEST_F051',
            mcuType: 'F051',
          },
        },
      }));

      await expect(fourWay.flashPreflight({
        ...esc,
        index: 0,
      }, hex, true)).rejects.toThrow('Invalid MCU type in hex file.');
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscMissmatchMcuType', { index: 1 });
    });

    it('should refuse a file without a name even when flashing is forced', async() => {
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');
      fourWay.getInfo = jest.fn(() => ({
        isArm: true,
        meta: {
          am32: {
            fileName: 'AM32_TEST_F051',
            mcuType: 'F051',
          },
        },
      }));

      await expect(fourWay.flashPreflight({
        ...esc,
        index: 0,
      }, hex, true)).rejects.toThrow('File name not found in hex file.');
    });

    it('should check the MCU type from the bootloader when the ESC has no name', async() => {
      const fileName = Array.from('AM32_TEST_G071').map((c) => c.charCodeAt(0));
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(0, 0x7BE0, [...fileName, 0x00]),
        record(1, 0, []),
      ].join('\n');
      // Empty ESC or firmware older than 1.93: no name stored, bootloader 1F06 (F051)
      fourWay.getInfo = jest.fn(() => ({
        isArm: true,
        meta: { am32: {} },
      }));

      await expect(fourWay.flashPreflight({
        ...esc,
        index: 0,
      }, hex, false)).rejects.toThrow('Invalid MCU type in hex file.');
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscMissmatchMcuType', { index: 1 });
    });

    it('should say when only the flash family can be checked', async() => {
      const fileName = Array.from('AM32_TEST_G071').map((c) => c.charCodeAt(0));
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(0, 0xF7E0, [...fileName, 0x00]),
        record(1, 0, []),
      ].join('\n');
      fourWay.getInfo = jest.fn(() => ({
        isArm: true,
        meta: { am32: {} },
      }));

      await fourWay.flashPreflight({
        ...esc,
        index: 0,
        meta: {
          interfaceMode: 4,
          signature: 0x3506,
        },
      }, hex, false);
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscMcuFamilyOnly', {
        index: 1,
        name: 'AM32_TEST_G071',
      });
    });

    it('should log when no firmware defaults could be written', async() => {
      const General = require('../helpers/General');
      const { MIGRATION } = require('../helpers/Settings');
      const delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());

      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');
      fourWay.read = jest.fn((address, bytes) => ({ params: bytes === 4 ? new Uint8Array([0x00, 0x20, 0x00, 0x20]) : new Uint8Array(bytes).fill(0x05) }));
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x00, 0x04] }));
      fourWay.writePages = jest.fn();
      fourWay.verifyPages = jest.fn();
      fourWay.reset = jest.fn();
      fourWay.writeSettings = jest.fn();
      // Unknown layout: no default values
      fourWay.getInfo = jest.fn(() => ({
        ...esc,
        settings: {},
      }));

      await fourWay.writeHex(0, esc, hex, false, MIGRATION.DEFAULTS, jest.fn());

      expect(fourWay.writeSettings).not.toHaveBeenCalled();
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingDefaultsNotWritten', { index: 1 });
      delaySpy.mockRestore();
    });

    it('should compare the vector table even when flashing is forced', async() => {
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');
      // Another MCU: different vector table
      fourWay.read = jest.fn((address, bytes) => ({ params: new Uint8Array(bytes).fill(0x11) }));

      const result = await fourWay.writeHex(0, esc, hex, true, false, jest.fn());

      expect(result).toBeNull();
      expect(fourWay.write).not.toHaveBeenCalled();
    });

    it('should write the firmware defaults after flashing when asked to', async() => {
      const General = require('../helpers/General');
      const { MIGRATION } = require('../helpers/Settings');
      const delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());

      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');
      // Same MCU: same vector table, AM32 keeps its previous settings
      fourWay.read = jest.fn((address, bytes) => ({ params: bytes === 4 ? new Uint8Array([0x00, 0x20, 0x00, 0x20]) : new Uint8Array(bytes).fill(0x05) }));
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x00, 0x04] }));
      fourWay.writePages = jest.fn();
      fourWay.verifyPages = jest.fn();
      fourWay.reset = jest.fn();
      fourWay.writeSettings = jest.fn();
      const flashedEsc = {
        ...esc,
        settings: {
          BEEP_VOLUME: 10,
          SERVO_NEUTRAL: 100,
        },
        defaultSettings: { BEEP_VOLUME: 5 },
      };
      fourWay.getInfo = jest.fn(() => flashedEsc);

      await fourWay.writeHex(0, esc, hex, false, MIGRATION.DEFAULTS, jest.fn());

      expect(fourWay.writeSettings).toHaveBeenCalledWith(0, flashedEsc, {
        BEEP_VOLUME: 5,
        SERVO_NEUTRAL: 100,
      });
      delaySpy.mockRestore();
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
