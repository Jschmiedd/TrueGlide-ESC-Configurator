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
});
