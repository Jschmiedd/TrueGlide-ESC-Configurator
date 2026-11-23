import am32Eeprom from '../../sources/AM32/eeprom';
import { getSource } from './General';

/**
 * The different ways settings can be handled when flashing new firmware:
 * migrating only between versions of the same firmware, migrating between
 * different firmware or not migrating at all - in which case the ESC is left
 * with the settings that are hard coded in the flashed firmware.
 */
const MIGRATION = {
  SAME: 'same',
  ALL: 'all',
  DEFAULTS: 'defaults',
};

/**
 * Get master settings from a set of settings
 *
 * @param {Array<object>} escs
 * @returns {object}
 */
const getMasterSettings = (escs) => {
  const master = getMaster(escs);
  if(master) {
    return { ...master.settings };
  }

  return {};
};

/**
 * Names of the common settings described for this ESC (its firmware and
 * layout revision), or null when there is no description for it.
 *
 * @param {object} esc
 * @returns {Array<string>|null}
 */
const getCommonSettingNames = (esc) => {
  if(!esc || !esc.firmwareName || !esc.layoutRevision) {
    return null;
  }

  const source = getSource(esc.firmwareName);
  const descriptions = source ? source.getCommonSettings(esc.layoutRevision) : null;
  if(!descriptions || !Array.isArray(descriptions.base)) {
    return null;
  }

  return descriptions.base.map((description) => description.name);
};

/**
 * Return the individaul settings for each ESC - include fixed fields
 *
 * @param {object} esc
 * @returns {Array<string>}
 */
const getIndividualSettingsDescriptions = (esc) => {
  if(esc && esc.firmwareName && esc.layoutRevision) {
    const source = getSource(esc.firmwareName);
    if(source) {
      const keep = ['MAIN_REVISION', 'SUB_REVISION', 'LAYOUT', 'LAYOUT_REVISION', 'NAME'];
      const descriptions = source.getIndividualSettings(esc.layoutRevision);

      const individualGroups = Object.keys(descriptions);
      for(let i = 0; i < individualGroups.length; i += 1) {
        const keepSettings = descriptions[individualGroups[i]];
        for(let j = 0; j < keepSettings.length; j += 1) {
          const current = keepSettings[j].name;
          keep.push(current);
        }
      }

      return keep;
    }
  }

  return [];
};

/**
 * Return individual settings for a  given ESC
 *
 * @param {object} esc
 * @returns {object}
 */
const getIndividualSettings = (esc) => {
  const individualSettings = {};

  if(esc && esc.settings) {
    try {
      const individualKeep = getIndividualSettingsDescriptions(esc);

      for(let j = 0; j < individualKeep.length; j += 1) {
        const setting = individualKeep[j];
        individualSettings[setting] = esc.settings[setting];
      }
    } catch (e) {
      return individualSettings;
    }
  }

  return individualSettings;
};

/**
 * First available ESC whose settings can be trusted: an ESC in
 * **FLASH*FAILED** is read with the wrong layout, so its values are never
 * shown as the common settings nor copied to the other ESCs. With no healthy
 * ESC there is no master. An AM32 ESC with a layout that is not described is
 * only the master when no other healthy ESC is: its values are then only shown
 * as not supported.
 *
 * @param {Array<object>} escs
 * @returns {object|undefined}
 */
const getMaster = (escs) => {
  const healthy = escs.filter((esc) => esc.meta.available && !isFlashFailed(esc));

  return healthy.find((esc) => !isLayoutNotDescribed(esc)) || healthy[0];
};

/**
 * Check if a specific setting can be migrated from one firmware to another
 *
 * @param {string} settingName
 * @param {object} from
 * @param {object} to
 * @param {object} toSettingsDescriptions
 * @param {object} toIndividualSettingsDescriptions
 * @returns {boolean}
 */
function canMigrate(settingName, from, to, toSettingsDescriptions, toIndividualSettingsDescriptions) {
  if (from.MODE === to.MODE) {
    if (!toSettingsDescriptions[from.LAYOUT_REVISION] ||
        !toSettingsDescriptions[to.LAYOUT_REVISION] ||
        !toIndividualSettingsDescriptions[from.LAYOUT_REVISION] ||
        !toIndividualSettingsDescriptions[to.LAYOUT_REVISION]
    ) {
      return false;
    }

    const fromLayout = toSettingsDescriptions[from.LAYOUT_REVISION];
    const toLayout = toSettingsDescriptions[to.LAYOUT_REVISION];

    if(!(fromLayout.base && toLayout.base)) {
      return false;
    }

    const fromCommon = fromLayout.base.find((setting) => setting.name === settingName);
    const toCommon = toLayout.base.find((setting) => setting.name === settingName);

    if (fromCommon && toCommon) {
      return true;
    }

    const fromIndividuals = toIndividualSettingsDescriptions[from.LAYOUT_REVISION].base;
    const toIndividuals = toIndividualSettingsDescriptions[to.LAYOUT_REVISION].base;

    const fromIndividual = fromIndividuals.find((setting) => setting.name === settingName);
    const toIndividual = toIndividuals.find((setting) => setting.name === settingName);

    if (fromIndividual && toIndividual) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an ESC supports LED configuration
 *
 * Which layouts support LEDs is described by the firmware source itself, so
 * instead of duplicating that list, the setting description is asked.
 *
 * @param {object} esc
 * @returns {boolean}
 */
const supportsLeds = (esc) => {
  const source = getSource(esc?.firmwareName);
  const descriptions = source?.getIndividualSettings(esc.layoutRevision);

  const led = descriptions?.base.find((description) => description.name === 'LED_CONTROL');
  if(!led) {
    return false;
  }

  return led.visibleIf ? led.visibleIf(esc.individualSettings || {}) : true;
};

const FLASH_FAILED_NAME = '**FLASH*FAILED**';

const AM32_NAME = 'AM32';

/**
 * AM32 ESC whose boot byte (EEPROM byte 0) is read and is not 1: the AM32
 * bootloader never starts its firmware (jump() in bootloader/main.c). The
 * flash sets it to 0 before the first page and to 1 only once every page is
 * verified, so it is the only mark of an interrupted flash on layout 4, which
 * has no name.
 *
 * @param {object} esc
 * @returns {boolean}
 */
function isBootBlocked(esc) {
  return Boolean(esc && esc.firmwareName === AM32_NAME && esc.settings &&
    esc.settings.BOOT_BYTE !== undefined && esc.settings.BOOT_BYTE !== am32Eeprom.BOOT_BYTE_READY);
}

/**
 * ESC whose last flash failed: its settings hold the **FLASH*FAILED** mark
 * and values read with the wrong layout, or it is an AM32 ESC its bootloader
 * will not start. It is skipped when writing, and its values are never shown
 * as the common settings nor copied to the other ESCs, until it is flashed
 * again.
 *
 * @param {object} esc
 * @returns {boolean}
 */
function isFlashFailed(esc) {
  return Boolean(esc && esc.settings && esc.settings.NAME === FLASH_FAILED_NAME) || isBootBlocked(esc);
}

/**
 * AM32 ESC that reports an EEPROM layout revision that is not described: its
 * bytes are read with a layout that is not its own, so no setting is ever
 * written to it (nor taken from it), whatever the path. Reading and flashing
 * it stay possible.
 *
 * @param {object} esc
 * @returns {boolean}
 */
function isLayoutNotDescribed(esc) {
  return Boolean(esc && esc.firmwareName === AM32_NAME && esc.layoutRevision && !getCommonSettingNames(esc));
}

const FLASH_BLOCKED_NAMES = ['BLHeli_32', 'AM32-PIN'];

/**
 * ESCs this configurator must never flash nor dump: BLHeli_32 (closed
 * firmware, nothing is read from it) and AM32 on an unsupported pin. Decided
 * for each ESC, since a drone can mix ESCs.
 *
 * @param {object} esc
 * @returns {boolean}
 */
function isFlashBlocked(esc) {
  if(!esc) {
    return true;
  }

  const name = esc.settings ? esc.settings.NAME : undefined;
  return FLASH_BLOCKED_NAMES.includes(name) || FLASH_BLOCKED_NAMES.includes(esc.firmwareName);
}

export {
  getCommonSettingNames,
  isBootBlocked,
  isFlashBlocked,
  isFlashFailed,
  isLayoutNotDescribed,
  getIndividualSettings,
  getIndividualSettingsDescriptions,
  getMaster,
  getMasterSettings,
  canMigrate,
  MIGRATION,
  supportsLeds,
};
