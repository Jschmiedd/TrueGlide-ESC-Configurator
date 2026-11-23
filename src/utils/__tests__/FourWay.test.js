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

  it('should wait for the answer to exit when asked to', async() => {
    const answer = { ack: 0 };
    const answeringSerial = jest.fn(() => Promise.resolve(answer));
    fourWay = new FourWay(answeringSerial);

    await expect(fourWay.exit(true)).resolves.toBe(answer);
    expect(answeringSerial).toHaveBeenCalledTimes(1);
    expect(answeringSerial.mock.calls[0][1]).toBe(fourWay.parseMessage);
  });

  it('should not wait for an answer to exit by default', async() => {
    const answeringSerial = jest.fn(() => Promise.resolve());
    fourWay = new FourWay(answeringSerial);

    await fourWay.exit();
    expect(answeringSerial.mock.calls[0][1]).toBe(null);
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

  describe('AM32 file name stored in the ESC', () => {
    const readWithName = (name) => jest.fn(async(address, bytes) => {
      if(bytes === 16) {
        const params = new Uint8Array(16);
        params.set(Array.from(name).map((c) => c.charCodeAt(0)).slice(0, 16));
        return { params };
      }

      return { params: new Uint8Array(bytes) };
    });

    it.each([
      ['AM32_TEST_F051', 'F051'],
      ['SEQURE_E130_G071', 'G071'],
    ])('should trust a complete name %s', async(name, mcuType) => {
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 4] }));
      fourWay.read = readWithName(name);

      const info = await fourWay.getInfo(0);

      expect(info.meta.am32.fileName).toEqual(name);
      expect(info.meta.am32.mcuType).toEqual(mcuType);
    });

    it.each([
      ['AM32_TEST_'],
      ['_'],
      ['F051'],
      ['AM32 TEST F051'],
      ['\u00ff\u00ff\u00ff'],
    ])('should not trust an incomplete name %j', async(name) => {
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 4] }));
      fourWay.read = readWithName(name);

      const info = await fourWay.getInfo(0);

      expect(info.meta.am32.fileName).toBeFalsy();
      expect(info.meta.am32.mcuType).toBeFalsy();
    });

    it('should read a name that fills the 16 bytes', async() => {
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 4] }));
      fourWay.read = readWithName('ABCDEFGHIJK_F051');

      const info = await fourWay.getInfo(0);

      expect(info.meta.am32.mcuType).toEqual('F051');
    });
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

  describe('AM32 ESC with EEPROM layout 4', () => {
    const layout4Image = require('../../sources/AM32/__tests__/layout4').default;
    const fileName = Array.from('AM32_TEST_F051').map((c) => c.charCodeAt(0));

    /**
     * The ESC as the firmware keeps it: reads give its bytes, and a write
     * erases the page first (the AM32 bootloader programs only the bytes it is
     * given)
     */
    let eeprom = null;
    beforeEach(() => {
      eeprom = layout4Image();
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 4] }));
      fourWay.sendMessagePromised = jest.fn(() => true);
      fourWay.logCallback = jest.fn();
      fourWay.read = jest.fn(async(address, bytes) => {
        if(bytes === 16) {
          const params = new Uint8Array(16);
          params.set(fileName);
          return { params };
        }
        if(bytes === 4) {
          return { params: new Uint8Array([0x00, 0x20, 0x00, 0x20]) };
        }

        return { params: Uint8Array.from(eeprom.subarray(0, bytes)) };
      });
      fourWay.write = jest.fn(async(address, data) => {
        eeprom.fill(0xFF);
        eeprom.set(data);
      });
    });

    it('should read its 192 bytes with layout 4', async() => {
      const info = await fourWay.getInfo(0);

      expect(info.layoutSize).toEqual(192);
      expect(info.settingsArray).toEqual(Array.from(layout4Image()));
      expect(info.layoutRevision).toEqual('4');
      expect(info.settings.DEMAG_COMPENSATION).toEqual(3);
      expect(info.settings.NAME).toBeUndefined();
      expect(info.firmwareName).toEqual('AM32');
      expect(info.displayName).toEqual('AM32_TEST - AM32, 2.22, Bootloader v12 (PA2), MCU: F051');
      expect(fourWay.logCallback).not.toHaveBeenCalledWith('layoutNotSupported', expect.anything());
    });

    it('should write back the same bytes but the setting changed', async() => {
      const info = await fourWay.getInfo(0);

      await fourWay.writeSettings(0, info, {
        ...info.settings,
        BEEP_VOLUME: 9,
      });

      const expected = layout4Image();
      expected[30] = 9;
      expect(fourWay.write).toHaveBeenCalledTimes(1);
      expect(Array.from(eeprom)).toEqual(Array.from(expected));
      expect(fourWay.logCallback).toHaveBeenCalledWith('escUpdateSuccess', { index: 1 });
    });

    it('should always write the low voltage cutoff as disabled', async() => {
      eeprom[36] = 2;
      const info = await fourWay.getInfo(0);
      expect(fourWay.logCallback).toHaveBeenCalledWith('lowVoltageCutActive', { index: 1 });

      await fourWay.writeSettings(0, info, info.settings);

      const expected = layout4Image();
      expect(Array.from(eeprom)).toEqual(Array.from(expected));
      expect(fourWay.logCallback).toHaveBeenCalledWith('lowVoltageCutDisabled', { index: 1 });
    });

    const record = (type, address, bytes) => {
      const all = [bytes.length, address >> 8, address & 0xFF, type, ...bytes];
      const checksum = (-all.reduce((a, b) => a + b, 0)) & 0xFF;
      return `:${[...all, checksum].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    };
    const hex = [
      record(4, 0, [0x08, 0x00]),
      record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
      record(0, 0x7BE0, [...fileName, 0x00]),
      record(1, 0, []),
    ].join('\n');

    // Byte 0 as jump() in the AM32 bootloader (bootloader/main.c) reads it
    const bootloaderStartsFirmware = () => eeprom[0] === 0x01;

    it('should write the cell based cutoff as 0 and never change byte 8', async() => {
      eeprom[36] = 1;
      eeprom[8] = 0x2A;
      const info = await fourWay.getInfo(0);

      await fourWay.writeSettings(0, info, {
        ...info.settings,
        BEEP_VOLUME: 9,
      });

      expect(eeprom[36]).toEqual(0);
      expect(eeprom[8]).toEqual(0x2A);
      expect(eeprom[30]).toEqual(9);
    });

    it('should keep byte 8 when writing the firmware defaults after flashing', async() => {
      const General = require('../helpers/General');
      const { MIGRATION } = require('../helpers/Settings');
      const delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());
      eeprom[36] = 2;
      eeprom[8] = 0x2A;
      const esc = await fourWay.getInfo(0);
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 0x04] }));
      fourWay.writePages = jest.fn();
      fourWay.verifyPages = jest.fn();
      fourWay.reset = jest.fn();

      await fourWay.writeHex(0, esc, hex, false, MIGRATION.DEFAULTS, jest.fn());

      expect(eeprom[0]).toEqual(0x01);
      expect(eeprom[36]).toEqual(0);
      expect(eeprom[8]).toEqual(0x2A);
      expect(eeprom[11]).toEqual(100);
      delaySpy.mockRestore();
    });

    it('should leave an interrupted flash with byte 0 at 0, its settings in place, and read it as failed', async() => {
      const { isFlashFailed } = require('../helpers/Settings');
      const image = Array.from(layout4Image());
      const esc = await fourWay.getInfo(0);
      expect(isFlashFailed(esc)).toBeFalsy();
      expect(bootloaderStartsFirmware()).toBeTruthy();

      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 0x04] }));
      fourWay.writePages = jest.fn(async() => {
        expect(bootloaderStartsFirmware()).toBeFalsy();
      });
      fourWay.verifyPages = jest.fn(async() => {
        throw new Error('ESC unplugged');
      });
      fourWay.reset = jest.fn();
      const written = [];
      fourWay.write = jest.fn(async(address, data) => {
        written.push(Array.from(data));
        eeprom.fill(0xFF);
        eeprom.set(data);
      });

      const result = await fourWay.writeHex(0, esc, hex, false, false, jest.fn());

      expect(result).toBeNull();
      expect(fourWay.writePages).toHaveBeenCalled();
      expect(fourWay.reset).not.toHaveBeenCalled();
      expect(written.every((data) => data[0] === 0x00)).toBeTruthy();
      expect(bootloaderStartsFirmware()).toBeFalsy();
      expect(Array.from(eeprom.subarray(1, 3))).toEqual(image.slice(1, 3));
      expect(Array.from(eeprom.subarray(5, 18))).toEqual(image.slice(5, 18));

      fourWay.logCallback.mockClear();
      const failed = await fourWay.getInfo(0);

      expect(failed.layoutRevision).toEqual('4');
      expect(failed.settings.BOOT_BYTE).toEqual(0);
      expect(isFlashFailed(failed)).toBeTruthy();
      expect(failed.displayName).toEqual('AM32_TEST - AM32, FLASH FIRMWARE, Bootloader v12 (PA2), MCU: F051');
      expect(fourWay.logCallback).toHaveBeenCalledWith('escBootBlocked', {
        index: 1,
        value: 0,
      });
    });

    const flashMocks = () => {
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 0x04] }));
      fourWay.writePages = jest.fn();
      fourWay.verifyPages = jest.fn();
      fourWay.reset = jest.fn();
    };

    it('should still flash an ESC its bootloader will not start, and make it start again', async() => {
      const General = require('../helpers/General');
      const { isFlashFailed } = require('../helpers/Settings');
      const delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());
      eeprom[0] = 0x00;
      const esc = await fourWay.getInfo(0);
      expect(esc.displayName).toEqual('AM32_TEST - AM32, FLASH FIRMWARE, Bootloader v12 (PA2), MCU: F051');
      expect(isFlashFailed(esc)).toBeTruthy();
      flashMocks();

      const result = await fourWay.writeHex(0, esc, hex, false, false, jest.fn());

      expect(fourWay.writePages).toHaveBeenCalled();
      expect(fourWay.reset).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(bootloaderStartsFirmware()).toBeTruthy();
      expect(isFlashFailed(result)).toBeFalsy();
      delaySpy.mockRestore();
    });

    it('should say that an ESC read as boot blocked may be healthy with a bootloader older than v12', async() => {
      eeprom[0] = 0x00;
      eeprom[2] = 11;

      await fourWay.getInfo(0);

      expect(fourWay.logCallback).toHaveBeenCalledWith('escBootBlocked', {
        index: 1,
        value: 0,
      });
      expect(fourWay.logCallback).toHaveBeenCalledWith('escBootBlockedOldBootloader', {
        index: 1,
        version: 11,
      });
    });

    it('should not say it may be healthy with a bootloader from v12 on', async() => {
      eeprom[0] = 0x00;
      eeprom[2] = 12;

      await fourWay.getInfo(0);

      expect(fourWay.logCallback).toHaveBeenCalledWith('escBootBlocked', {
        index: 1,
        value: 0,
      });
      expect(fourWay.logCallback).not.toHaveBeenCalledWith('escBootBlockedOldBootloader', expect.anything());
    });

    it('should warn when flashing an ESC whose bootloader is older than v12', async() => {
      const General = require('../helpers/General');
      const delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());
      eeprom[2] = 11;
      const old = await fourWay.getInfo(0);
      flashMocks();

      await fourWay.writeHex(0, old, hex, false, false, jest.fn());

      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingOldBootloader', {
        index: 1,
        version: 11,
      });

      fourWay.logCallback.mockClear();
      eeprom[2] = 12;
      const recent = await fourWay.getInfo(0);
      flashMocks();

      await fourWay.writeHex(0, recent, hex, false, false, jest.fn());

      expect(fourWay.logCallback).not.toHaveBeenCalledWith('flashingOldBootloader', expect.anything());
      delaySpy.mockRestore();
    });

    it('should keep its settings and CAN block when flashing it', async() => {
      const General = require('../helpers/General');
      const delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());
      const esc = await fourWay.getInfo(0);
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x02, 0x04] }));
      fourWay.writePages = jest.fn();
      fourWay.verifyPages = jest.fn();
      fourWay.reset = jest.fn();
      const written = [];
      fourWay.write = jest.fn(async(address, data) => {
        written.push(Array.from(data));
        eeprom.fill(0xFF);
        eeprom.set(data);
      });

      await fourWay.writeHex(0, esc, hex, false, false, jest.fn());

      const image = Array.from(layout4Image());
      const marker = [0x00, ...image.slice(1, 3), 0x00, 0x00, ...image.slice(5, 18)];
      const restored = [0x01, ...image.slice(1, 3), 0x00, 0x00, ...image.slice(5)];
      expect(written.slice(0, 2)).toEqual([marker, restored]);
      delaySpy.mockRestore();
    });
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
    expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscRefused', { index: 1 });
    expect(fourWay.logCallback).not.toHaveBeenCalledWith('escFlashedInTime', expect.anything());
    expect(fourWay.erasePage).not.toHaveBeenCalled();
    expect(fourWay.write).not.toHaveBeenCalled();
    validSpy.mockRestore();
  });

  it('should not report a refused BLHeli_S/Bluejay flash as flashed', async() => {
    const fs = require('fs');
    const General = require('../helpers/General');
    const validSpy = jest.spyOn(General, 'isValidFlash').mockImplementation(() => true);
    const hex = fs.readFileSync(`${__dirname}/../helpers/__tests__/valid.hex`).toString();
    const esc = {
      firmwareName: 'Bluejay',
      isArm: false,
      isSiLabs: true,
      meta: {
        interfaceMode: 1,
        signature: 0xE8B2,
      },
    };

    fourWay.initFlash = jest.fn(() => ({ params: [0xB2, 0xE8, 0x00, 0x01] }));
    // Another layout stored in the ESC
    fourWay.read = jest.fn((address, bytes) => ({ params: new Uint8Array(bytes).fill(0x41) }));
    fourWay.write = jest.fn();
    fourWay.erasePage = jest.fn();
    fourWay.writeSettings = jest.fn();
    fourWay.logCallback = jest.fn();

    const result = await fourWay.writeHex(0, esc, hex, false, false, jest.fn());

    expect(result).toBe(esc);
    expect(fourWay.logCallback).toHaveBeenCalledWith('escSettingsLayoutMismatch', undefined);
    expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscRefused', { index: 1 });
    expect(fourWay.logCallback).not.toHaveBeenCalledWith('escFlashedInTime', expect.anything());
    expect(fourWay.writeSettings).not.toHaveBeenCalled();
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

      const familyEsc = {
        ...esc,
        index: 0,
        meta: {
          interfaceMode: 4,
          signature: 0x3506,
        },
      };

      // No target name in the ESC: refused unless the pilot allows it (audit 07/11 M5)
      await expect(fourWay.flashPreflight(familyEsc, hex, false)).rejects.toThrow();
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscMcuFamilyOnly', {
        index: 1,
        name: 'AM32_TEST_G071',
      });
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingEscTargetUnknown', { index: 1 });

      await expect(fourWay.flashPreflight(familyEsc, hex, true)).resolves.toBeUndefined();
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

    it('should report an AM32 flash as failed when the verification fails', async() => {
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');
      fourWay.read = jest.fn((address, bytes) => ({ params: bytes === 4 ? new Uint8Array([0x00, 0x20, 0x00, 0x20]) : new Uint8Array(bytes).fill(0x05) }));
      fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x00, 0x04] }));
      fourWay.writePages = jest.fn();
      fourWay.verifyPages = jest.fn(async() => {
        throw new Error('verification failed');
      });
      fourWay.reset = jest.fn();
      fourWay.getInfo = jest.fn(() => esc);

      const result = await fourWay.writeHex(0, esc, hex, false, false, jest.fn());

      expect(result).toBeNull();
      expect(fourWay.logCallback).toHaveBeenCalledWith('flashingVerificationFailed', undefined);
      expect(fourWay.logCallback).not.toHaveBeenCalledWith('escFlashedInTime', expect.anything());
      expect(fourWay.reset).not.toHaveBeenCalled();
      // Only the "FLASH FAIL" marker was written, never "NOT READY"
      const written = fourWay.write.mock.calls.map(([, data]) => String.fromCharCode(...data));
      expect(written.some((text) => text.includes('FLASH FAIL'))).toBeTruthy();
      expect(written.some((text) => text.includes('NOT READY'))).toBeFalsy();
    });

    it('should disable the low voltage cutoff after flashing an AM32 ESC from empty', async() => {
      const General = require('../helpers/General');
      const am32Eeprom = require('../../sources/AM32/eeprom').default;
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
      // Flashed AM32 comes up with the cutoff enabled
      const flashed = {
        ...esc,
        layout: am32Eeprom.LAYOUT,
        layoutRevision: '2',
        settings: { LOW_VOLTAGE_CUTOFF: 1 },
      };
      fourWay.getInfo = jest.fn(() => flashed);

      const emptyEsc = {
        ...esc,
        firmwareName: 'BLHeli_32',
      };
      await fourWay.writeHex(0, emptyEsc, hex, false, false, jest.fn());

      expect(fourWay.writeSettings).toHaveBeenCalledWith(0, flashed, flashed.settings);
      delaySpy.mockRestore();
    });

    describe('with an AM32 layout that is not described', () => {
      const hex = [
        record(4, 0, [0x08, 0x00]),
        record(0, 0x1000, [0x00, 0x20, 0x00, 0x20]),
        record(1, 0, []),
      ].join('\n');

      let delaySpy = null;
      beforeEach(() => {
        const General = require('../helpers/General');
        delaySpy = jest.spyOn(General, 'delay').mockImplementation(() => Promise.resolve());
        fourWay.read = jest.fn((address, bytes) => ({ params: bytes === 4 ? new Uint8Array([0x00, 0x20, 0x00, 0x20]) : new Uint8Array(bytes).fill(0x05) }));
        fourWay.initFlash = jest.fn(() => ({ params: [0x06, 0x1F, 0x00, 0x04] }));
        fourWay.writePages = jest.fn();
        fourWay.verifyPages = jest.fn();
        fourWay.reset = jest.fn();
        fourWay.writeSettings = jest.fn();
      });

      afterEach(() => {
        delaySpy.mockRestore();
      });

      const am32Esc = (layoutRevision, settings) => ({
        ...esc,
        layout: require('../../sources/AM32/eeprom').default.LAYOUT,
        layoutRevision,
        settings: {
          NAME: '',
          ...settings,
        },
        individualSettings: { NAME: '' },
      });

      it('should still flash, but write no setting after flashing to it', async() => {
        const { MIGRATION } = require('../helpers/Settings');
        const flashed = am32Esc('3', { LOW_VOLTAGE_CUTOFF: 1 });
        fourWay.getInfo = jest.fn(() => flashed);

        const result = await fourWay.writeHex(0, am32Esc('2', {}), hex, false, MIGRATION.ALL, jest.fn());

        expect(result).toEqual(flashed);
        expect(fourWay.writePages).toHaveBeenCalled();
        expect(fourWay.writeSettings).not.toHaveBeenCalled();
        expect(fourWay.logCallback).toHaveBeenCalledWith('flashingSettingsBlockedLayout', {
          index: 1,
          revision: '3',
        });
      });

      it('should write no firmware default after flashing, even with defaults for that layout', async() => {
        const { MIGRATION } = require('../helpers/Settings');
        const flashed = {
          ...am32Esc('3', { BEEP_VOLUME: 10 }),
          defaultSettings: { BEEP_VOLUME: 5 },
        };
        fourWay.getInfo = jest.fn(() => flashed);

        const result = await fourWay.writeHex(0, am32Esc('2', {}), hex, false, MIGRATION.DEFAULTS, jest.fn());

        expect(result).toEqual(flashed);
        expect(fourWay.writeSettings).not.toHaveBeenCalled();
        expect(fourWay.logCallback).toHaveBeenCalledWith('flashingSettingsBlockedLayout', {
          index: 1,
          revision: '3',
        });
      });

      it('should refuse to write settings to it, whoever asks', async() => {
        const { LayoutNotDescribedError } = require('../Errors');
        const direct = new FourWay(serial);
        direct.sendMessagePromised = jest.fn(() => true);
        direct.write = jest.fn();
        direct.writeEEprom = jest.fn();
        const undescribedEsc = am32Esc('3', { BEEP_VOLUME: 10 });

        await expect(direct.writeSettings(0, undescribedEsc, { BEEP_VOLUME: 5 })).rejects.toThrow(LayoutNotDescribedError);
        expect(direct.sendMessagePromised).not.toHaveBeenCalled();
        expect(direct.write).not.toHaveBeenCalled();
        expect(direct.writeEEprom).not.toHaveBeenCalled();
      });

      it('should migrate no setting read with a layout that is not described', async() => {
        const { MIGRATION } = require('../helpers/Settings');
        fourWay.getInfo = jest.fn(() => am32Esc('2', { LOW_VOLTAGE_CUTOFF: 0 }));

        await fourWay.writeHex(0, am32Esc('3', {}), hex, false, MIGRATION.ALL, jest.fn());

        expect(fourWay.writeSettings).not.toHaveBeenCalled();
        expect(fourWay.logCallback).toHaveBeenCalledWith('flashingSettingsBlockedLayout', {
          index: 1,
          revision: '3',
        });
      });
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

      // Flashing itself is not simulated here: it fails after the check and
      // is reported as failed (null), never thrown out.
      await expect(fourWay.writeHex(0, esc, hex, false, false, jest.fn())).resolves.toBeNull();

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

describe('FourWay with a flight controller answering in MSP', () => {
  it('should stop at the first MSP answer and say so', async() => {
    const FourWayClass = require('../FourWay').default;
    const { MspAnswerError } = require('../Errors');
    const mspAnswer = new Uint8Array([36, 77, 33, 0, 0, 0]);
    const serial = jest.fn((buffer, read) => new Promise((resolve, reject) => read(mspAnswer, resolve, reject)));
    const fourWay = new FourWayClass(serial);

    await expect(fourWay.getInfo(0)).rejects.toThrow(MspAnswerError);
    // Not retried: the flight controller is not in passthrough
    expect(serial).toHaveBeenCalledTimes(1);
  });
});

describe('FourWay flash when the ESC loses its power', () => {
  it('should fail the page check instead of waiting forever', async() => {
    const FourWayClass = require('../FourWay').default;
    const fourWay = new FourWayClass(jest.fn());
    fourWay.read = jest.fn(async() => {
      throw new Error('Timed out after 1000ms');
    });
    fourWay.progressCallback = jest.fn();

    const data = new Uint8Array(0x200);
    const outcome = await Promise.race([
      fourWay.verifyPages(0, 1, 0x200, data).then(() => 'resolved', () => 'rejected'),
      new Promise((resolve) => setTimeout(() => resolve('blocked'), 3000)),
    ]);

    expect(outcome).toEqual('rejected');
  });
});
