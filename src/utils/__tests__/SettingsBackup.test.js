import {
  backupFileName,
  buildBackup,
  downloadBackup,
  getBackupCount,
  getMismatchedSettings,
  getRestoredSettings,
  getSettingChanges,
  isSameCount,
  isSameSettings,
  parseBackup,
  withSavedTypes,
} from '../SettingsBackup';

const bluejay = (index, settings = {}) => ({
  index,
  firmwareName: 'Bluejay',
  displayName: 'J-H-40 - Bluejay, 0.19, 24kHz',
  layoutRevision: '208',
  settings: {
    NAME: 'Bluejay',
    LAYOUT: '#J_H_40#',
    MAIN_REVISION: 0,
    SUB_REVISION: 19,
    BEEP_STRENGTH: 40,
    MOTOR_DIRECTION: 2,
    ...settings,
  },
});

describe('SettingsBackup', () => {
  it('should save the settings of each readable ESC, never BLHeli_32', () => {
    const blheli32 = {
      index: 2,
      firmwareName: 'BLHeli_32',
      settings: { NAME: 'BLHeli_32' },
    };
    const date = new Date('2026-11-06T10:00:00Z');
    const backup = buildBackup([bluejay(0), bluejay(1), blheli32, null], date);

    expect(backup.format).toEqual('trueglide-esc-reglages');
    expect(backup.version).toEqual(2);
    expect(backup.date).toEqual('2026-11-06T10:00:00.000Z');
    expect(backup.count).toEqual(3);
    expect(backup.escs.map((esc) => esc.index)).toEqual([0, 1]);
    expect(backup.escs[0].settings.BEEP_STRENGTH).toEqual(40);
  });

  it('should name the file with the date', () => {
    const name = backupFileName(new Date(2026, 10, 6, 9, 5, 3));
    expect(name).toEqual('trueglide-esc-reglages_2026-11-06_09-05-03.json');
  });

  it('should read back only its own files', () => {
    const backup = buildBackup([bluejay(0)]);
    expect(parseBackup(JSON.stringify(backup)).escs).toHaveLength(1);

    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup('{}')).toThrow();
    expect(() => parseBackup(JSON.stringify({
      ...backup,
      version: 3,
    }))).toThrow();
    expect(() => parseBackup(JSON.stringify({
      ...backup,
      escs: null,
    }))).toThrow();
  });

  it('should restore the saved settings on the same ESC only', () => {
    const backup = buildBackup([bluejay(0, { BEEP_STRENGTH: 60 }), bluejay(1, { MOTOR_DIRECTION: 1 })]);

    // The copy kept in memory during a flash, after a flash with factory
    // settings and a newer version
    const esc0 = bluejay(0, {
      BEEP_STRENGTH: 40,
      SUB_REVISION: 20,
    });
    const restored = getRestoredSettings(esc0, backup, [], true);
    expect(restored.BEEP_STRENGTH).toEqual(60);
    expect(restored.MOTOR_DIRECTION).toEqual(2);
    // Firmware values are never taken from the file
    expect(restored.SUB_REVISION).toEqual(20);

    const esc1 = getRestoredSettings(bluejay(1), backup);
    expect(esc1.MOTOR_DIRECTION).toEqual(1);
    expect(esc1.BEEP_STRENGTH).toEqual(40);
  });

  it('should refuse a backup of another firmware, layout or position', () => {
    const backup = buildBackup([bluejay(0, { BEEP_STRENGTH: 60 })]);

    expect(getRestoredSettings(bluejay(1), backup)).toBeNull();
    expect(getRestoredSettings(bluejay(0, { LAYOUT: '#A_H_5#' }), backup)).toBeNull();
    expect(getRestoredSettings({
      ...bluejay(0),
      layoutRevision: '207',
    }, backup)).toBeNull();
    expect(getRestoredSettings({
      ...bluejay(0),
      firmwareName: 'BLHeli_S',
    }, backup)).toBeNull();
    expect(getRestoredSettings({
      index: 0,
      firmwareName: 'BLHeli_32',
      settings: { NAME: 'BLHeli_32' },
    }, backup)).toBeNull();
    expect(getRestoredSettings(null, backup)).toBeNull();
  });

  it('should ignore values of the wrong type and unknown settings', () => {
    const backup = buildBackup([bluejay(0)]);
    backup.escs[0].settings.BEEP_STRENGTH = '255';
    backup.escs[0].settings.UNKNOWN = 3;

    const restored = getRestoredSettings(bluejay(0), backup);
    expect(restored.BEEP_STRENGTH).toEqual(40);
    expect(restored.UNKNOWN).toBeUndefined();
  });

  it('should keep the screen bounds when restoring', () => {
    const current = bluejay(0, {
      STARTUP_POWER_MIN: 51,
      STARTUP_MELODY: new Array(128).fill(0),
      STARTUP_MELODY_WAIT_MS: 0,
      MODE: 0x55AA,
    });
    const saved = bluejay(0, {
      BEEP_STRENGTH: 300,
      MOTOR_DIRECTION: 7,
      STARTUP_POWER_MIN: 60,
      STARTUP_MELODY: new Array(128).fill(7),
      STARTUP_MELODY_WAIT_MS: 1200,
      MODE: 0x1234,
    });
    const backup = buildBackup([saved]);

    const rejected = [];
    const restored = getRestoredSettings(current, backup, rejected);

    // Out of bounds: the ESC keeps its values, and the log names them
    expect(restored.BEEP_STRENGTH).toEqual(40);
    expect(restored.MOTOR_DIRECTION).toEqual(2);
    expect(rejected.sort()).toEqual(['BEEP_STRENGTH', 'MOTOR_DIRECTION']);

    // Within bounds
    expect(restored.STARTUP_POWER_MIN).toEqual(60);
    expect(restored.STARTUP_MELODY[0]).toEqual(7);
    expect(restored.STARTUP_MELODY_WAIT_MS).toEqual(1200);

    // Not offered on the screen: never taken from the file
    expect(restored.MODE).toEqual(0x55AA);
  });

  it('should refuse a melody of the wrong size', () => {
    const current = bluejay(0, { STARTUP_MELODY: new Array(128).fill(0) });
    const backup = buildBackup([bluejay(0, { STARTUP_MELODY: new Array(10).fill(7) })]);

    const rejected = [];
    expect(getRestoredSettings(current, backup, rejected).STARTUP_MELODY[0]).toEqual(0);
    expect(rejected).toEqual(['STARTUP_MELODY']);
  });

  it('should offer the file as a download when the browser can', () => {
    const backup = buildBackup([bluejay(0)]);

    const createObjectURL = URL.createObjectURL;
    const revokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = undefined;
    expect(downloadBackup(backup, 'a.json')).toBeFalsy();

    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    expect(downloadBackup(backup, 'a.json')).toBeTruthy();
    expect(click).toHaveBeenCalled();

    click.mockRestore();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it('should refuse a file of another firmware version', () => {
    const backup = buildBackup([bluejay(0, { BEEP_STRENGTH: 60 })]);
    // The file says where it comes from: never an authorisation
    backup.origin = 'flash';

    expect(getRestoredSettings(bluejay(0, { SUB_REVISION: 20 }), backup)).toBeNull();
    expect(getRestoredSettings(bluejay(0, { MAIN_REVISION: 1 }), backup)).toBeNull();
    expect(getRestoredSettings(bluejay(0), backup).BEEP_STRENGTH).toEqual(60);
  });

  it('should leave a setting described otherwise by the new version', () => {
    const saved = {
      ...bluejay(0, {
        SUB_REVISION: 21,
        PWM_FREQUENCY: 48,
        BEEP_STRENGTH: 60,
      }),
      layoutRevision: '208',
    };
    const current = {
      ...bluejay(0, {
        SUB_REVISION: 22,
        PWM_FREQUENCY: 24,
      }),
      layoutRevision: '209',
    };

    const rejected = [];
    const restored = getRestoredSettings(current, buildBackup([saved]), rejected, true);
    expect(restored.BEEP_STRENGTH).toEqual(60);
    expect(restored.PWM_FREQUENCY).toEqual(24);
    expect(rejected).toEqual(['PWM_FREQUENCY']);
  });

  it('should keep the number of ESCs, also for the first files', () => {
    const backup = buildBackup([bluejay(0), bluejay(1), bluejay(2), bluejay(3)]);
    expect(getBackupCount(backup)).toEqual(4);

    const first = {
      ...backup,
      version: 1,
    };
    delete first.count;
    expect(getBackupCount(parseBackup(JSON.stringify(first)))).toEqual(4);
  });

  it('should refuse a damaged or incomplete file', () => {
    const backup = buildBackup([bluejay(0)]);
    const text = JSON.stringify(backup);

    expect(() => parseBackup(text.slice(0, text.length / 2))).toThrow();
    ['index', 'firmwareName', 'layoutRevision', 'settings'].forEach((key) => {
      const damaged = JSON.parse(text);
      delete damaged.escs[0][key];
      expect(() => parseBackup(JSON.stringify(damaged))).toThrow();
    });
    const nullEsc = JSON.parse(text);
    nullEsc.escs.push(null);
    expect(() => parseBackup(JSON.stringify(nullEsc))).toThrow();
  });

  it('should keep no unique identifier of the board or the ESC', () => {
    const esc = {
      ...bluejay(0),
      meta: {
        signature: 0xE8B2,
        input: 'PB4',
      },
      bootloader: { revision: 6 },
      uid: [1, 2, 3],
    };
    const text = JSON.stringify(buildBackup([esc]));

    expect(text).not.toMatch(/uid|signature|serial|mcu_id|bootloader/i);
  });

  it('should compare the number of ESCs read with the backup', () => {
    const backup = buildBackup([bluejay(0), bluejay(1)]);

    expect(isSameCount(backup, [bluejay(0), bluejay(1)])).toBeTruthy();
    expect(isSameCount(backup, [bluejay(0)])).toBeFalsy();
    expect(isSameCount(backup, [bluejay(0), null])).toBeFalsy();
    expect(isSameCount(backup, [bluejay(0), bluejay(1), bluejay(2)])).toBeFalsy();
  });

  it('should take nothing from a version it does not know', () => {
    const saved = {
      ...bluejay(0, {
        SUB_REVISION: 99,
        BEEP_STRENGTH: 60,
        MOTOR_DIRECTION: 1,
      }),
      layoutRevision: '299',
    };
    const current = bluejay(0);

    const rejected = [];
    const restored = getRestoredSettings(current, buildBackup([saved]), rejected, true);
    expect(restored).toEqual(current.settings);
    expect(rejected).toEqual(expect.arrayContaining(['BEEP_STRENGTH', 'MOTOR_DIRECTION']));
  });

  it('should list each setting that changes, with its label', () => {
    const before = bluejay(0).settings;
    const after = {
      ...before,
      BEEP_STRENGTH: 60,
      STARTUP_MELODY: [1, 2],
    };

    const changes = getSettingChanges(bluejay(0), before, after);
    expect(changes).toEqual([
      {
        name: 'BEEP_STRENGTH',
        label: 'escBeepStrength',
        before: 40,
        after: 60,
      },
      {
        name: 'STARTUP_MELODY',
        label: 'STARTUP_MELODY',
        before: undefined,
        after: [1, 2],
      },
    ]);
    expect(getSettingChanges(bluejay(0), before, { ...before })).toEqual([]);
  });

  it('should name the settings not read back as written', () => {
    const written = {
      ...bluejay(0).settings,
      BEEP_STRENGTH: 60,
      STARTUP_MELODY: [1, 2],
      UNKNOWN: 5,
    };
    const read = {
      ...written,
      BEEP_STRENGTH: 40,
      STARTUP_MELODY: [1, 3],
      UNKNOWN: 6,
    };

    expect(getMismatchedSettings(bluejay(0), written, read)).toEqual(['BEEP_STRENGTH', 'STARTUP_MELODY']);
    expect(getMismatchedSettings(bluejay(0), written, { ...written })).toEqual([]);
  });

  it('should show the label of the option for a setting chosen in a list', () => {
    const before = bluejay(0).settings;
    const after = {
      ...before,
      MOTOR_DIRECTION: 1,
    };

    expect(getSettingChanges(bluejay(0), before, after)).toEqual([{
      name: 'MOTOR_DIRECTION',
      label: 'escMotorDirection',
      before: 'Reversed',
      after: 'Normal',
    }]);
  });

  it('should write nothing to an ESC whose flash failed', () => {
    const backup = buildBackup([bluejay(0, { BEEP_STRENGTH: 60 })]);
    const failed = bluejay(0, { NAME: '**FLASH*FAILED**' });

    expect(getRestoredSettings(failed, backup)).toBeNull();
    expect(getRestoredSettings(failed, backup, [], true)).toBeNull();
  });

  it('should take a value chosen in a list (text) as the same value as in the ESC', () => {
    const inEsc = bluejay(0).settings;
    const fromScreen = {
      ...inEsc,
      MOTOR_DIRECTION: '2',
      BEEP_STRENGTH: '40',
    };

    expect(getMismatchedSettings(bluejay(0), fromScreen, inEsc)).toEqual([]);
    expect(getSettingChanges(bluejay(0), inEsc, fromScreen)).toEqual([]);
    expect(isSameSettings(fromScreen, inEsc)).toBeTruthy();
    expect(isSameSettings({ STARTUP_MELODY: [1, 2] }, { STARTUP_MELODY: [1, 3] })).toBeFalsy();

    const saved = withSavedTypes({
      ...fromScreen,
      NAME: 'Bluejay',
      EMPTY: '',
    }, {
      ...inEsc,
      EMPTY: 0,
    });
    expect(saved.MOTOR_DIRECTION).toEqual(2);
    expect(saved.BEEP_STRENGTH).toEqual(40);
    expect(saved.NAME).toEqual('Bluejay');
    expect(saved.EMPTY).toEqual('');
  });

  it('should refuse a layout revision that is not a number', () => {
    const backup = buildBackup([bluejay(0)]);
    ['constructor', 'toString', '__proto__', '20a', ''].forEach((revision) => {
      const forged = JSON.parse(JSON.stringify(backup));
      forged.escs[0].layoutRevision = revision;
      expect(() => parseBackup(JSON.stringify(forged))).toThrow();
    });
  });
});

describe('SettingsBackup with an AM32 layout that is not described', () => {
  it('should write nothing back to it, not even the melody', () => {
    const am32 = {
      index: 0,
      firmwareName: 'AM32',
      layoutRevision: '3',
      settings: {
        LAYOUT: 'AM32',
        MAIN_REVISION: 2,
        SUB_REVISION: 20,
        BEEP_VOLUME: 5,
        STARTUP_MELODY: [1, 2, 3],
      },
    };
    const backup = buildBackup([{
      ...am32,
      settings: {
        ...am32.settings,
        STARTUP_MELODY: [4, 5, 6],
      },
    }]);

    expect(getRestoredSettings(am32, backup)).toBeNull();
    expect(getRestoredSettings(am32, backup, [], true)).toBeNull();
  });
});
