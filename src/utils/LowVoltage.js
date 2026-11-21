/**
 * TrueGlide rule: an ESC must never cut or reduce motor power in flight
 * because of a low battery. The flight controller warns the pilot instead
 * (OSD, beeper) and blocks arming on the ground.
 *
 * - AM32: LOW_VOLTAGE_CUTOFF is always written as 0 (disabled).
 * - BLHeli (layout revision 19): LOW_VOLTAGE_LIMIT is always written as 1 (Off).
 */
import am32Eeprom from '../sources/AM32/eeprom';
import blheliEeprom from '../sources/Blheli/eeprom';

const RULES = [
  {
    matches: (esc) => esc.layout === am32Eeprom.LAYOUT,
    name: 'LOW_VOLTAGE_CUTOFF',
    off: 0,
  },
  {
    matches: (esc) => esc.layout === blheliEeprom.LAYOUT && esc.layoutRevision === '19',
    name: 'LOW_VOLTAGE_LIMIT',
    off: 1,
  },
];

// The values of these settings, as the screens of the firmware name them
const VALUE_TEXTS = {
  LOW_VOLTAGE_CUTOFF: {
    0: 'Off',
    1: 'On',
  },
  LOW_VOLTAGE_LIMIT: {
    1: 'Off',
    2: '3.0V/c',
    3: '3.1V/c',
    4: '3.2V/c',
    5: '3.3V/c',
    6: '3.4V/c',
  },
};

/**
 * Text of a low voltage cut value, or the value itself when it is not known.
 */
function getLowVoltageText(name, value) {
  const texts = VALUE_TEXTS[name];
  if(texts && texts[value] !== undefined) {
    return texts[value];
  }

  return value;
}

function getRule(esc) {
  return RULES.find((rule) => rule.matches(esc)) || null;
}

function isLowVoltageCutActive(esc, settings = esc.settings) {
  const rule = getRule(esc);
  if(!rule || !settings || settings[rule.name] === undefined) {
    return false;
  }

  return parseInt(settings[rule.name], 10) !== rule.off;
}

function disableLowVoltageCut(esc, settings) {
  if(!isLowVoltageCutActive(esc, settings)) {
    return {
      settings,
      changed: false,
    };
  }

  const rule = getRule(esc);
  return {
    settings: {
      ...settings,
      [rule.name]: rule.off,
    },
    changed: true,
  };
}

export {
  disableLowVoltageCut,
  getLowVoltageText,
  isLowVoltageCutActive,
};
