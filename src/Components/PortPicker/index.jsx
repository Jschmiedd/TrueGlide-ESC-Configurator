import React, {
  useCallback,
  useRef,
} from 'react';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import CompatibilityWarning from './CompatibilityWarning';

import {
  selectConnected,
  selectHasSerial,
  selectOffline,
  selectOpen,
  selectPortNames,
  setBaudRate,
} from '../../Containers/App/serialSlice';

import './style.scss';

function BaudRates({
  handleChange,
  disabled,
}) {
  const { t } = useTranslation('common');
  const baudRates = [115200, 57600, 38400, 28800, 19200, 14400, 9600, 4800, 2400, 1200];

  const rateElements = baudRates.map((rate) => (
    <option
      key={rate}
      value={rate}
    >
      {rate}
    </option>
  ));

  return (
    <select
      className="dropdown__select"
      defaultValue="115200"
      disabled={disabled}
      id="baud"
      name={t('baudRate')}
      onChange={handleChange}
      title={t('baudRate')}
    >
      {rateElements}
    </select>
  );
}

BaudRates.propTypes = {
  disabled: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
};

function PermissionOverlay({
  handleOpenFile,
  handleSetPort,
  show,
}) {
  const { t } = useTranslation('common');

  if(!show) {
    return(
      <div id="serial-permission-overlay">
        <button
          onClick={handleSetPort}
          type="button"
        >
          {t('serialPermission')}
        </button>

        {handleOpenFile &&
          <button
            onClick={handleOpenFile}
            type="button"
          >
            {t('offlineOpenFile')}
          </button>}
      </div>
    );
  }

  return null;
}

PermissionOverlay.defaultProps = { handleOpenFile: null };

PermissionOverlay.propTypes = {
  handleOpenFile: PropTypes.func,
  handleSetPort: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

const OFFLINE_FILE = 'offline-file';

function Ports({
  canOpenFile,
  disabled,
  ports,
  handleChange,
}) {
  const { t } = useTranslation('common');

  const portOptions = ports.map((name, index) => (
    <option
      key={name}
      value={index}
    >
      {name}
    </option>
  ));

  if(canOpenFile) {
    portOptions.push(
      <option
        key={OFFLINE_FILE}
        value={OFFLINE_FILE}
      >
        {t('offlineOpenFile')}
      </option>
    );
  }

  return(
    <select
      className="dropdown__select"
      disabled={disabled}
      id="port"
      name={t('port')}
      onChange={handleChange}
      title={t('port')}
    >
      {portOptions}
    </select>
  );
}

Ports.defaultProps = { canOpenFile: false };

Ports.propTypes = {
  canOpenFile: PropTypes.bool,
  disabled: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  ports: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

function PortPicker({
  isIdle,
  onSetPort,
  onConnect,
  onDisconnect,
  onChangePort,
  onOfflineOpen,
}) {
  const { t } = useTranslation('common');

  const dispatch = useDispatch();
  const fileInput = useRef(null);

  const hasPort = useSelector(selectConnected);
  const hasSerial = useSelector(selectHasSerial);
  const open = useSelector(selectOpen);
  const offline = useSelector(selectOffline);
  const ports = useSelector(selectPortNames);

  const handleBaudRateChange = useCallback((e) => {
    dispatch(setBaudRate(e.target.value));
  }, [dispatch]);

  const handleOpenFile = useCallback(() => {
    if(fileInput.current) {
      fileInput.current.click();
    }
  }, []);

  const handlePortChange = useCallback((e) => {
    if(e.target.value === OFFLINE_FILE) {
      handleOpenFile();
      return;
    }

    onChangePort(e.target.value);
  }, [handleOpenFile, onChangePort]);

  const handleOfflineFile = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onOfflineOpen(event.target.result, file.name);
    };
    reader.readAsText(file);

    // The same file can be chosen again
    e.target.value = '';
  }, [onOfflineOpen]);

  let connectText = t('connect');
  if(offline) {
    connectText = t('disconnectOffline');
  } else if(open) {
    connectText = t('disconnect');
  }

  if(!hasSerial) {
    return <CompatibilityWarning />;
  }

  return (
    <div className="port-picker">
      <PermissionOverlay
        handleOpenFile={onOfflineOpen ? handleOpenFile : null}
        handleSetPort={onSetPort}
        show={hasPort}
      />

      <div id="portsinput">
        <div
          className={`dropdown dark ${open ? 'disabled' : ''}`}
          disabled={open}
        >
          <Ports
            canOpenFile={Boolean(onOfflineOpen)}
            disabled={open}
            handleChange={handlePortChange}
            ports={ports}
          />

          {onOfflineOpen &&
            <input
              accept=".json,application/json"
              data-testid="offline-file"
              hidden
              onChange={handleOfflineFile}
              ref={fileInput}
              type="file"
            />}
        </div>

        <div
          className={`dropdown dark ${open ? 'disabled' : ''}`}
          disabled={open}
        >
          <BaudRates
            disabled={open}
            handleChange={handleBaudRateChange}
          />
        </div>

        <div className="button button--dark">
          <button
            disabled={open}
            onClick={onSetPort}
            type="button"
          >
            {t('openPortSelection')}
          </button>
        </div>
      </div>

      <div id="connect-button-wrapper">
        <button
          className={`${open ? 'active' : ''}`}
          disabled={!isIdle}
          name="connect"
          onClick={open ? onDisconnect : onConnect}
          type="button"
        >
          <span className="icon connect" />

          <span className="connect-state">
            {connectText}
          </span>
        </button>
      </div>
    </div>
  );
}

PortPicker.defaultProps = {
  isIdle: false,
  onOfflineOpen: null,
};
PortPicker.propTypes = {
  isIdle: PropTypes.bool,
  onChangePort: PropTypes.func.isRequired,
  onConnect: PropTypes.func.isRequired,
  onDisconnect: PropTypes.func.isRequired,
  onOfflineOpen: PropTypes.func,
  onSetPort: PropTypes.func.isRequired,
};

export default React.memo(PortPicker);
