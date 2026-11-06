/**
 * Settings backup (TrueGlide).
 *
 * Before every flash the settings of the ESCs are saved to a JSON file the
 * user keeps. The file can be loaded again later: each saved ESC is only
 * written back to the ESC at the same position, running the same firmware
 * with the same settings layout and the same hardware layout.
 */
import { isFlashBlocked } from './helpers/Settings';

const FORMAT = 'trueglide-esc-reglages';
const VERSION = 1;

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
    date: date.toISOString(),
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

/**
 * Throws when the text is not a backup made by this program.
 */
function parseBackup(text) {
  const backup = JSON.parse(text);
  if(!backup || backup.format !== FORMAT || backup.version !== VERSION || !Array.isArray(backup.escs)) {
    throw new Error('Not a settings backup');
  }

  return backup;
}

/**
 * Settings to write to this ESC from the backup, or null when the backup
 * holds nothing that may be written to it.
 */
function getRestoredSettings(esc, backup) {
  if(!esc || !esc.settings || isFlashBlocked(esc)) {
    return null;
  }

  const saved = backup.escs.find((item) => item && item.index === esc.index);
  if(!saved || !saved.settings) {
    return null;
  }

  if(saved.firmwareName !== esc.firmwareName ||
    saved.layoutRevision !== esc.layoutRevision ||
    saved.settings.LAYOUT !== esc.settings.LAYOUT) {
    return null;
  }

  const settings = { ...esc.settings };
  Object.keys(esc.settings).forEach((key) => {
    const value = saved.settings[key];
    if(!IDENTITY_KEYS.includes(key) && value !== undefined && typeof value === typeof esc.settings[key]) {
      settings[key] = value;
    }
  });

  return settings;
}

export {
  backupFileName,
  buildBackup,
  downloadBackup,
  getRestoredSettings,
  parseBackup,
};
