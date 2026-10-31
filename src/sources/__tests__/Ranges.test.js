import am32Eeprom from '../AM32/eeprom';
import am32Settings from '../AM32/settings';
import blheliEeprom from '../Blheli/eeprom';
import blheliSettings from '../Blheli/settings';
import blheliSSettings from '../BlheliS/settings';
import bluejayEeprom from '../Bluejay/eeprom';
import bluejaySettings from '../Bluejay/settings';

import Convert from '../../utils/helpers/Convert';
import { ConversionError } from '../../utils/Errors';

/**
 * Every value a slider or an input can produce must fit in its EEPROM field,
 * otherwise it silently wraps around (for example 256 becomes 0).
 */
const SOURCES = [
  ['AM32', am32Settings, am32Eeprom],
  ['BLHeli', blheliSettings, blheliEeprom],
  ['BLHeli_S', blheliSSettings, blheliEeprom],
  ['Bluejay', bluejaySettings, bluejayEeprom],
];

function getDescriptions(settings) {
  const descriptions = [];
  ['COMMON', 'INDIVIDUAL'].forEach((kind) => {
    Object.entries(settings[kind]).forEach(([revision, layout]) => {
      const {
        base,
        overrides,
      } = layout;
      base.forEach((description) => descriptions.push([revision, description]));
      Object.values(overrides || {}).forEach((list) => {
        list.forEach((description) => descriptions.push([revision, description]));
      });
    });
  });

  return descriptions;
}

describe('Setting ranges', () => {
  SOURCES.forEach(([name, settings, eeprom]) => {
    it(`should keep every ${name} number setting inside its EEPROM field`, () => {
      const errors = [];
      getDescriptions(settings).forEach(([revision, description]) => {
        const field = eeprom.LAYOUT[description.name];
        if (description.type !== 'number' || !field) {
          return;
        }

        // Same conversion as the setting inputs
        const factor = description.factor || description.displayFactor || 1;
        const offset = description.offset || description.displayOffset || 0;
        const limit = 2 ** (8 * field.size) - 1;
        const rawMin = Math.floor((description.min - offset) / factor);
        const rawMax = Math.floor((description.max - offset) / factor);
        if (rawMin < 0 || rawMax > limit) {
          errors.push(`${revision} ${description.name}: ${rawMin}..${rawMax} > 0..${limit}`);
        }
      });

      expect(errors).toEqual([]);
    });

    it(`should keep every ${name} option inside its EEPROM field`, () => {
      const errors = [];
      getDescriptions(settings).forEach(([revision, description]) => {
        const field = eeprom.LAYOUT[description.name];
        if (description.type !== 'enum' || !field) {
          return;
        }

        const limit = 2 ** (8 * field.size) - 1;
        description.options.forEach(({ value }) => {
          const raw = parseInt(value, 10);
          if (!(raw >= 0 && raw <= limit)) {
            errors.push(`${revision} ${description.name}: ${value}`);
          }
        });
      });

      expect(errors).toEqual([]);
    });
  });

  it('should keep the AM32 servo neutral at most 1629 µs (255)', () => {
    const neutral = am32Settings.COMMON['1'].base.find((item) => item.name === 'SERVO_NEUTRAL');
    expect(neutral.max).toEqual(1629);
    expect(neutral.max - neutral.displayOffset).toEqual(255);
  });

  it('should refuse a value that does not fit instead of wrapping it', () => {
    const layout = { SERVO_NEUTRAL: am32Eeprom.LAYOUT.SERVO_NEUTRAL };
    const size = am32Eeprom.LAYOUT.SERVO_NEUTRAL.offset + 1;

    expect(() => Convert.objectToSettingsArray({ SERVO_NEUTRAL: 256 }, layout, size)).toThrow(ConversionError);
    expect(() => Convert.objectToSettingsArray({ SERVO_NEUTRAL: -1 }, layout, size)).toThrow(ConversionError);
    expect(Convert.objectToSettingsArray({ SERVO_NEUTRAL: 255 }, layout, size)[layout.SERVO_NEUTRAL.offset]).toEqual(255);
  });
});
