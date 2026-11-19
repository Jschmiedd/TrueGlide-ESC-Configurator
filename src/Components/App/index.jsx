import 'react-toastify/dist/ReactToastify.min.css';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import AppSettings from '../AppSettings';
import LanguageSelection from '../LanguageSelection';
import Log from '../Log';
import MainContent from '../MainContent';
import MelodyEditor from '../../Components/MelodyEditor';
import PortPicker from '../PortPicker';
import Statusbar from '../Statusbar';

import { selectState } from '../../Containers/App/stateSlice';
import { show as showAppSettings } from '../AppSettings/settingsSlice';
import { selectShow as selectShowMelodyEditor } from '../MelodyEditor/melodiesSlice';

import './style.scss';

function App({
  getBatteryState,
  getUtilization,
  onAllMotorSpeed,
  onEscDump,
  onEscsFlashFile,
  onEscsFlashUrl,
  onEscsRead,
  onEscsRestoreSettings,
  onEscsWriteDefaults,
  onEscsWriteSettings,
  onMelodyWrite,
  onSerialConnect,
  onSerialDisconnect,
  onSerialPortChange,
  onSerialSetPort,
  onSingleMotorSpeed,
  progressReferences,
}) {
  const { t } = useTranslation('common');
  const dispatch = useDispatch();

  const showMelodyEditor = useSelector(selectShowMelodyEditor);
  const actions = useSelector(selectState);

  const isIdle = !Object.values(actions).some((element) => element);

  const onAppSettingsShow = useCallback((e) => {
    dispatch(showAppSettings());
  }, [dispatch]);

  /**
   * TrueGlide v32: the header is fixed and its height changes (log links on
   * their own line, which can wrap, and the log opened or closed). The content
   * starts right below it, so nothing is hidden behind the log.
   */
  const headerRef = useRef(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    const update = () => {
      document.documentElement.style.setProperty('--trueglide-header-height', `${header.offsetHeight}px`);
    };
    update();

    if(typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);

      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="main">
        <header
          className="main__header"
          ref={headerRef}
        >
          <div className="main__bar">
            <div
              className="main__logo"
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/marque/logo-rond-128.png)` }}
            />

            <PortPicker
              isIdle={isIdle}
              onChangePort={onSerialPortChange}
              onConnect={onSerialConnect}
              onDisconnect={onSerialDisconnect}
              onSetPort={onSerialSetPort}
            />

            <div className="main__settings">
              <LanguageSelection />

              <div className="button button--dark">
                <button
                  onClick={onAppSettingsShow}
                  type="button"
                >
                  {t('settings')}
                </button>
              </div>

            </div>
          </div>

          <Log />
        </header>

        <MainContent
          getBatteryState={getBatteryState}
          onAllMotorSpeed={onAllMotorSpeed}
          onFirmwareDump={onEscDump}
          onFlashUrl={onEscsFlashUrl}
          onLocalSubmit={onEscsFlashFile}
          onReadEscs={onEscsRead}
          onResetDefaultls={onEscsWriteDefaults}
          onRestoreSettings={onEscsRestoreSettings}
          onSingleMotorSpeed={onSingleMotorSpeed}
          onWriteSetup={onEscsWriteSettings}
          progressReferences={progressReferences}
        />

        <Statusbar getUtilization={getUtilization} />
      </div>

      <AppSettings />

      {showMelodyEditor &&
        <MelodyEditor onWrite={onMelodyWrite} />}

      <ToastContainer />
    </div>
  );
}

App.defaultProps = {
  getBatteryState: null,
  getUtilization: null,
  onEscsRestoreSettings: null,
};

App.propTypes = {
  getBatteryState: PropTypes.func,
  getUtilization: PropTypes.func,
  onAllMotorSpeed: PropTypes.func.isRequired,
  onEscDump: PropTypes.func.isRequired,
  onEscsFlashFile: PropTypes.func.isRequired,
  onEscsFlashUrl: PropTypes.func.isRequired,
  onEscsRead: PropTypes.func.isRequired,
  onEscsRestoreSettings: PropTypes.func,
  onEscsWriteDefaults: PropTypes.func.isRequired,
  onEscsWriteSettings: PropTypes.func.isRequired,
  onMelodyWrite: PropTypes.func.isRequired,
  onSerialConnect: PropTypes.func.isRequired,
  onSerialDisconnect: PropTypes.func.isRequired,
  onSerialPortChange: PropTypes.func.isRequired,
  onSerialSetPort: PropTypes.func.isRequired,
  onSingleMotorSpeed: PropTypes.func.isRequired,
  progressReferences: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

export default App;
