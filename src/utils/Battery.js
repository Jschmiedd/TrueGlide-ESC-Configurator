// Above this a cell is not possible: the flight controller counted too few cells
const MAX_CELL_VOLTAGE = 4.35;

/**
 * TrueGlide v33: when the battery is plugged in after the USB cable, the
 * flight controller may count too few cells (1S @ 14.7V).
 *
 * @param {object} battery
 * @returns {boolean}
 */
function isCellCountDoubtful(battery) {
  return battery.voltage / battery.cellCount > MAX_CELL_VOLTAGE;
}

/**
 * Cell count of the battery measured before the ESCs were read, or null when
 * the battery is unknown, missing or its cell count doubtful.
 *
 * @param {object|null} battery
 * @returns {number|null}
 */
function getDetectedCells(battery) {
  if(!battery || !Number.isInteger(battery.cellCount) || battery.cellCount < 1 || isCellCountDoubtful(battery)) {
    return null;
  }

  return battery.cellCount;
}

export {
  getDetectedCells,
  isCellCountDoubtful,
};
