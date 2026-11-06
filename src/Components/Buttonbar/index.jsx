import React, {
  useCallback,
  useRef,
} from 'react';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import GenericButton from './GenericButton';

import {
  prod,
  show,
  selectSupported,
} from '../MelodyEditor/melodiesSlice';
import {
  selectCanFlash,
  selectCanRead,
  selectCanWrite,
  setSelecting,
} from '../../Containers/App/stateSlice';
import {
  selectIndividual,
  setTargets,
} from '../../Containers/App/escsSlice';

import './style.scss';

function Buttonbar({
  onReadSetup,
  onWriteSetup,
  onResetDefaults,
  onRestoreSettings,
}) {
  const { t } = useTranslation('common');
  const dispatch = useDispatch();
  const fileInput = useRef(null);

  const showMelodyEditor = useSelector(selectSupported);

  const canFlash = useSelector(selectCanFlash);
  const canRead = useSelector(selectCanRead);
  const canWrite = useSelector(selectCanWrite);

  const escs = useSelector(selectIndividual);

  const onSeletFirmwareForAll = useCallback(() => {
    const targets = [];
    for (let i = 0; i < escs.length; i += 1) {
      const esc = escs[i];
      targets.push(esc.index);
    }

    dispatch(setSelecting(true));
    dispatch(setTargets(targets));
  }, [dispatch, escs]);

  const handleRestoreClick = useCallback(() => {
    if(fileInput.current) {
      fileInput.current.click();
    }
  }, []);

  const handleRestoreFile = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onRestoreSettings(event.target.result);
    };
    reader.readAsText(file);

    // The same file can be chosen again
    e.target.value = '';
  }, [onRestoreSettings]);

  const handleOpenMelodyEditor = useCallback(() => {
    dispatch(prod());
    dispatch(show());
  }, [dispatch]);

  return (
    <div className="button-bar">
      <div className="buttons-bottom mobile-show">
        {showMelodyEditor &&
          <GenericButton
            disabled={!canRead}
            onClick={handleOpenMelodyEditor}
            text={t('escButtonOpenMelodyEditor')}
          />}
      </div>

      <div className="buttons-left">
        <div className="mobile-show">
          <GenericButton
            disabled={!canWrite}
            onClick={onResetDefaults}
            text={t('resetDefaults')}
          />
        </div>
      </div>

      <div className="buttons-right">
        <GenericButton
          disabled={!canRead}
          onClick={onReadSetup}
          text={t('escButtonRead')}
        />

        <GenericButton
          disabled={!canWrite}
          onClick={onWriteSetup}
          text={t('escButtonWrite')}
        />

        <GenericButton
          disabled={!canFlash}
          onClick={onSeletFirmwareForAll}
          text={t('escButtonFlashAll')}
        />

        <GenericButton
          disabled={!canWrite}
          onClick={onResetDefaults}
          text={t('resetDefaults')}
        />

        {onRestoreSettings &&
          <>
            <GenericButton
              disabled={!canWrite}
              onClick={handleRestoreClick}
              text={t('escButtonRestoreBackup')}
            />

            <input
              accept=".json,application/json"
              data-testid="restore-settings-file"
              hidden
              onChange={handleRestoreFile}
              ref={fileInput}
              type="file"
            />
          </>}

        {showMelodyEditor &&
          <GenericButton
            disabled={!canRead}
            onClick={handleOpenMelodyEditor}
            text={t('escButtonOpenMelodyEditor')}
          />}
      </div>
    </div>
  );
}

Buttonbar.defaultProps = { onRestoreSettings: null };

Buttonbar.propTypes = {
  onReadSetup: PropTypes.func.isRequired,
  onResetDefaults: PropTypes.func.isRequired,
  onRestoreSettings: PropTypes.func,
  onWriteSetup: PropTypes.func.isRequired,
};

export default Buttonbar;
