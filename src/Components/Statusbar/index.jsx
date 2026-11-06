import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { useInterval } from '../../utils/helpers/React';
import packages from '../../../package.json';

import { selectPacketErrors } from './statusSlice';

import './style.scss';

const SOURCE = 'https://github.com/Jschmiedd/TrueGlide-ESC-Configurator';

function Statusbar({ getUtilization }) {
  const { t } = useTranslation('common');
  const { version } = packages;
  // Exact source of this build (AGPL): set at build time
  const commit = process.env.REACT_APP_COMMIT || '';
  const packetErrors = useSelector(selectPacketErrors);

  const [utilization, setUtilization] = useState({
    up: 0,
    down: 0,
  });

  useInterval(() => {
    if(getUtilization) {
      const utilization = getUtilization;
      setUtilization(utilization);
    }
  }, 1000);

  return (
    <div className="status-bar">
      <span>
        {`${t('statusbarPortUtilization')} D: ${utilization.down}% U: ${utilization.up}%`}
      </span>

      <span>
        {`${t('statusbarPacketError')} ${packetErrors}`}
      </span>

      <span className="status-bar__version">
        {version}

        {commit &&
          <>
            {' · '}

            <a
              href={`${SOURCE}/tree/${commit}`}
              rel="noreferrer"
              target="_blank"
              title={t('statusbarSourceCommit')}
            >
              {commit}
            </a>
          </>}
      </span>
    </div>
  );
}

Statusbar.defaultProps = { getUtilization: null };
Statusbar.propTypes = { getUtilization: PropTypes.func };

export default Statusbar;
