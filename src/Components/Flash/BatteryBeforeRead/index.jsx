import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { selectBatteryBeforeRead } from '../../../Containers/App/escsSlice';

// Above this a cell is not possible: the flight controller counted too few cells
const MAX_CELL_VOLTAGE = 4.35;

function BatteryBeforeRead() {
  const { t } = useTranslation('common');
  const battery = useSelector(selectBatteryBeforeRead);

  if(!battery) {
    return null;
  }

  let text = null;
  let doubtful = false;
  if(battery.status === 'unknown') {
    text = t('batteryBeforeReadUnknown', { time: battery.time });
  } else if(battery.cellCount === 0) {
    text = t('batteryBeforeReadMissing', { time: battery.time });
  } else {
    text = t('batteryBeforeRead', {
      time: battery.time,
      cells: battery.cellCount,
      voltage: battery.voltage,
    });
    doubtful = battery.voltage / battery.cellCount > MAX_CELL_VOLTAGE;
  }

  let className = 'note battery-before-read';
  if(doubtful) {
    text = `${text} – ${t('batteryCellCountDoubtful')}`;
    className = `${className} warning`;
  }

  return (
    <div className={className}>
      {text}
    </div>
  );
}

export default BatteryBeforeRead;
