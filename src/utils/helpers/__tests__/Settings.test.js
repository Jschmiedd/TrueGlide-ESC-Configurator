import {
  getMasterSettings,
  getIndividualSettingsDescriptions,
  getIndividualSettings,
  canMigrate,
} from '../Settings';

import escs from './escs.json';
import { source as bluejaySource } from '../../../sources/Bluejay';
import { source as am32Source } from '../../../sources/AM32';
import { getSource } from '../General';

const AM32_SETTINGS_DESCRIPTIONS = am32Source.getSettingsDescriptions();
const BLUEJAY_SETTINGS_DESCRIPTIONS = bluejaySource.getSettingsDescriptions();

test('get master settings object', () => {
  const settings = getMasterSettings(escs);
  const keys = Object.keys(settings);

  expect(settings).not.toEqual({});
  expect(keys.length).toEqual(43);
});

test('get master settings object for empty array', () => {
  const settings = getMasterSettings([]);

  expect(settings).toEqual({});
});

test('get individual setting descriptions', () => {
  const settings = getIndividualSettingsDescriptions(escs[0]);

  expect(settings).not.toEqual([]);
  expect(settings.length).toEqual(8);
});

test('get individual setting descriptions with empty object', () => {
  const settings = getIndividualSettingsDescriptions({});

  expect(settings).toEqual([]);
});

test('get individual setting descriptions with unsupported firmware', () => {
  const settings = getIndividualSettingsDescriptions({
    firmwareName: 'unsupported',
    layoutRevision: 1234,
  });

  expect(settings).toEqual([]);
});


test('get individual settings', () => {
  const settings = getIndividualSettings(escs[0]);
  const keys = Object.keys(settings);

  expect(settings).not.toEqual({});
  expect(keys.length).toEqual(8);
});

test('get individual settings with empty object', () => {
  const settings = getIndividualSettings({});

  expect(settings).toEqual({});
});

test('can migrate empty settings', () => {
  const result = canMigrate('INVALID', {}, {}, {}, {});

  expect(result).not.toBeTruthy();
});

test('can migrate wrong modes', () => {
  const result = canMigrate('INVALID', { MODE: 1 }, { MODE: 2 }, {}, {});

  expect(result).not.toBeTruthy();
});

test('can migrate invalid setting', () => {
  const esc = escs[1];
  const source = getSource(esc.firmwareName);
  const settingsDescriptions = source.getCommonSettings(esc.layoutRevision);
  const individualSettingsDescriptions = source.getIndividualSettings(esc.layoutRevision);

  const result = canMigrate('INVALID', escs[0], escs[1], settingsDescriptions, individualSettingsDescriptions);

  expect(result).not.toBeTruthy();
});

test('can migrate valid setting', () => {
  const settingsDescriptions = BLUEJAY_SETTINGS_DESCRIPTIONS.COMMON;
  const individualSettingsDescriptions = BLUEJAY_SETTINGS_DESCRIPTIONS.INDIVIDUAL;
  const result = canMigrate('MOTOR_DIRECTION', escs[0].settings, escs[1].settings, settingsDescriptions, individualSettingsDescriptions);

  expect(result).toBeTruthy();
});

test('can migrate from different platforms', () => {
  const settingsDescriptions = AM32_SETTINGS_DESCRIPTIONS.COMMON;
  const individualSettingsDescriptions = AM32_SETTINGS_DESCRIPTIONS.INDIVIDUAL;
  const result = canMigrate('MOTOR_DIRECTION', escs[0].settings, escs[1].settings, settingsDescriptions, individualSettingsDescriptions);

  expect(result).not.toBeTruthy();
});

test('no multi valid', () => {
  const settingsDescriptions = {
    1: {
      base: [
        { name: 'MOTOR_DIRECTION' },
      ],
    },
    2: {
      base: [
        { name: 'MOTOR_DIRECTION' },
      ],
    },
  };

  const individualSettingsDescriptions = {
    1: {},
    2: {},
  };

  const from = {
    MODE: 1,
    LAYOUT_REVISION: 1,
  };

  const to = {
    MODE: 1,
    LAYOUT_REVISION: 2,
  };

  const result = canMigrate('MOTOR_DIRECTION', from, to, settingsDescriptions, individualSettingsDescriptions);
  expect(result).toBeTruthy();
});

test('no multi invalid', () => {
  const settingsDescriptions = {
    1: {
      base: [
        { name: 'MOTOR_DIRECTION' },
      ],
    },
    2: {},
  };

  const individualSettingsDescriptions = {
    1: {},
    2: {},
  };

  const from = {
    MODE: 1,
    LAYOUT_REVISION: 1,
  };

  const to = {
    MODE: 1,
    LAYOUT_REVISION: 2,
  };

  const result = canMigrate('MOTOR_DIRECTION', from, to, settingsDescriptions, individualSettingsDescriptions);
  expect(result).toBeFalsy();
});

test('individual settings valid', () => {
  const settingsDescriptions = {
    1: { base: [] },
    2: { base: [] },
  };

  const individualSettingsDescriptions = {
    1: {
      base: [
        { name: 'MOTOR_DIRECTION' },
      ],
    },
    2: {
      base: [
        { name: 'MOTOR_DIRECTION' },
      ],
    },
  };
  const from = {
    MODE: 1,
    LAYOUT_REVISION: 1,
  };

  const to = {
    MODE: 1,
    LAYOUT_REVISION: 2,
  };

  const result = canMigrate('MOTOR_DIRECTION', from, to, settingsDescriptions, individualSettingsDescriptions);
  expect(result).toBeTruthy();
});

test('individual settings invalid', () => {
  const settingsDescriptions = {
    1: { base: [] },
    2: { base: [] },
  };

  const individualSettingsDescriptions = {
    1: {
      base: [
        { name: 'MOTOR_DIRECTION' },
      ],
    },
    2: { base: [] },
  };
  const from = {
    MODE: 1,
    LAYOUT_REVISION: 1,
  };

  const to = {
    MODE: 1,
    LAYOUT_REVISION: 2,
  };

  const result = canMigrate('MOTOR_DIRECTION', from, to, settingsDescriptions, individualSettingsDescriptions);
  expect(result).toBeFalsy();
});

describe('isFlashFailed', () => {
  it('should only flag an ESC marked **FLASH*FAILED**', () => {
    const { isFlashFailed } = require('../Settings');
    expect(isFlashFailed({ settings: { NAME: '**FLASH*FAILED**' } })).toBeTruthy();
    expect(isFlashFailed({ settings: { NAME: 'Bluejay' } })).toBeFalsy();
    expect(isFlashFailed({})).toBeFalsy();
    expect(isFlashFailed(null)).toBeFalsy();
  });

  it('should flag an AM32 ESC its bootloader will not start, whatever its layout', () => {
    const {
      isFlashFailed, isBootBlocked,
    } = require('../Settings');
    const am32 = (BOOT_BYTE, LAYOUT_REVISION) => ({
      firmwareName: 'AM32',
      settings: {
        BOOT_BYTE,
        LAYOUT_REVISION,
      },
    });

    [0x00, 0x05, 0xFF].forEach((value) => {
      expect(isBootBlocked(am32(value, 4))).toBeTruthy();
      expect(isFlashFailed(am32(value, 4))).toBeTruthy();
      expect(isFlashFailed(am32(value, 2))).toBeTruthy();
    });
    [0, 1, 2, 4].forEach((layout) => expect(isFlashFailed(am32(0x01, layout))).toBeFalsy());
    expect(isFlashFailed(am32(undefined, 4))).toBeFalsy();
    expect(isFlashFailed({
      firmwareName: 'Bluejay',
      settings: { BOOT_BYTE: 0 },
    })).toBeFalsy();
  });
});

describe('getMaster with an ESC in FLASH*FAILED', () => {
  const esc = (name, beep) => ({
    meta: { available: true },
    settings: {
      NAME: name,
      BEEP_STRENGTH: beep,
    },
  });

  it('should take the first healthy ESC', () => {
    const { getMasterSettings } = require('../Settings');
    const master = getMasterSettings([
      esc('**FLASH*FAILED**', 10),
      esc('Bluejay', 77),
      esc('Bluejay', 40),
    ]);

    expect(master.BEEP_STRENGTH).toEqual(77);
  });

  it('should copy nothing when no ESC is healthy', () => {
    const { getMasterSettings } = require('../Settings');
    expect(getMasterSettings([esc('**FLASH*FAILED**', 10)])).toEqual({});
  });
});

describe('AM32 ESC whose layout is not described', () => {
  const am32 = (layoutRevision, beep) => ({
    firmwareName: 'AM32',
    layoutRevision,
    meta: { available: true },
    settings: { BEEP_VOLUME: beep },
  });

  it('should only flag an AM32 layout revision that is not described', () => {
    const { isLayoutNotDescribed } = require('../Settings');
    expect(isLayoutNotDescribed(am32('3', 5))).toBeTruthy();
    expect(isLayoutNotDescribed(am32('255', 5))).toBeTruthy();
    expect(isLayoutNotDescribed(am32('2', 5))).toBeFalsy();
    expect(isLayoutNotDescribed(am32(undefined, 5))).toBeFalsy();
    expect(isLayoutNotDescribed({
      firmwareName: 'Bluejay',
      layoutRevision: '3',
    })).toBeFalsy();
    expect(isLayoutNotDescribed(null)).toBeFalsy();
  });

  it('should never take the common settings from it when another ESC is healthy', () => {
    const { getMasterSettings } = require('../Settings');
    expect(getMasterSettings([am32('3', 1), am32('2', 7)]).BEEP_VOLUME).toEqual(7);
    expect(getMasterSettings([am32('3', 1)]).BEEP_VOLUME).toEqual(1);
  });
});
