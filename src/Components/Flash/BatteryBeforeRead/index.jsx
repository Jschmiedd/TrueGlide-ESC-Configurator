import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { selectBatteryBeforeRead } from '../../../Containers/App/escsSlice';
import { isCellCountDoubtful } from '../../../utils/Battery';

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
    doubtful = isCellCountDoubtful(battery);
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
