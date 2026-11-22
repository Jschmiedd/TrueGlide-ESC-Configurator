import { source } from '../';
import eeprom from '../eeprom';
import Convert from '../../../utils/helpers/Convert';
import { isLayoutNotDescribed } from '../../../utils/helpers/Settings';
import layout4Image from './layout4';

const {
  LAYOUT: LAYOUT_4,
  LAYOUT_SIZE: LAYOUT_4_SIZE,
} = eeprom.LAYOUTS[4];

const names = (revision) => source.getCommonSettings(revision).base.map((setting) => setting.name);
const setting = (name) => source.getCommonSettings('4').base.find((item) => item.name === name);

describe('AM32 EEPROM layout 4', () => {
  it('should give back the same 192 bytes from the settings it reads', () => {
    const image = layout4Image();
    const settings = Convert.arrayToSettingsObject(image, LAYOUT_4);
    const written = Convert.objectToSettingsArray(settings, LAYOUT_4, LAYOUT_4_SIZE, Array.from(image));

    expect(LAYOUT_4_SIZE).toEqual(192);
    expect(Array.from(written)).toEqual(Array.from(image));
  });

  it('should read each setting at its byte of the firmware EEprom_t', () => {
    const settings = Convert.arrayToSettingsObject(layout4Image(), LAYOUT_4);

    expect(settings).toEqual(expect.objectContaining({
      LAYOUT_REVISION: 4,
      MAIN_REVISION: 2,
      SUB_REVISION: 22,
      MAX_RAMP: 0xA0,
      MINIMUM_DUTY_CYCLE: 4,
      DISABLE_STICK_CALIBRATION: 0,
      ABSOLUTE_VOLTAGE_CUTOFF: 10,
      CURRENT_P: 100,
      CURRENT_I: 1,
      CURRENT_D: 50,
      ACTIVE_BRAKE_POWER: 2,
      BRAKE_ON_ZERO_THROTTLE: 2,
      DEMAG_COMPENSATION: 3,
      MOTOR_DIRECTION: 0,
      TIMING_ADVANCE: 26,
      PWM_FREQUENCY: 24,
      MOTOR_POLES: 14,
      BRAKE_ON_STOP: 2,
      SERVO_LOW_THRESHOLD: 0x80,
      SERVO_DEAD_BAND: 50,
      LOW_VOLTAGE_CUTOFF: 0,
      LOW_VOLTAGE_THRESHOLD: 50,
      TEMPERATURE_LIMIT: 255,
      SINE_MODE_POWER: 6,
      ESC_PROTOCOL: 0,
      AUTO_ADVANCE: 1,
    }));
    expect(settings.NAME).toBeUndefined();
    expect(settings.STARTUP_MELODY).toHaveLength(128);
  });

  it('should only change the bytes of the settings changed, CAN block untouched', () => {
    const image = layout4Image();
    const settings = {
      ...Convert.arrayToSettingsObject(image, LAYOUT_4),
      BEEP_VOLUME: 9,
      DEMAG_COMPENSATION: 1,
    };
    const written = Convert.objectToSettingsArray(settings, LAYOUT_4, LAYOUT_4_SIZE, Array.from(image));

    const changed = Array.from(written).map((byte, i) => i).filter((i) => written[i] !== image[i]);
    expect(changed).toEqual([14, 30]);
    expect(Array.from(written.subarray(0xB0))).toEqual(Array.from(image.subarray(0xB0)));
  });

  it('should describe layout 4, and nothing that could not be checked', () => {
    expect(isLayoutNotDescribed({
      firmwareName: 'AM32',
      layoutRevision: '4',
    })).toBeFalsy();
    expect(isLayoutNotDescribed({
      firmwareName: 'AM32',
      layoutRevision: '3',
    })).toBeTruthy();

    const described = names('4');
    expect(described).toEqual(expect.arrayContaining([
      'AUTO_ADVANCE',
      'CURRENT_D',
      'CURRENT_I',
      'CURRENT_P',
      'DEMAG_COMPENSATION',
      'DISABLE_STICK_CALIBRATION',
    ]));
    [
      'ABSOLUTE_VOLTAGE_CUTOFF',
      'ACTIVE_BRAKE_POWER',
      'BRAKE_ON_ZERO_THROTTLE',
      'LOW_VOLTAGE_CUTOFF',
      'LOW_VOLTAGE_THRESHOLD',
      'MAX_RAMP',
      'MINIMUM_DUTY_CYCLE',
      'TIMING_ADVANCE',
    ].forEach((name) => expect(described).not.toContain(name));
    expect(new Set(described).size).toEqual(described.length);
    described.forEach((name) => expect(LAYOUT_4[name]).toBeDefined());
  });

  it('should take the bounds and values of the firmware', () => {
    const values = (name) => setting(name).options.map((option) => option.value);
    expect(values('VARIABLE_PWM_FREQUENCY')).toEqual([0, 1, 2]);
    expect(values('BRAKE_ON_STOP')).toEqual([0, 1, 2]);
    expect(values('DEMAG_COMPENSATION')).toEqual([0, 1, 2, 3, 4]);
    expect(values('ESC_PROTOCOL')).toEqual([0, 1, 2, 3, 4]);
    expect(setting('PWM_FREQUENCY')).toEqual(expect.objectContaining({
      min: 8,
      max: 144,
    }));
    expect(setting('CURRENT_P')).toEqual(expect.objectContaining({
      min: 0,
      max: 510,
      displayFactor: 2,
    }));
  });

  it('should only show the demag compensation from firmware 2.22 on', () => {
    const { visibleIf } = setting('DEMAG_COMPENSATION');
    expect(visibleIf({
      MAIN_REVISION: 2,
      SUB_REVISION: 21,
    })).toBeFalsy();
    expect(visibleIf({
      MAIN_REVISION: 2,
      SUB_REVISION: 22,
    })).toBeTruthy();
    expect(visibleIf({
      MAIN_REVISION: 3,
      SUB_REVISION: 0,
    })).toBeTruthy();
  });

  it('should show the PWM frequency unless it is set by RPM', () => {
    const { visibleIf } = setting('PWM_FREQUENCY');
    expect(visibleIf({ VARIABLE_PWM_FREQUENCY: 0 })).toBeTruthy();
    expect(visibleIf({ VARIABLE_PWM_FREQUENCY: '1' })).toBeTruthy();
    expect(visibleIf({ VARIABLE_PWM_FREQUENCY: 2 })).toBeFalsy();
  });
});
