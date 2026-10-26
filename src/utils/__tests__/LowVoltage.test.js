import am32Eeprom from '../../sources/AM32/eeprom';
import blheliEeprom from '../../sources/Blheli/eeprom';
import bluejayEeprom from '../../sources/Bluejay/eeprom';

import {
  disableLowVoltageCut,
  isLowVoltageCutActive,
} from '../LowVoltage';

const am32 = {
  layout: am32Eeprom.LAYOUT,
  layoutRevision: '2',
  settings: { LOW_VOLTAGE_CUTOFF: 1 },
};

describe('LowVoltage', () => {
  it('should detect an enabled AM32 cutoff', () => {
    expect(isLowVoltageCutActive(am32)).toBeTruthy();
    expect(isLowVoltageCutActive(am32, { LOW_VOLTAGE_CUTOFF: 0 })).toBeFalsy();
  });

  it('should always disable the AM32 cutoff', () => {
    const result = disableLowVoltageCut(am32, {
      LOW_VOLTAGE_CUTOFF: 1,
      BEEP_VOLUME: 5,
    });
    expect(result.changed).toBeTruthy();
    expect(result.settings).toEqual({
      LOW_VOLTAGE_CUTOFF: 0,
      BEEP_VOLUME: 5,
    });

    const unchanged = { LOW_VOLTAGE_CUTOFF: 0 };
    expect(disableLowVoltageCut(am32, unchanged)).toEqual({
      settings: unchanged,
      changed: false,
    });
  });

  it('should set the BLHeli revision 19 limit to Off', () => {
    const blheli = {
      layout: blheliEeprom.LAYOUT,
      layoutRevision: '19',
    };
    expect(disableLowVoltageCut(blheli, { LOW_VOLTAGE_LIMIT: '3' }).settings.LOW_VOLTAGE_LIMIT).toEqual(1);
    expect(disableLowVoltageCut(blheli, { LOW_VOLTAGE_LIMIT: 1 }).changed).toBeFalsy();
  });

  it('should not touch BLHeli_S or Bluejay', () => {
    const blheliS = {
      layout: blheliEeprom.LAYOUT,
      layoutRevision: '33',
    };
    expect(disableLowVoltageCut(blheliS, { LOW_VOLTAGE_LIMIT: 3 }).changed).toBeFalsy();

    const bluejay = {
      layout: bluejayEeprom.LAYOUT,
      layoutRevision: '207',
    };
    expect(isLowVoltageCutActive(bluejay, { LOW_VOLTAGE_CUTOFF: 1 })).toBeFalsy();
  });
});
