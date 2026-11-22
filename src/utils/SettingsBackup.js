/**
 * Settings backup (TrueGlide).
 *
 * Before every flash the settings of the ESCs are saved to a JSON file the
 * user keeps. A file loaded again is only written back to the same number of
 * ESCs, each one at the same position and running the same firmware, version,
 * settings layout and hardware layout. Only the copy kept in memory during a
 * flash may go to another version of the same firmware.
 */
import {
  isFlashBlocked,
  isFlashFailed,
  isLayoutNotDescribed,
} from './helpers/Settings';
import { getSource } from './helpers/General';
import packages from '../../package.json';

const FORMAT = 'trueglide-esc-reglages';
const VERSION = 2;
const READABLE_VERSIONS = [1, 2];

// Values that describe the firmware or the hardware: never written back
const IDENTITY_KEYS = [
  'BOOT_LOADER_REVISION',
  'LAYOUT',
  'LAYOUT_REVISION',
  'MAIN_REVISION',
  'MCU',
  'NAME',
  'SUB_REVISION',
];

function buildBackup(individual, date = new Date()) {
  const escs = individual
    .filter((esc) => esc && esc.settings && !isFlashBlocked(esc))
    .map((esc) => ({
      index: esc.index,
      firmwareName: esc.firmwareName,
      displayName: esc.displayName,
      layoutRevision: esc.layoutRevision,
      settings: { ...esc.settings },
    }));

  return {
    format: FORMAT,
    version: VERSION,
    appVersion: packages.version,
    date: date.toISOString(),
    count: individual.filter((esc) => esc).length,
    escs,
  };
}

function backupFileName(date = new Date()) {
  const pad = (n) => n.toString().padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;

  return `trueglide-esc-reglages_${stamp}.json`;
}

/**
 * Offer the backup as a download. Returns false when the browser cannot do
 * it (nothing is thrown: a missing backup must not block anything else).
 */
function downloadBackup(backup, fileName) {
  try {
    if(typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return false;
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return true;
  } catch(e) {
    console.debug('Backup download failed', e);

    return false;
  }
}

function isSavedEsc(saved) {
  return Boolean(saved) &&
    Number.isInteger(saved.index) &&
    typeof saved.firmwareName === 'string' &&
    typeof saved.layoutRevision === 'string' &&
    /^\d+$/.test(saved.layoutRevision) &&
    Boolean(saved.settings) &&
    typeof saved.settings === 'object';
}

/**
 * Throws when the text is not a complete backup made by this program.
 */
function parseBackup(text) {
  const backup = JSON.parse(text);
  if(!backup || backup.format !== FORMAT || !READABLE_VERSIONS.includes(backup.version) ||
    !Array.isArray(backup.escs) || !backup.escs.every(isSavedEsc)) {
    throw new Error('Not a settings backup');
  }

  return backup;
}

/**
 * Number of ESCs the backup was made with. Files of the first version did not
 * keep it: the saved ESCs are counted instead.
 */
function getBackupCount(backup) {
  if(Number.isInteger(backup.count)) {
    return backup.count;
  }

  return backup.escs.length;
}

/**
 * Same value whatever its type: a list on the screen gives "1" where the ESC
 * holds 1. A melody is compared as a whole.
 */
function isSameValue(a, b) {
  if(Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return String(a) === String(b);
}

/**
 * A value chosen in a list comes back as text: it is saved as a number again
 * where the ESC held a number.
 */
function withSavedTypes(settings, reference) {
  const result = { ...settings };
  Object.keys(result).forEach((name) => {
    const value = result[name];
    if(typeof value === 'string' && typeof reference[name] === 'number' &&
      value.trim() !== '' && !Number.isNaN(Number(value))) {
      result[name] = Number(value);
    }
  });

  return result;
}

function isSameSettings(a, b) {
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);

  return [...names].every((name) => isSameValue(a[name], b[name]));
}

/**
 * The text the screen shows for a value: the label of its option for a list,
 * the value itself otherwise.
 */
function getValueText(description, value) {
  if(description && description.type === 'enum') {
    const option = description.options.find((item) => String(item.value) === String(value));
    if(option) {
      return option.label;
    }
  }

  return value;
}

/**
 * Settings whose value differs between two sets of settings of the same ESC,
 * with the label and the values the screen shows for them.
 */
function getSettingChanges(esc, before, after) {
  const descriptions = getDescriptions(esc);

  return Object.keys(after)
    .filter((name) => !isSameValue(before[name], after[name]))
    .map((name) => {
      let label = name;
      if(descriptions[name] && descriptions[name].label) {
        label = descriptions[name].label;
      }

      return {
        name,
        label,
        before: getValueText(descriptions[name], before[name]),
        after: getValueText(descriptions[name], after[name]),
      };
    });
}

/**
 * Settings of the screen (and the melody) that were not read back as they
 * were written.
 */
function getMismatchedSettings(esc, written, read) {
  const descriptions = getDescriptions(esc);

  return Object.keys(written)
    .filter((name) => (descriptions[name] && descriptions[name].type !== 'dummy') || MELODY_KEYS.includes(name))
    .filter((name) => !isSameValue(written[name], read[name]));
}

function isSameCount(backup, individual) {
  return getBackupCount(backup) === individual.filter((esc) => esc).length;
}

/**
 * Descriptions of the settings the screen offers for this ESC (common and
 * individual), with the overrides of its firmware version.
 */
function getDescriptions(esc) {
  const source = getSource(esc.firmwareName);
  if(!source) {
    return {};
  }

  const revision = `${esc.settings.MAIN_REVISION}.${esc.settings.SUB_REVISION}`;
  const result = {};
  [source.getCommonSettings(esc.layoutRevision), source.getIndividualSettings(esc.layoutRevision)]
    .forEach((descriptions) => {
      if(!descriptions || !descriptions.base) {
        return;
      }

      const overrides = descriptions.overrides ? descriptions.overrides[revision] || [] : [];
      descriptions.base.forEach((description) => {
        const override = overrides.find((item) => item.name === description.name);
        result[description.name] = override || description;
      });
    });

  return result;
}

// Written by the melody editor, not described on the settings screen
const MELODY_KEYS = ['STARTUP_MELODY', 'STARTUP_MELODY_WAIT_MS'];

function isAllowedMelody(current, value) {
  if(Array.isArray(current)) {
    return Array.isArray(value) &&
      value.length === current.length &&
      value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255);
  }

  return Number.isInteger(value) && value >= 0 && value <= 0xFFFF;
}

/**
 * Same bounds as the screen (audit R3)
 */
function isAllowed(description, value, current) {
  switch(description.type) {
    case 'melody': {
      return isAllowedMelody(current, value);
    }

    case 'bool': {
      return value === 0 || value === 1;
    }

    case 'enum': {
      return description.options.some((option) => String(option.value) === String(value));
    }

    case 'number': {
      const factor = description.displayFactor || 1;
      const offset = description.displayOffset || 0;
      const rawMin = Math.ceil((description.min - offset) / factor);
      const rawMax = Math.floor((description.max - offset) / factor);

      return Number.isInteger(value) && value >= rawMin && value <= rawMax;
    }

    default: {
      return false;
    }
  }
}

/**
 * A setting only goes to another firmware version when that version describes
 * it the same way (same type and bounds).
 */
function isSameDescription(description, savedDescription) {
  return JSON.stringify(description) === JSON.stringify(savedDescription);
}

/**
 * Settings to write to this ESC from the backup, or null when the backup
 * holds nothing that may be written to it. Only the settings the screen can
 * change are taken, and only within the screen's bounds; the names of the
 * values left out are added to "rejected".
 */
function getRestoredSettings(esc, backup, rejected = [], otherVersion = false) {
  // Never to an ESC whose firmware is broken by a failed flash, nor to an AM32
  // ESC whose layout is not described
  if(!esc || !esc.settings || isFlashBlocked(esc) || isFlashFailed(esc) || isLayoutNotDescribed(esc)) {
    return null;
  }

  const saved = backup.escs.find((item) => item && item.index === esc.index);
  if(!saved || !saved.settings) {
    return null;
  }

  if(saved.firmwareName !== esc.firmwareName ||
    saved.settings.LAYOUT !== esc.settings.LAYOUT) {
    return null;
  }

  if(!otherVersion && (
    saved.layoutRevision !== esc.layoutRevision ||
    saved.settings.MAIN_REVISION !== esc.settings.MAIN_REVISION ||
    saved.settings.SUB_REVISION !== esc.settings.SUB_REVISION)) {
    return null;
  }

  const descriptions = getDescriptions(esc);
  let savedDescriptions = descriptions;
  if(otherVersion) {
    savedDescriptions = getDescriptions(saved);
  }

  const settings = { ...esc.settings };
  Object.keys(esc.settings).forEach((key) => {
    const value = saved.settings[key];
    if(IDENTITY_KEYS.includes(key) || value === undefined) {
      return;
    }

    let allowed = false;
    if(descriptions[key]) {
      if(descriptions[key].type === 'dummy') {
        return;
      }
      allowed = isSameDescription(descriptions[key], savedDescriptions[key]) &&
        isAllowed(descriptions[key], value, esc.settings[key]);
    } else if(MELODY_KEYS.includes(key)) {
      allowed = isAllowedMelody(esc.settings[key], value);
    } else {
      // Not offered on the screen: the ESC keeps its value
      return;
    }

    if(allowed) {
      settings[key] = value;
    } else if(!isSameValue(value, esc.settings[key])) {
      rejected.push(key);
    }
  });

  return settings;
}

export {
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
};
