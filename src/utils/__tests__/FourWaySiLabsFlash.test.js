/**
 * Flashing a BLHeli_S / Bluejay ESC (SiLabs) against a simulated ESC: its
 * flash memory is an array, erased by hardware page like the real MCU. The
 * real page, verification and protection steps run unchanged; only the
 * bootloader commands (read, write, erase) are simulated.
 */
import { TextDecoder } from 'util';

import Flash from '../helpers/Flash';

global.TextDecoder = TextDecoder;

const fs = require('fs');

const HEX = fs.readFileSync(`${__dirname}/../helpers/__tests__/valid.hex`).toString();

// EFM8BB21 (signature 0xE8B2): 512 byte pages, EEPROM 0x1A00, bootloader 0x1C00
const BB21 = {
  signature: 0xE8B2,
  size: 0x2000,
  hardwarePage: 512,
  eeprom: 0x1A00,
  bootloader: 0x1C00,
};

const NAME_OFFSET = 0x60;
const ascii = (bytes) => String.fromCharCode(...bytes);

function makeImage() {
  return Flash.fillImage(Flash.parseHex(HEX), BB21.size, 0);
}

/**
 * Simulated ESC. "corrupt" decides, for each write, whether the bytes that
 * reach the memory are damaged (the verification must then fail).
 */
function simulate(fourWay, memory, { corrupt = () => false } = {}) {
  const events = [];

  fourWay.initFlash = jest.fn(async() => ({ params: [BB21.signature & 0xFF, BB21.signature >> 8, 0x00, 0x01] }));
  fourWay.read = jest.fn(async(address, bytes) => ({
    address,
    params: memory.slice(address, address + bytes),
  }));
  fourWay.write = jest.fn(async(address, data) => {
    events.push(['write', address]);
    if(address >= BB21.bootloader) {
      throw new Error('Write into the bootloader');
    }

    const stored = Uint8Array.from(data);
    if(corrupt(address)) {
      stored[0] ^= 0xFF;
    }
    memory.set(stored, address);

    return { address };
  });
  fourWay.erasePage = jest.fn(async(page) => {
    // The bootloader takes 512 byte units, the hardware erases its whole page
    const start = Math.floor((page * 512) / BB21.hardwarePage) * BB21.hardwarePage;
    events.push(['erase', start]);
    if(start >= BB21.bootloader) {
      throw new Error('Erase of the bootloader');
    }
    memory.fill(0xFF, start, start + BB21.hardwarePage);
  });
  fourWay.reset = jest.fn();
  fourWay.getInfo = jest.fn(async() => ({
    index: 0,
    settings: { NAME: ascii(memory.slice(BB21.eeprom + NAME_OFFSET, BB21.eeprom + NAME_OFFSET + 16)).trim() },
  }));
  fourWay.writeSettings = jest.fn();
  fourWay.logCallback = jest.fn();

  return events;
}

const esc = {
  firmwareName: 'Bluejay',
  isArm: false,
  isSiLabs: true,
  meta: {
    interfaceMode: 1,
    signature: BB21.signature,
  },
  settings: {},
};

describe('SiLabs flash on a simulated ESC', () => {
  let fourWay;
  let image;
  let memory;
  let bootloader;

  beforeEach(() => {
    const FourWay = require('../FourWay').default;
    fourWay = new FourWay(jest.fn());

    image = makeImage();

    // Old firmware: same layout and MCU, different code
    memory = new Uint8Array(BB21.size).fill(0xFF);
    memory.set(image.subarray(0, BB21.bootloader));
    memory.fill(0x00, 0x0100, 0x0300);
    memory.fill(0x00, 0x0800, 0x0900);

    // Something recognisable in the bootloader area
    memory.fill(0xA5, BB21.bootloader, BB21.size);
    bootloader = memory.slice(BB21.bootloader);
  });

  it('should write and verify the whole firmware, never the bootloader', async() => {
    const events = simulate(fourWay, memory);
    const progress = jest.fn();

    const result = await fourWay.writeHex(0, esc, HEX, false, false, progress);

    expect(result).not.toBeNull();
    expect(result.settings.NAME).toEqual('Bluejay');
    expect(memory.subarray(0, BB21.bootloader)).toEqual(image.subarray(0, BB21.bootloader));
    expect(memory.subarray(BB21.bootloader)).toEqual(bootloader);
    expect(fourWay.logCallback).toHaveBeenCalledWith('escFlashedInTime', expect.objectContaining({ index: 1 }));

    // Progress goes up to 100 %
    const last = progress.mock.calls[progress.mock.calls.length - 1][0];
    expect(last).toBeCloseTo(100, 0);

    // Order of the protections
    const firstEepromWrite = events.findIndex(([type, address]) => type === 'write' && address === BB21.eeprom);
    const ljmpWrite = events.findIndex(([type, address]) => type === 'write' && address === 0x200);
    const page0Erase = events.findIndex(([type, address]) => type === 'erase' && address === 0);
    const codeWrite = events.findIndex(([type, address]) => type === 'write' && address === 0x400);
    expect(firstEepromWrite).toBeGreaterThanOrEqual(0);
    expect(firstEepromWrite).toBeLessThan(ljmpWrite);
    expect(ljmpWrite).toBeLessThan(page0Erase);
    expect(page0Erase).toBeLessThan(codeWrite);
  });

  it('should leave a recoverable ESC when the code verification fails', async() => {
    // Every write of the block at 0x0800 is damaged
    simulate(fourWay, memory, { corrupt: (address) => address === 0x0800 });

    const result = await fourWay.writeHex(0, esc, HEX, false, false, jest.fn());

    // Reported as failed, never as flashed
    expect(result).toBeNull();
    expect(fourWay.getInfo).not.toHaveBeenCalled();
    expect(fourWay.logCallback).not.toHaveBeenCalledWith('escFlashedInTime', expect.anything());

    // Page 0 erased, page 1 starts with "LJMP 0x1C00": the ESC starts in its bootloader
    expect(memory.subarray(0, 0x200).every((byte) => byte === 0xFF)).toBeTruthy();
    expect(Array.from(memory.subarray(0x200, 0x203))).toEqual([0x02, 0x1C, 0x00]);

    // The ESC calls itself **FLASH*FAILED**, the bootloader is intact
    expect(ascii(memory.subarray(BB21.eeprom + NAME_OFFSET, BB21.eeprom + NAME_OFFSET + 16))).toEqual('**FLASH*FAILED**');
    expect(memory.subarray(BB21.bootloader)).toEqual(bootloader);
  });

  it('should read an ESC left **FLASH*FAILED** and flash it again without forcing', async() => {
    let corrupt = true;
    simulate(fourWay, memory, { corrupt: (address) => corrupt && address === 0x0800 });
    expect(await fourWay.writeHex(0, esc, HEX, false, false, jest.fn())).toBeNull();

    // Read it like "Lire les paramètres" does
    const FourWay = require('../FourWay').default;
    const reader = new FourWay(jest.fn());
    simulate(reader, memory);
    delete reader.getInfo;
    const info = await reader.getInfo(0);
    // The card says **FLASH*FAILED**, the layout is still known
    expect(info.displayName).toEqual('**FLASH*FAILED**');
    expect(info.settings.LAYOUT.trim()).toEqual('#S_H_50#');

    // Flash again, layout case not ticked
    corrupt = false;
    const result = await fourWay.writeHex(0, {
      ...esc,
      ...info,
    }, HEX, false, false, jest.fn());
    expect(result).not.toBeNull();
    expect(memory.subarray(0, BB21.bootloader)).toEqual(image.subarray(0, BB21.bootloader));
  });

  it('should keep the bootloader jump when the first pages fail', async() => {
    // The writes of page 0 are damaged (step 4)
    simulate(fourWay, memory, { corrupt: (address) => address === 0x0000 });

    const result = await fourWay.writeHex(0, esc, HEX, false, false, jest.fn());

    expect(result).toBeNull();
    expect(ascii(memory.subarray(BB21.eeprom + NAME_OFFSET, BB21.eeprom + NAME_OFFSET + 16))).toEqual('**FLASH*FAILED**');
    expect(memory.subarray(BB21.bootloader)).toEqual(bootloader);
  });

  it('should stop when the safeguard can not be written', async() => {
    simulate(fourWay, memory, { corrupt: (address) => address === BB21.eeprom });

    const result = await fourWay.writeHex(0, esc, HEX, false, false, jest.fn());

    expect(result).toBeNull();
    // Nothing of the code was touched
    expect(fourWay.erasePage).not.toHaveBeenCalledWith(0x02);
    expect(fourWay.write).not.toHaveBeenCalledWith(0x200, expect.anything());
  });

  it('should stop when the bootloader jump can not be written', async() => {
    simulate(fourWay, memory, { corrupt: (address) => address === 0x200 });

    const result = await fourWay.writeHex(0, esc, HEX, false, false, jest.fn());

    expect(result).toBeNull();
    // Page 0 (the reset vector) was never erased
    expect(fourWay.erasePage).not.toHaveBeenCalledWith(0x00);
    expect(memory.subarray(0, 3)).toEqual(image.subarray(0, 3));
  });

  it('should refuse a file for another MCU before writing anything', async() => {
    simulate(fourWay, memory);
    // The ESC says it is another MCU
    memory.set(Uint8Array.from('#BLHELI$EFM8B10#', (c) => c.charCodeAt(0)), BB21.eeprom + 0x50);

    const result = await fourWay.writeHex(0, esc, HEX, true, false, jest.fn());

    expect(result).toBe(esc);
    expect(fourWay.logCallback).toHaveBeenCalledWith('escSettingsMcuMismatch', undefined);
    expect(fourWay.write).not.toHaveBeenCalled();
    expect(fourWay.erasePage).not.toHaveBeenCalled();
  });

  it('should refuse a file that is not a BLHeli_S / Bluejay firmware', async() => {
    simulate(fourWay, memory);
    const broken = HEX.replace(':060000000219FD02035984', ':060000000000FD0203597E');

    const result = await fourWay.writeHex(0, esc, broken, true, false, jest.fn());

    expect(result).toBeNull();
    expect(fourWay.write).not.toHaveBeenCalled();
    expect(fourWay.erasePage).not.toHaveBeenCalled();
  });
  it('should tell where a failed flash stopped', async() => {
    // Nothing written: invalid file
    simulate(fourWay, memory);
    const broken = HEX.replace(':060000000219FD02035984', ':060000000000FD0203597E');
    expect(await fourWay.writeHex(0, esc, broken, false, false, jest.fn())).toBeNull();
    expect(fourWay.lastFlashError).toEqual('check');

    // Failed while writing
    simulate(fourWay, memory, { corrupt: (address) => address === 0x0800 });
    expect(await fourWay.writeHex(0, esc, HEX, false, false, jest.fn())).toBeNull();
    expect(fourWay.lastFlashError).toEqual('write');

    // Firmware written, ESC not read back afterwards
    simulate(fourWay, memory);
    fourWay.getInfo = jest.fn(async() => {
      throw new Error('No answer');
    });
    expect(await fourWay.writeHex(0, esc, HEX, false, false, jest.fn())).toBeNull();
    expect(fourWay.lastFlashError).toEqual('settings');
    expect(memory.subarray(0, BB21.bootloader)).toEqual(image.subarray(0, BB21.bootloader));

    // Success clears it
    simulate(fourWay, memory);
    expect(await fourWay.writeHex(0, esc, HEX, false, false, jest.fn())).not.toBeNull();
    expect(fourWay.lastFlashError).toBeNull();
  });
  it('should keep the wait after the startup melody when migrating (essai TGE-P4)', async() => {
    const bluejayEeprom = require('../../sources/Bluejay/eeprom').default;
    const { MIGRATION } = require('../helpers/Settings');
    const melody = new Array(128).fill(0);
    melody.splice(0, 4, 2, 58, 4, 32);
    const settings = (wait) => ({
      MAIN_REVISION: 0,
      SUB_REVISION: 19,
      LAYOUT_REVISION: 206,
      MODE: 0x55AA,
      LAYOUT: '#J_H_40#',
      NAME: 'Bluejay',
      MOTOR_DIRECTION: 2,
      BEEP_STRENGTH: 40,
      STARTUP_MELODY: wait === 0 ? melody : new Array(128).fill(0xFF),
      STARTUP_MELODY_WAIT_MS: wait,
    });
    const oldEsc = {
      ...esc,
      layoutRevision: '206',
      settings: settings(0),
      individualSettings: { NAME: 'Bluejay' },
    };

    simulate(fourWay, memory);
    fourWay.getInfo = jest.fn(async() => ({
      index: 0,
      layout: bluejayEeprom.LAYOUT,
      layoutRevision: '206',
      settings: settings(0xFFFF),
      individualSettings: { NAME: 'Bluejay' },
    }));

    const result = await fourWay.writeHex(0, oldEsc, HEX, false, MIGRATION.SAME, jest.fn());

    expect(result).not.toBeNull();
    const written = fourWay.writeSettings.mock.calls[0][2];
    expect(written.STARTUP_MELODY_WAIT_MS).toEqual(0);
    expect(written.STARTUP_MELODY).toEqual(melody);
  });
});

/**
 * Power of the ESC cut during the flash (essai M6, 10/11/2026): from a given
 * bootloader command on, the ESC no longer answers. The real commands are
 * then sent, through the real retries, to a link that either times out or
 * never answers at all. The flash must be given up in less than 60 s, at
 * every step, and leave the ESC marked **FLASH*FAILED** when it got that far.
 */
describe('SiLabs flash with the ESC power cut', () => {
  const { TimeoutError } = require('../helpers/QueueProcessor');

  const run = async(cutAt, mode) => {
    jest.useFakeTimers('modern');
    const FourWay = require('../FourWay').default;
    const serial = jest.fn(() => new Promise((resolve, reject) => {
      if(mode === 'timeout') {
        setTimeout(() => reject(new TimeoutError('Timed out after 1000ms')), 1000);
      }
      // 'silent': never answers
    }));
    const fourWay = new FourWay(serial);

    const image = makeImage();
    const memory = new Uint8Array(BB21.size).fill(0xFF);
    memory.set(image.subarray(0, BB21.bootloader));
    simulate(fourWay, memory);

    // Up to cutAt commands the simulated ESC answers, then it is dead
    let count = 0;
    ['read', 'write', 'erasePage'].forEach((name) => {
      const alive = fourWay[name];
      fourWay[name] = (...args) => {
        count += 1;
        if(count <= cutAt) {
          return alive(...args);
        }

        return FourWay.prototype[name].apply(fourWay, args);
      };
    });

    const start = Date.now();
    let settled = false;
    let result;
    fourWay.writeHex(0, esc, HEX, false, false, jest.fn()).then((value) => {
      settled = true;
      result = value;
    });

    // Up to 90 s of simulated time, 250 ms at a time
    for(let i = 0; i < 360 && !settled; i += 1) {
      jest.advanceTimersByTime(250);
      for(let j = 0; j < 20; j += 1) {
        await Promise.resolve();
      }
    }

    const elapsed = Date.now() - start;
    jest.useRealTimers();

    return {
      settled,
      result,
      elapsed,
      fourWay,
      memory,
    };
  };

  // Cut points: step 1 (EEPROM safeguard), 2 (bootloader jump), 3 (code
  // pages: erase, write, verify), 4 (first pages), 5 (EEPROM section)
  [1, 4, 8, 20, 40, 60, 75, 85].forEach((cutAt) => {
    ['timeout', 'silent'].forEach((mode) => {
      it(`should give up within 60 s, cut after ${cutAt} commands (${mode})`, async() => {
        const outcome = await run(cutAt, mode);

        expect(outcome.settled).toBeTruthy();
        expect(outcome.result).toBeNull();
        expect(outcome.elapsed).toBeLessThan(60000);
        expect(outcome.fourWay.lastFlashError).toEqual('write');
      });
    });
  });
});

describe('SiLabs flash on a slow but healthy ESC', () => {
  it('should not be given up when every answer takes 900 ms', async() => {
    jest.useFakeTimers('modern');
    const FourWay = require('../FourWay').default;

    const image = makeImage();
    const memory = new Uint8Array(BB21.size).fill(0xFF);
    memory.set(image.subarray(0, BB21.bootloader));

    // Simulated bootloader behind the real 4-way commands, 900 ms per answer
    const serial = jest.fn((buffer) => new Promise((resolve) => {
      const view = new Uint8Array(buffer);
      const command = view[1];
      const address = (view[2] << 8) | view[3];
      const count = view[4] === 0 ? 256 : view[4];
      const params = view.slice(5, 5 + count);
      let answer = [0];

      if(command === 0x3a) {
        // cmd_DeviceRead
        const bytes = params[0] === 0 ? 256 : params[0];
        answer = memory.slice(address, address + bytes);
      } else if(command === 0x3b) {
        // cmd_DeviceWrite
        memory.set(params, address);
      } else if(command === 0x39) {
        // cmd_DevicePageErase
        const start = Math.floor((params[0] * 512) / BB21.hardwarePage) * BB21.hardwarePage;
        memory.fill(0xFF, start, start + BB21.hardwarePage);
      }

      setTimeout(() => resolve({
        command,
        address,
        ack: 0,
        params: answer,
      }), 900);
    }));

    const fourWay = new FourWay(serial);
    simulate(fourWay, memory);
    fourWay.read = FourWay.prototype.read;
    fourWay.write = FourWay.prototype.write;
    fourWay.erasePage = FourWay.prototype.erasePage;

    let settled = false;
    let result;
    fourWay.writeHex(0, esc, HEX, false, false, jest.fn()).then((value) => {
      settled = true;
      result = value;
    });

    // Up to 10 min of simulated time
    for(let i = 0; i < 2400 && !settled; i += 1) {
      jest.advanceTimersByTime(250);
      for(let j = 0; j < 20; j += 1) {
        await Promise.resolve();
      }
    }
    jest.useRealTimers();

    expect(settled).toBeTruthy();
    expect(result).not.toBeNull();
    expect(fourWay.logCallback).not.toHaveBeenCalledWith('flashingEscStalled', expect.anything());
    expect(memory.subarray(0, BB21.bootloader)).toEqual(image.subarray(0, BB21.bootloader));
  });
});
