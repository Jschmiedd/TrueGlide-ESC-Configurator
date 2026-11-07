import React, { Component } from 'react';
import i18next from 'i18next';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import BinToHex from 'bin-to-hex';
import Rtttl from 'bluejay-rtttl-parse';
import UAParser from 'ua-parser-js';

import {
  fetchHexCached,
  fetchHexDirect,
  removeHexCached,
} from '../../utils/Fetch';
import {
  checkFirmware,
  getMirrorUrl,
} from '../../utils/FirmwareIntegrity';
import {
  backupFileName,
  buildBackup,
  downloadBackup,
  getRestoredSettings,
  parseBackup,
} from '../../utils/SettingsBackup';
import { TimeoutError } from '../../utils/helpers/QueueProcessor';
import {
  getMasterSettings,
  isFlashBlocked,
} from '../../utils/helpers/Settings';
import {
  delay,
  getAppSetting,
} from '../../utils/helpers/General';
import MainApp from '../../Components/App';
import Serial from '../../utils/Serial';
import { loadSerialApi } from '../../utils/LocalStorage';
import { MessageNotOkError } from '../../utils/Errors';
import {
  isEmbedded,
  isParentCommand,
  notifyParent,
} from '../../utils/Embedded';

import { store } from '../../store';

import { set as setMspFeatures } from '../../Containers/App/mspSlice';
import { fetch as fetchConfigs } from './configsSlice';
import {
  reset as resetMelodyEditor,
  updateAll as updatatAllMelodies,
} from '../../Components/MelodyEditor/melodiesSlice';
import {
  add as addLog,
  addMessage as addMessageLog,
} from '../../Components/Log/logSlice';
import {
  reset as resetState,
  setConnecting,
  setDisconnecting,
  setFlashing,
  setReading,
  setSelecting,
  setWriting,
} from './stateSlice';
import {
  setChecked,
  setConnected,
  setFourWay,
  setHasSerial,
  setOpen,
  setPortNames,
} from './serialSlice';
import {
  setIndividual,
  setMaster,
  setConnected as setConnectedEscs,
  setIndividualAtIndex,
} from './escsSlice';

// Settings that set how the motors turn (direction, 3D)
const ROTATION_KEYS = ['MOTOR_DIRECTION', 'BIDIRECTIONAL_MODE'];

class App extends Component {
  static propTypes = { serial: PropTypes.shape({ checked: PropTypes.bool.isRequired }).isRequired };

  constructor() {
    super();

    this.serialApi = loadSerialApi();
    this.progressReferences = [];

    this.serial = undefined;
    this.lastConnected = 0;

    // Redefine the console and tee logs
    window.console.debug = (text, ...args) => {
      const msg = [text, args.join(' ')].join(' ');
      store.dispatch(addLog(msg));

      if(getAppSetting('printLogs')) {
        console.log(text, ...args);
      }
    };
  }

  async componentDidMount() {
    this.onMount(async() => {

      const uaParser = new UAParser();
      const browser = uaParser.getBrowser();
      const os = uaParser.getOS();
      this.addLogMessage('browser', {
        ...browser,
        os: os.name,
      });

      if (this.serialApi) {
        /**
         * Fetch configs in the background - some of them are fetched via
         * github API and might take some time to be fetched.
         */
        store.dispatch(fetchConfigs());

        this.serialApi.removeEventListener('connect', this.serialConnectHandler);
        this.serialApi.removeEventListener('disconnect', this.serialDisconnectHandler);

        this.serialApi.addEventListener('connect', this.serialConnectHandler);
        this.serialApi.addEventListener('disconnect', this.serialDisconnectHandler);

        this.serialConnectHandler();
      } else {
        store.dispatch(setChecked(true));
      }

      if(isEmbedded()) {
        window.addEventListener('message', this.parentMessageHandler);
        notifyParent('ready');
      }
    });
  }

  shouldComponentUpdate() {
    return true;
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.parentMessageHandler);
  }

  onMount(cb){
    cb();
  }

  /**
   * In embedded mode the parent page can ask to free the serial port, for
   * example before leaving the ESC tab. This is refused while reading,
   * writing or flashing.
   */
  parentMessageHandler = async(message) => {
    if(!isParentCommand(message, 'disconnect')) {
      return;
    }

    const {
      serial,
      state,
    } = store.getState();
    if(state.isReading || state.isWriting || state.isFlashing || state.isConnecting) {
      notifyParent('busy');
      return;
    }

    if(serial.open) {
      await this.handleDisconnect({ preventDefault: () => {} });
    } else {
      notifyParent('disconnected');
    }
  };

  serialConnectHandler = async() => {
    this.serial = undefined;
    let connected = false;

    const ports = await this.serialApi.getPorts();
    if(ports.length > 0) {
      this.addLogMessage('pluggedIn');
      connected = true;

      // Set the first  serial port as the active one
      this.serial = new Serial(ports[0]);
    }

    const portNames = ports.map((item) => {
      const info = item.getInfo();
      const name = `${info.usbVendorId}:${info.usbProductId}`;

      return name;
    });

    store.dispatch(setChecked(true));
    store.dispatch(setHasSerial(true));
    store.dispatch(setConnected(connected));
    store.dispatch(setPortNames(portNames));
    store.dispatch(setFourWay(false));
  };

  serialDisconnectHandler = async() => {
    this.addLogMessage('unplugged');
    this.lastConnected = 0;

    const availablePorts = await this.serialApi.getPorts();
    const portNames = availablePorts.map((item) => {
      const info = item.getInfo();
      const name = `${info.usbVendorId}:${info.usbProductId}`;

      return name;
    });

    this.serial.disconnect();

    store.dispatch(setConnecting(availablePorts.length > 0 ? true : false));
    store.dispatch(setPortNames(portNames));
    store.dispatch(setFourWay(false));
    store.dispatch(setOpen(false));
    store.dispatch(setIndividual([]));
    notifyParent('disconnected');
  };

  handleSetPort = async() => {
    try {
      const port = await this.serialApi.requestPort();
      this.serial = new Serial(port);

      this.addLogMessage('portSelected');

      const portNames = [port].map((item) => {
        const info = item.getInfo();
        const name = `${info.usbVendorId}:${info.usbProductId}`;

        return name;
      });

      store.dispatch(setConnected(true));
      store.dispatch(setPortNames(portNames));
    } catch (e) {
      // No port selected, do nothing
      console.debug(e);
    }
  };

  handleChangePort = async(index) => {
    const availablePorts = await this.serialApi.getPorts();
    this.serial = new Serial(availablePorts[index]);

    this.addLogMessage('portChanged');
  };

  handleConnect = async(e) => {
    e.preventDefault();

    store.dispatch(setConnecting(true));

    const serial = store.getState().serial;
    try {
      await this.serial.open(serial.baudRate);
      this.serial.setLogCallback(this.addLogMessage);
      this.addLogMessage('portOpened');
      this.progressReferences = [];

      /* Send a reset of the 4 way interface, just in case it was not cleanly
       * disconnected before.
       *
       * Unfortunately this convenience feature can not be used, since on EMU
       * it might lead to the ESCs being wiped.
       */
      // await this.serial.exitFourWayInterface();
    } catch (e) {
      console.debug(e);

      try {
        this.serial.close();
      } catch(e) {
        console.debug(e);
      }

      this.addLogMessage('portUsed');

      return;
    }

    try {
      let apiVersion = null;

      try {
        apiVersion = await this.serial.getApiVersion();
      } catch(e) {
        if (e instanceof TimeoutError) {
          let hasResets = false;
          let i = 0;

          try {
            while ((await this.serial.getFourWayInterfaceInfo(i))) {
              await this.serial.resetFourWayInterface(i);
              i += 1;
            }
          } catch (ex) {
            if (!(ex instanceof MessageNotOkError)) {
              this.addLogMessage('resetEscFailedPowerCycle', { index: i + 1 });
              throw ex;
            }
          } finally {
            hasResets = i > 0;
          }

          if (hasResets) {
            await this.serial.exitFourWayInterface();
          }

          apiVersion = await this.serial.getApiVersion();
        } else {
          throw e;
        }
      }

      this.addLogMessage('mspApiVersion', { version: apiVersion.apiVersion });

      const fcVariant = await this.serial.getFcVariant();
      const fcVersion = await this.serial.getFcVersion();
      this.addLogMessage('mspFcInfo', {
        id: fcVariant.flightControllerIdentifier,
        version: fcVersion.flightControllerVersion,
      });

      const buildInfo = await this.serial.getBuildInfo();
      this.addLogMessage('mspBuildInfo', { info: buildInfo.buildInfo });

      const boardInfo = await this.serial.getBoardInfo();
      this.addLogMessage('mspBoardInfo', {
        identifier: boardInfo.boardIdentifier,
        version: boardInfo.boardVersion,
      });

      const uid = (await this.serial.getUid()).uid;
      let uidHex = 0;
      for (let i = 0; i < uid.length; i += 1) {
        uidHex += uid[i].toString(16);
      }
      this.addLogMessage('mspUid', { id: uidHex });

      let motorData = await this.serial.getMotorData();
      motorData = motorData.filter((motor) => motor > 0);

      const features = await this.serial.getFeatures();
      store.dispatch(setMspFeatures(features));


      store.dispatch(setOpen(true));
      store.dispatch(setConnectedEscs(motorData.length));
      notifyParent('connected');
    } catch(e) {
      this.serial.close();
      this.addLogMessage('initializationFailed');

      console.log(e);
    }

    store.dispatch(setConnecting(false));
  };

  handleDisconnect = async(e) => {
    e.preventDefault();

    store.dispatch(setDisconnecting(true));

    const {
      escs,
      msp,
      serial,
    } = store.getState();
    const { individual } = escs;
    if(this.serial) {
      /**
       * Stop every motor first, while the port is still open: a motor test may
       * be running (for example when the ESC tab of TrueGlide Configurator is
       * left), and the flight controller keeps the last speed it received.
       * Not in passthrough (ESCs read): no motor test is possible then.
       */
      if(!serial.fourWay) {
        // Sent directly, with the 3D mode known since the connection: no
        // question to the flight controller first (B4). The port closing
        // below sends a second stop as a safety net.
        await this.handleAllMotorSpeed(msp.features['3D'] ? 1500 : 1000);
      }

      for(let i = 0; i < individual.length; i += 1) {
        try {
          await this.serial.resetFourWayInterface(i);
        } catch(e) {
          this.addLogMessage('resetEscFailed', { index: i + 1 });
        }
      }
      await this.serial.exitFourWayInterface();

      this.serial.close();
    }

    this.lastConnected = 0;

    store.dispatch(setFourWay(false));
    store.dispatch(setOpen(false));
    store.dispatch(resetState());
    store.dispatch(resetMelodyEditor());
    notifyParent('disconnected');
    store.dispatch(setIndividual([]));

    this.addLogMessage('closedPort');
  };

  addLogMessage = async(message, params = {}) => {
    store.dispatch(addMessageLog({
      message,
      params,
    }));
  };

  /**
   * Asks the pilot before an action that changes how the motors turn. Without
   * a dialog (tests, embedded without permission), the action goes on.
   */
  confirmAction = (key, params = {}) => {
    if(typeof window.confirm !== 'function') {
      return true;
    }

    return window.confirm(i18next.t(`common:${key}`, params) || `${key} ${Object.values(params).join(' ')}`);
  };

  /**
   * Saves the settings of the ESCs to a file before anything is flashed (M7).
   */
  saveSettingsBackup = () => {
    const { individual } = store.getState().escs;
    const backup = buildBackup(individual);
    if(backup.escs.length === 0) {
      return;
    }

    const fileName = backupFileName();
    if(downloadBackup(backup, fileName)) {
      this.addLogMessage('settingsBackupSaved', { fileName });
    } else {
      this.addLogMessage('settingsBackupFailed');
    }
  };

  /**
   * Writes back the settings of a backup file. Each ESC only gets the
   * settings saved for the same position, firmware and layout.
   */
  handleRestoreSettings = async(text) => {
    let backup = null;
    try {
      backup = parseBackup(text);
    } catch(e) {
      this.addLogMessage('settingsRestoreInvalid');
      return;
    }

    store.dispatch(setWriting(true));
    try {
      const { individual } = store.getState().escs;
      for(let i = 0; i < individual.length; i += 1) {
        const esc = individual[i];
        const rejected = [];
        const settings = getRestoredSettings(esc, backup, rejected);
        if(!settings) {
          this.addLogMessage('settingsRestoreSkipped', { index: esc.index + 1 });
          continue;
        }

        if(rejected.length > 0) {
          this.addLogMessage('settingsRestoreOutOfRange', {
            index: esc.index + 1,
            names: rejected.join(', '),
          });
        }

        try {
          await this.serial.writeSettings(esc.index, esc, settings);
          this.addLogMessage('settingsRestoreDone', { index: esc.index + 1 });
        } catch(e) {
          this.addLogMessage('writeSettingsFailed', { index: esc.index + 1 });
          console.debug(e);
        }
      }
    } finally {
      store.dispatch(setWriting(false));
    }

    await this.handleReadEscs();
  };

  flash = async(text, force, migration) => {
    try {
      this.saveSettingsBackup();
      await this.flashTargets(text, force, migration);
    } finally {
      // Never leave the interface locked in "flashing", whatever happened
      const { individual } = store.getState().escs;
      store.dispatch(setMaster(getMasterSettings(individual)));
      store.dispatch(setFlashing(false));
    }
  };

  flashTargets = async(text, force, migration) => {
    const {
      individual,
      targets,
    } = store.getState().escs;

    let failed = false;
    for(let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      const esc = individual.find((esc) => esc.index === target);

      // Decided for each ESC: a drone can mix ESCs (B1)
      if(isFlashBlocked(esc)) {
        this.addLogMessage('flashingEscSkippedUnsupported', { index: target + 1 });
        continue;
      }

      // The preflight throws when the file does not suit this ESC: nothing
      // has been written then.
      try {
        await this.serial.flashPreflight(esc, text, force);
      } catch(e) {
        console.debug('Preflight refused', e);
        this.addLogMessage('flashingEscRefused', { index: target + 1 });
        continue;
      }

      const updateProgress = async(percent) => {
        const ref = this.progressReferences[target];
        if(ref && ref.current) {
          ref.current.setProgress((percent));
        }
      };

      this.addLogMessage('flashingEsc', { index: target + 1 });
      let result = null;
      try {
        result = await this.serial.writeHex(target, esc, text, force, migration, updateProgress);
      } catch(e) {
        // ESC type that can not be flashed here (Atmel, unknown): nothing written (audit N3)
        console.debug('Flash not possible', e);
        updateProgress(0);
        this.addLogMessage('flashingEscTypeUnsupported', { index: target + 1 });
        continue;
      }
      updateProgress(0);

      if(result) {
        // The result can be the ESC from the store itself (refused flash),
        // which is read-only: never change it in place.
        const updated = {
          ...result,
          index: target,
        };
        const individualIndex = individual.findIndex((esc) => esc.index === target);

        store.dispatch(setIndividualAtIndex({
          index: individualIndex,
          settings: updated,
        }));
      } else {
        const stage = this.serial.getLastFlashError ? this.serial.getLastFlashError() : null;
        if(stage === 'check') {
          // Refused before anything was written (audit N2)
          this.addLogMessage('flashingEscRefused', { index: target + 1 });
        } else if(stage === 'settings') {
          this.addLogMessage('flashingEscSettingsNotRestored', { index: target + 1 });
        } else {
          this.addLogMessage('flashingEscFailed', { index: target + 1 });
          failed = true;
        }
      }
    }

    if(failed) {
      this.addLogMessage('flashRecoveryHelp');
    }
  };

  handleResetDefaultls = async() => {
    // Audit 07/11 B1 : asked first, settings saved first, rotation kept
    if(!this.confirmAction('confirmResetDefaults')) {
      return;
    }
    this.saveSettingsBackup();

    store.dispatch(setWriting(true));
    const { escs } = store.getState();
    for(let i = 0; i < escs.individual.length; i += 1) {
      const esc = escs.individual[i];
      const target = esc.index;

      // Nothing is ever written to a BLHeli_32 ESC (audit N1)
      if(isFlashBlocked(esc)) {
        this.addLogMessage('writeSettingsSkippedUnsupported', { index: target + 1 });
        continue;
      }

      const currentEscSettings = esc.settings;
      const defaultSettings = esc.defaultSettings;
      const mergedSettings = {
        ...currentEscSettings,
        ...defaultSettings,
      };

      // The direction (and the 3D mode) depend on how the drone is built:
      // never taken from the factory values.
      ROTATION_KEYS.forEach((key) => {
        if(currentEscSettings[key] !== undefined) {
          mergedSettings[key] = currentEscSettings[key];
        }
      });

      try {
        await this.serial.writeSettings(target, esc, mergedSettings);
      } catch(e) {
        this.addLogMessage('restoreSettingsFailed', { index: target + 1 });
        console.debug(e);
      }
    }
    store.dispatch(setWriting(false));

    this.handleReadEscs();
  };

  handleReadEsc = async(target) => {
    const settings = await this.serial.getFourWayInterfaceInfo(target);

    return settings;
  };

  handleReadEscs = async() => {
    const { escs } = store.getState();
    const individual = [];

    let fourWay = true;
    let connected = 0;

    store.dispatch(setReading(true));

    // Prevent reading if radio is detected to be on and not connected yet
    if(!escs.connected) {
      const status = await this.serial.getStatus();
      if(!status.armingDisableFlagsReasons.RX_FAILSAFE) {
        this.addLogMessage('radioOn');
        store.dispatch(setReading(false));

        return;
      }
    }

    try {
      if(this.lastConnected === 0) {
        const escs = await this.serial.enable4WayInterface();
        connected = escs.connectedESCs;

        await this.serial.startFourWayInterface();

        /* Give the ESCs some time to boot - it might take longer if they
         * are playing a startup melody.
         */
        await delay(1200);
      } else {
        connected = this.lastConnected;
      }
    } catch(e) {
      fourWay = false;

      this.addLogMessage('fourWayFailed');
      console.debug(e);
    }

    this.addLogMessage('readEscs', { connected });

    // Create progress references once
    if(this.progressReferences.length < 1) {
      for (let i = 0; i < connected; i += 1) {
        this.progressReferences[i] = React.createRef();
      }
    }

    for (let i = 0; i < connected; i += 1) {
      try {
        const settings = await this.handleReadEsc(i);
        settings.index = i;
        individual.push(settings);

        this.addLogMessage('readEsc', {
          index: i + 1,
          name: settings.displayName,
        });
      } catch(e) {
        this.addLogMessage('readEscFailed', { index: i + 1 });
        console.debug(e);
      }
    }

    if(individual.length > 0) {
      this.addLogMessage('readEscsSuccess');
    }

    this.lastConnected = connected;
    store.dispatch(setReading(false));
    store.dispatch(setFourWay(fourWay));

    // Set flashed melodies if available
    const master = getMasterSettings(individual);
    if(master && master.STARTUP_MELODY) {
      const melodies = individual.map((esc) => {
        if(esc.individualSettings.STARTUP_MELODY) {
          const melody = esc.individualSettings.STARTUP_MELODY;
          return Rtttl.fromBluejayStartupMelody(melody);
        }

        return "";
      });

      store.dispatch(updatatAllMelodies(melodies));
    }

    store.dispatch(setConnectedEscs(connected));
    store.dispatch(setIndividual(individual));
    store.dispatch(setMaster(master));
  };

  getMergedSettings = (esc, master) => {
    const commonEscSettings = esc.settings;
    let commonOverrides = {};
    if(getAppSetting('disableCommon')) {
      commonOverrides = commonEscSettings;
    }

    return {
      ...commonEscSettings,
      ...master,
      ...commonOverrides,
      ...esc.individualSettings,
    };
  };

  handleWriteSettings = async() => {
    const { escs } = store.getState();

    // Audit 07/11 M3 : a new direction or 3D mode is confirmed first
    const changed = escs.individual
      .filter((esc) => !isFlashBlocked(esc) && esc.settings)
      .filter((esc) => {
        const merged = this.getMergedSettings(esc, escs.master);
        return ROTATION_KEYS.some((key) => esc.settings[key] !== undefined &&
          String(merged[key]) !== String(esc.settings[key]));
      })
      .map((esc) => esc.index + 1);
    if(changed.length > 0 && !this.confirmAction('confirmRotationChange', { escs: changed.join(', ') })) {
      return;
    }

    store.dispatch(setWriting(true));

    const individual = [ ...escs.individual ];
    for(let i = 0; i < individual.length; i += 1) {
      const esc = individual[i];
      const target = esc.index;

      // Nothing is ever written to a BLHeli_32 ESC, melodies included (audit N1)
      if(isFlashBlocked(esc)) {
        this.addLogMessage('writeSettingsSkippedUnsupported', { index: target + 1 });
        continue;
      }

      const mergedSettings = this.getMergedSettings(esc, escs.master);

      try {
        await this.serial.writeSettings(target, esc, mergedSettings);

        const newInfo = await this.handleReadEsc(target);
        individual[i] = {
          ...individual[i],
          settingsArray: newInfo.settingsArray,
          settings: newInfo.settings,
          displayName: newInfo.displayName,
        };
      } catch(e) {
        this.addLogMessage('writeSettingsFailed', { index: target + 1 });
        console.debug(e);
      }
    }
    store.dispatch(setWriting(false));
    store.dispatch(setIndividual(individual));
  };

  handleFirmwareDump = async (target) => {
    const { escs } = store.getState();
    const esc = escs.individual.find((esc) => esc.index === target);

    // Nothing is ever read from a BLHeli_32 ESC (B1)
    if(isFlashBlocked(esc)) {
      this.addLogMessage('flashingEscSkippedUnsupported', { index: target + 1 });
      return;
    }

    const updateProgress = async(percent) => {
      if(esc.ref && esc.ref.current) {
        esc.ref.current.setProgress((percent));
      }
    };

    store.dispatch(setFlashing(true));

    this.addLogMessage('dumpingEsc', { index: target + 1 });
    const dataBin = await this.serial.readFirmware(target, esc, updateProgress);
    const binToHex = new BinToHex(16, 0x00, 0xFF);
    const dataHex = binToHex.convert(dataBin);
    updateProgress(0);

    store.dispatch(setFlashing(false));

    const element = document.createElement("a");
    const file = new Blob([dataHex], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "dump.hex";
    document.body.appendChild(element);
    element.click();
  };

  handleLocalSubmit = (e, force, migration) => {
    e.preventDefault();

    store.dispatch(setFlashing(true));
    store.dispatch(setSelecting(false));

    const reader = new FileReader();
    reader.onload = async (e) => {
      console.debug('Flashing local file');

      const text = (e.target.result);
      try {
        const integrity = await checkFirmware(null, text);
        this.addLogMessage(integrity === 'valid' ? 'firmwareLocalValidated' : 'firmwareLocalNotValidated');
        if(integrity !== 'valid' && !this.confirmAction('confirmUnvalidatedFirmware')) {
          this.addLogMessage('flashCancelled');
          store.dispatch(setFlashing(false));

          return;
        }
        await this.flash(text, force, migration);
      } catch(e) {
        console.error(e);
        store.dispatch(setFlashing(false));
      }
    };
    reader.readAsText(e.target.files[0]);
  };

  /**
   * Acquires the hex file from an URL. Before doing so, the local storage is
   * checked if the file already exists there, it is used, otherwise it is
   * downloaded and put into local storage for later use.
   */
  handleFlashUrl = async(url, layout, name, version, pwm, force, migration) => {
    store.dispatch(setFlashing(true));
    store.dispatch(setSelecting(false));

    console.debug(`Chosen firmware: ${url}`);

    let text = null;

    // A validated firmware is first taken from the TrueGlide copy (M1)
    const mirrorUrl = getMirrorUrl(url);
    if(mirrorUrl) {
      try {
        const mirrorText = await fetchHexDirect(mirrorUrl);
        if(await checkFirmware(url, mirrorText) === 'valid') {
          text = mirrorText;
          console.debug('Firmware taken from the TrueGlide copy');
        }
      } catch(e) {
        console.debug('TrueGlide copy not available', e);
      }
    }

    if(!text) {
      try {
        text = await fetchHexCached(url);
      } catch(e) {
        console.debug('Failed fetching firmware');
      }
    }

    if(text) {
      const integrity = await checkFirmware(url, text);
      if(integrity === 'mismatch') {
        this.addLogMessage('firmwareIntegrityFailed');
        await removeHexCached(url);
        store.dispatch(setFlashing(false));

        return;
      }
      this.addLogMessage(integrity === 'valid' ? 'firmwareIntegrityOk' : 'firmwareNotValidated');
      // Audit 07/11 M4 : a file TrueGlide did not validate needs an explicit yes
      if(integrity !== 'valid' && !this.confirmAction('confirmUnvalidatedFirmware')) {
        this.addLogMessage('flashCancelled');
        store.dispatch(setFlashing(false));

        return;
      }


      try {
        await this.flash(text, force, migration);
      } catch(e) {
        console.error(e);
      }
    } else {
      this.addLogMessage('getFileFailed');
      store.dispatch(setFlashing(false));
    }
  };

  /**
   * Last check before a speed reaches the flight controller, whatever the
   * screen sent: the motor test range (1000-1300, or 1350-1650 in 3D mode).
   */
  clampMotorSpeed = (speed) => {
    const is3D = Boolean(store.getState().msp.features['3D']);
    const center = is3D ? 1500 : 1000;
    const range = is3D ? 150 : 300;

    return Math.min(Math.max(speed, Math.max(1000, center - range)), center + range);
  };

  handleAllMotorSpeed = async(speed) => {
    // Also used to stop the motors when the page or the tab is left: the port
    // may already be closed then.
    try {
      await this.serial.spinAllMotors(this.clampMotorSpeed(speed));
    } catch(e) {
      console.debug('Could not set motor speed', e);
    }
  };

  handleSingleMotorSpeed = async(index, speed) => {
    await this.serial.spinMotor(index, this.clampMotorSpeed(speed));
  };

  handleMelodyWrite = (melodies) => {
    const { escs } = store.getState();
    let individual = [ ...escs.individual ];
    const converted = melodies.map((melody) => Array.from(Rtttl.toBluejayStartupMelody(melody).data));

    // Set wait time after melody to synchronize playback on all ESCs
    const melodyDurations = melodies.map((melody) => Rtttl.parse(melody).melody.reduce((a, b) => a + b.duration, 0));
    const maxMelodyDuration = Math.max(...melodyDurations);

    for(let i = 0; i < converted.length; i += 1) {
      const newIndividualSettings = {
        ...individual[i].individualSettings,
        STARTUP_MELODY: converted[i],
        STARTUP_MELODY_WAIT_MS: Math.ceil(maxMelodyDuration - melodyDurations[i]),
      };

      individual[i] = {
        ...individual[i],
        individualSettings: newIndividualSettings,
      };
    }

    // Update individual settings, then write them.
    store.dispatch(setIndividual(individual));
    store.dispatch(updatatAllMelodies(melodies));
    this.handleWriteSettings();
  };

  render() {
    const { serial } = this.props;

    if (!serial.checked) {
      return false;
    }

    return (
      <MainApp
        getBatteryState={this.serial ? this.serial.getBatteryState : null}
        getUtilization={this.serial ? this.serial.getUtilization : null}
        onAllMotorSpeed={this.handleAllMotorSpeed}
        onEscDump={this.handleFirmwareDump}
        onEscsFlashFile={this.handleLocalSubmit}
        onEscsFlashUrl={this.handleFlashUrl}
        onEscsRead={this.handleReadEscs}
        onEscsRestoreSettings={this.handleRestoreSettings}
        onEscsWriteDefaults={this.handleResetDefaultls}
        onEscsWriteSettings={this.handleWriteSettings}
        onMelodyWrite={this.handleMelodyWrite}
        onSerialConnect={this.handleConnect}
        onSerialDisconnect={this.handleDisconnect}
        onSerialPortChange={this.handleChangePort}
        onSerialSetPort={this.handleSetPort}
        onSingleMotorSpeed={this.handleSingleMotorSpeed}
        progressReferences={this.progressReferences}
      />
    );
  }
}

function mapStateToProps(state) {
  const serial = state.serial;

  return { serial };
}

export {
  App,
};
export default connect(mapStateToProps)(App);
