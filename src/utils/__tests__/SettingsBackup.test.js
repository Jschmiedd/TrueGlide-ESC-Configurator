import {
  backupFileName,
  buildBackup,
  downloadBackup,
  getRestoredSettings,
  parseBackup,
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
    expect(backup.version).toEqual(1);
    expect(backup.date).toEqual('2026-11-06T10:00:00.000Z');
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
      version: 2,
    }))).toThrow();
    expect(() => parseBackup(JSON.stringify({
      ...backup,
      escs: null,
    }))).toThrow();
  });

  it('should restore the saved settings on the same ESC only', () => {
    const backup = buildBackup([bluejay(0, { BEEP_STRENGTH: 60 }), bluejay(1, { MOTOR_DIRECTION: 1 })]);

    // After a flash with factory settings and a newer version
    const esc0 = bluejay(0, {
      BEEP_STRENGTH: 40,
      SUB_REVISION: 20,
    });
    const restored = getRestoredSettings(esc0, backup);
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
});
