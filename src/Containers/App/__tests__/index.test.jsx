import React from 'react';
import {
  render, screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { store } from '../../../store';

import { fetch as fetchConfigs } from '../configsSlice';
import { set as setMspFeatures } from '../mspSlice';
import {
  setDisconnecting,
  setReading,
  setWriting,
  setSelecting,
  setFlashing,
  setConnecting,
  reset as resetState,
} from '../stateSlice';

let App;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('i18next', () => ({
  changeLanguage: () => null,
  t: () => null,
}));

// The confirmations (audit 07/11) are answered « yes » unless a test says otherwise
beforeEach(() => {
  window.confirm = jest.fn(() => true);
});

describe('App', () => {
  beforeAll(async () => {
    /**
     * require component instead of import so that we can properly
     * pre-populate the local storage
     */
    App = require('../').default;
  });

  test('should render container', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.queryByAltText(/Discord/i)).not.toBeInTheDocument();

    // Ensure that a warning is displayed when no web Serial is detected
    expect(screen.getByText(/is not supported on your browser/i)).toBeInTheDocument();

    // Ensure that the footer is there
    expect(screen.getByText(/statusbarPortUtilization/i)).toBeInTheDocument();
    expect(screen.getByText(/statusbarPacketError/i)).toBeInTheDocument();

    // Click the Settings
    userEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText(/settingsHeader/i)).toBeInTheDocument();

    // Open Melody editor
    userEvent.click(screen.getByRole('button', { name: /openMelodyEditor/i }));
    expect(screen.getByText(/melodyEditorHeader/i)).toBeInTheDocument();
  });

  test('should start the content below the whole header, log links included (v32)', () => {
    const height = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function() {
      return this.classList.contains('main__header') ? 166 : 0;
    });
    document.documentElement.style.removeProperty('--trueglide-header-height');

    const { unmount } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(document.documentElement.style.getPropertyValue('--trueglide-header-height')).toEqual('166px');

    // Window resized (no ResizeObserver in the test browser): measured again
    height.mockImplementation(function() {
      return this.classList.contains('main__header') ? 193 : 0;
    });
    window.dispatchEvent(new Event('resize'));
    expect(document.documentElement.style.getPropertyValue('--trueglide-header-height')).toEqual('193px');

    unmount();
    height.mockRestore();
  });
});

describe('configSlice', () => {
  it('should fetch configs', async() => {
    await store.dispatch(fetchConfigs());

    const configs = store.getState().configs;
    expect(configs.escs["BLHeli_S"]).not.toBeNull();
    expect(configs.escs["Bluejay"]).not.toBeNull();
  });
});

describe('mspSlice', () => {
  it('should set msp features', () => {
    store.dispatch(setMspFeatures({ feature: 'value' }));

    const msp = store.getState().msp;
    expect(msp.features.feature).toEqual('value');
  });
});

describe('stateSlice', () => {
  it('should change isReading', () => {
    let state = store.getState().state;
    expect(state.isReading).toBeFalsy();

    store.dispatch(setReading(true));

    state = store.getState().state;
    expect(state.isReading).toBeTruthy();
  });

  it('should change isWriting', () => {
    let state = store.getState().state;
    expect(state.isWriting).toBeFalsy();

    store.dispatch(setWriting(true));

    state = store.getState().state;
    expect(state.isWriting).toBeTruthy();
  });

  it('should change isSelecting', () => {
    let state = store.getState().state;
    expect(state.isSelecting).toBeFalsy();

    store.dispatch(setSelecting(true));

    state = store.getState().state;
    expect(state.isSelecting).toBeTruthy();
  });

  it('should change isFlashing', () => {
    let state = store.getState().state;
    expect(state.isFlashing).toBeFalsy();

    store.dispatch(setFlashing(true));

    state = store.getState().state;
    expect(state.isFlashing).toBeTruthy();
  });

  it('should change isConnecting', () => {
    let state = store.getState().state;
    expect(state.isConnecting).toBeFalsy();

    store.dispatch(setConnecting(true));

    state = store.getState().state;
    expect(state.isConnecting).toBeTruthy();
  });

  it('should change isDisconnecting', () => {
    let state = store.getState().state;
    expect(state.isDisconnecting).toBeFalsy();

    store.dispatch(setDisconnecting(true));

    state = store.getState().state;
    expect(state.isDisconnecting).toBeTruthy();
  });

  it('should reset state', () => {
    let state = store.getState().state;
    expect(state.isDisconnecting).toBeTruthy();

    store.dispatch(resetState());

    state = store.getState().state;
    expect(state.isDisconnecting).toBeFalsy();
  });
});
describe('App disconnect', () => {
  it('should stop all motors directly before closing the port', async() => {
    const { App: AppClass } = require('../');
    const { setFourWay } = require('../serialSlice');
    const app = new AppClass();
    const calls = [];
    const makeSerial = () => ({
      spinAllMotors: jest.fn(async(speed) => calls.push(`spin ${speed}`)),
      stopAllMotors: jest.fn(async() => calls.push('ask')),
      resetFourWayInterface: jest.fn(),
      exitFourWayInterface: jest.fn(),
      close: jest.fn(() => calls.push('close')),
    });

    store.dispatch(setFourWay(false));
    store.dispatch(setMspFeatures({ '3D': false }));
    app.serial = makeSerial();
    await app.handleDisconnect({ preventDefault: () => {} });
    // No question to the flight controller before the stop
    expect(calls[0]).toEqual('spin 1000');
    expect(calls).toContain('close');

    calls.length = 0;
    store.dispatch(setMspFeatures({ '3D': true }));
    app.serial = makeSerial();
    await app.handleDisconnect({ preventDefault: () => {} });
    expect(calls[0]).toEqual('spin 1500');
    store.dispatch(setMspFeatures({}));
  });

  it('should not send a motor command in passthrough', async() => {
    const { App: AppClass } = require('../');
    const { setFourWay } = require('../serialSlice');
    const app = new AppClass();
    const serial = {
      spinAllMotors: jest.fn(),
      stopAllMotors: jest.fn(),
      resetFourWayInterface: jest.fn(),
      exitFourWayInterface: jest.fn(),
      close: jest.fn(),
    };
    app.serial = serial;

    store.dispatch(setFourWay(true));
    await app.handleDisconnect({ preventDefault: () => {} });
    expect(serial.spinAllMotors).not.toHaveBeenCalled();
    expect(serial.stopAllMotors).not.toHaveBeenCalled();
    expect(serial.close).toHaveBeenCalled();
  });
});

describe('App flash', () => {
  const am32 = {
    index: 0,
    firmwareName: 'AM32',
    settings: { NAME: 'AM32' },
    meta: { available: true },
  };
  const blheli32 = {
    index: 1,
    firmwareName: 'BLHeli_32',
    settings: { NAME: 'BLHeli_32' },
    meta: { available: true },
  };

  it('should never flash nor dump a BLHeli_32 ESC in a mixed drone', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setTargets,
    } = require('../escsSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = {
      flashPreflight: jest.fn(),
      writeHex: jest.fn(async(target, esc) => ({ ...esc })),
      readFirmware: jest.fn(),
    };

    store.dispatch(setIndividual([am32, blheli32]));
    store.dispatch(setTargets([0, 1]));
    await app.flash(':00000001FF', false, 'same');

    expect(app.serial.writeHex).toHaveBeenCalledTimes(1);
    expect(app.serial.writeHex.mock.calls[0][0]).toEqual(0);
    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscSkippedUnsupported', { index: 2 });
    expect(store.getState().state.isFlashing).toBeFalsy();

    await app.handleFirmwareDump(1);
    expect(app.serial.readFirmware).not.toHaveBeenCalled();
  });

  it('should never write settings, defaults or melodies to a BLHeli_32 ESC', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = {
      writeSettings: jest.fn(),
      getFourWayInterfaceInfo: jest.fn(async() => ({ settings: {} })),
    };

    store.dispatch(setIndividual([am32, blheli32]));
    await app.handleWriteSettings();
    await app.handleResetDefaultls();

    expect(app.serial.writeSettings).toHaveBeenCalledTimes(2);
    app.serial.writeSettings.mock.calls.forEach((call) => expect(call[0]).toEqual(0));
    expect(app.addLogMessage).toHaveBeenCalledWith('writeSettingsSkippedUnsupported', { index: 2 });
    expect(store.getState().state.isWriting).toBeFalsy();
  });

  it('should unlock the interface when a flash is refused', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setTargets,
    } = require('../escsSlice');
    const { setFlashing } = require('../stateSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = {
      flashPreflight: jest.fn(async() => {
        throw new Error('Invalid MCU type in hex file.');
      }),
      writeHex: jest.fn(),
    };

    store.dispatch(setIndividual([am32]));
    store.dispatch(setTargets([0]));
    store.dispatch(setFlashing(true));
    await app.flash(':00000001FF', false, 'same');

    expect(app.serial.writeHex).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscRefused', { index: 1 });
    expect(store.getState().state.isFlashing).toBeFalsy();
  });

  it('should go on with every ESC when the flash is refused (essai TGE-P4)', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setTargets,
    } = require('../escsSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = {
      flashPreflight: jest.fn(),
      // A refused SiLabs flash gives back the ESC from the store, read-only
      writeHex: jest.fn(async(target, esc) => esc),
    };

    store.dispatch(setIndividual([0, 1, 2, 3].map((index) => ({
      ...am32,
      index,
    }))));
    store.dispatch(setTargets([0, 1, 2, 3]));
    await app.flash(':00000001FF', false, 'same');

    expect(app.serial.writeHex).toHaveBeenCalledTimes(4);
    expect(store.getState().state.isFlashing).toBeFalsy();
  });

  it('should report a failed flash and go on with the next ESC', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setTargets,
    } = require('../escsSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = {
      flashPreflight: jest.fn(),
      writeHex: jest.fn(async(target, esc) => (target === 0 ? null : { ...esc })),
    };

    store.dispatch(setIndividual([am32, {
      ...am32,
      index: 1,
    }]));
    store.dispatch(setTargets([0, 1]));
    await app.flash(':00000001FF', false, 'same');

    expect(app.serial.writeHex).toHaveBeenCalledTimes(2);
    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscFailed', { index: 1 });
    expect(app.addLogMessage).not.toHaveBeenCalledWith('flashingEscFailed', { index: 2 });
    expect(app.addLogMessage).toHaveBeenCalledWith('flashRecoveryHelp');
    expect(store.getState().state.isFlashing).toBeFalsy();
  });

  it('should give the right message for each kind of failed flash', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setTargets,
    } = require('../escsSlice');
    const stages = ['check', 'write', 'settings'];
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    let current = null;
    app.serial = {
      flashPreflight: jest.fn(),
      writeHex: jest.fn(async(target) => {
        current = stages[target];
        if(target === 3) {
          throw new Error('Unknown interface');
        }
        return null;
      }),
      getLastFlashError: jest.fn(() => current),
    };

    store.dispatch(setIndividual([0, 1, 2, 3].map((index) => ({
      ...am32,
      index,
    }))));
    store.dispatch(setTargets([0, 1, 2, 3]));
    await app.flash(':00000001FF', false, 'same');

    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscRefused', { index: 1 });
    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscFailed', { index: 2 });
    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscSettingsNotRestored', { index: 3 });
    expect(app.addLogMessage).toHaveBeenCalledWith('flashingEscTypeUnsupported', { index: 4 });
    expect(app.addLogMessage).not.toHaveBeenCalledWith('flashingEscFailed', { index: 1 });
    expect(app.addLogMessage).toHaveBeenCalledWith('flashRecoveryHelp');
    expect(store.getState().state.isFlashing).toBeFalsy();
  });

  it('should unlock the interface when the file can not be downloaded', async() => {
    const { App: AppClass } = require('../');
    const originalCaches = window.caches;
    const originalFetch = global.fetch;
    window.caches = {
      open: jest.fn(async() => ({
        match: jest.fn(async() => undefined),
        put: jest.fn(),
      })),
    };
    global.fetch = jest.fn(async() => ({
      ok: false,
      statusText: 'Not Found',
    }));

    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.flash = jest.fn();
    await app.handleFlashUrl('https://example.org/missing.hex', 'X', 'X', 'v1', '24', false, 'same');

    expect(app.flash).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('getFileFailed');
    expect(store.getState().state.isFlashing).toBeFalsy();

    window.caches = originalCaches;
    global.fetch = originalFetch;
  });
});

describe('App settings backup', () => {
  const bluejay = (index, beep) => ({
    index,
    firmwareName: 'Bluejay',
    layoutRevision: '208',
    settings: {
      NAME: 'Bluejay',
      LAYOUT: '#J_H_40#',
      BEEP_STRENGTH: beep,
    },
    meta: { available: true },
  });

  it('should save the settings before writing anything to the ESCs', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setTargets,
    } = require('../escsSlice');
    const order = [];
    const app = new AppClass();
    app.addLogMessage = jest.fn((message) => order.push(message));
    app.serial = {
      flashPreflight: jest.fn(),
      writeHex: jest.fn(async(target, esc) => {
        order.push('writeHex');
        return { ...esc };
      }),
    };

    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    store.dispatch(setIndividual([bluejay(0, 40)]));
    store.dispatch(setTargets([0]));
    await app.flash(':00000001FF', false, 'same');

    expect(click).toHaveBeenCalledTimes(1);
    expect(store.getState().escs.beforeFlash.escs[0].settings.BEEP_STRENGTH).toEqual(40);
    expect(order.indexOf('settingsBackupSaved')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('settingsBackupSaved')).toBeLessThan(order.indexOf('writeHex'));
    click.mockRestore();
  });

  it('should write back a backup only where it matches', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const otherTarget = {
      ...bluejay(1, 70),
      settings: {
        ...bluejay(1, 70).settings,
        LAYOUT: '#A_H_5#',
      },
    };
    const backup = buildBackup([bluejay(0, 60), otherTarget]);
    store.dispatch(setIndividual([bluejay(0, 40), bluejay(1, 40)]));
    await app.handleRestoreSettings(JSON.stringify(backup));

    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);
    expect(app.serial.writeSettings.mock.calls[0][0]).toEqual(0);
    expect(app.serial.writeSettings.mock.calls[0][2].BEEP_STRENGTH).toEqual(60);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreSkipped', { index: 2 });
    expect(app.handleReadEscs).toHaveBeenCalled();
    expect(store.getState().state.isWriting).toBeFalsy();

    app.serial.writeSettings.mockClear();
    await app.handleRestoreSettings('{"not":"a backup"}');
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreInvalid');
  });

  it('should put back the settings from before the flash on the new version only', async() => {
    const { App: AppClass } = require('../');
    const {
      setBeforeFlash, setIndividual,
    } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };
    const version = (esc, sub) => ({
      ...esc,
      settings: {
        ...esc.settings,
        MAIN_REVISION: 0,
        SUB_REVISION: sub,
      },
    });

    const backup = buildBackup([version(bluejay(0, 60), 19)]);
    store.dispatch(setIndividual([version(bluejay(0, 40), 20)]));

    // The same copy loaded from the disk: refused on another version
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreSkipped', { index: 1 });

    // The copy kept in memory during the flash
    store.dispatch(setBeforeFlash(backup));
    await app.handleRestoreBeforeFlash();
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);
    expect(app.serial.writeSettings.mock.calls[0][2].BEEP_STRENGTH).toEqual(60);
    expect(app.serial.writeSettings.mock.calls[0][2].SUB_REVISION).toEqual(20);
    store.dispatch(setBeforeFlash(null));
  });

  it('should not put back the settings from before the flash on other ESCs', async() => {
    const { App: AppClass } = require('../');
    const {
      setBeforeFlash, setIndividual,
    } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    store.dispatch(setBeforeFlash(buildBackup([bluejay(0, 60), bluejay(1, 60)])));

    store.dispatch(setIndividual([bluejay(0, 40)]));
    await app.handleRestoreBeforeFlash();

    const otherTarget = {
      ...bluejay(1, 40),
      settings: {
        ...bluejay(1, 40).settings,
        LAYOUT: '#A_H_5#',
      },
    };
    store.dispatch(setIndividual([bluejay(0, 40), otherTarget]));
    await app.handleRestoreBeforeFlash();

    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledTimes(2);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsBeforeFlashEscsChanged');
    store.dispatch(setBeforeFlash(null));
  });

  it('should refuse the settings from before the flash with an ESC not read, without failing', async() => {
    const { App: AppClass } = require('../');
    const {
      setBeforeFlash, setConnected, setIndividual,
    } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    store.dispatch(setBeforeFlash(buildBackup([bluejay(0, 60), bluejay(1, 60)])));
    store.dispatch(setIndividual([bluejay(0, 40), null]));
    await app.handleRestoreBeforeFlash();

    store.dispatch(setConnected(2));
    store.dispatch(setIndividual([bluejay(0, 40)]));
    await app.handleRestoreBeforeFlash();
    await app.handleRestoreSettings(JSON.stringify(buildBackup([bluejay(0, 60), bluejay(1, 60)])));

    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreEscNotRead', {
      read: 1,
      connected: 2,
    });
    store.dispatch(setConnected(0));
    store.dispatch(setBeforeFlash(null));
  });

  it('should write nothing from a version it does not know', async() => {
    const { App: AppClass } = require('../');
    const {
      setBeforeFlash, setIndividual,
    } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const unknown = {
      ...bluejay(0, 60),
      layoutRevision: '299',
    };
    store.dispatch(setBeforeFlash(buildBackup([unknown])));
    store.dispatch(setIndividual([bluejay(0, 40)]));
    await app.handleRestoreBeforeFlash();

    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreOutOfRange', {
      index: 1,
      names: 'BEEP_STRENGTH',
    });
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreNothingToWrite', { index: 1 });
    store.dispatch(setBeforeFlash(null));
  });

  it('should show the changes and save the settings before loading a file', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const order = [];
    const app = new AppClass();
    app.addLogMessage = jest.fn((message) => order.push(message));
    app.handleReadEscs = jest.fn();
    app.serial = {
      writeSettings: jest.fn(async() => {
        order.push('writeSettings');
      }),
    };
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const backup = buildBackup([bluejay(0, 60), bluejay(1, 40)]);
    store.dispatch(setIndividual([bluejay(0, 40), bluejay(1, 40)]));

    window.confirm = jest.fn(() => false);
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(window.confirm.mock.calls[0][0]).toMatch(/restorePreviewLine 1 escBeepStrength 40 60/);
    expect(window.confirm.mock.calls[0][0]).not.toMatch(/restorePreviewLine 2/);
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreCancelled');

    window.confirm = jest.fn(() => true);
    order.length = 0;
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(click).toHaveBeenCalledTimes(1);
    expect(order.indexOf('settingsBackupSavedRestore')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('settingsBackupSavedRestore')).toBeLessThan(order.indexOf('writeSettings'));
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreNothingToWrite', { index: 2 });

    click.mockRestore();
    delete window.confirm;
  });

  it('should write nothing when it can not ask, or can not save the settings first', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const backup = buildBackup([bluejay(0, 60)]);
    store.dispatch(setIndividual([bluejay(0, 40)]));

    const confirm = window.confirm;
    window.confirm = undefined;
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreCancelled');

    window.confirm = jest.fn(() => true);
    const createObjectURL = URL.createObjectURL;
    URL.createObjectURL = undefined;
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsBackupFailed');
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreNoBackup');

    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.handleReadEscs).not.toHaveBeenCalled();
    URL.createObjectURL = createObjectURL;
    window.confirm = confirm;
  });

  it('should start from the settings in the ESCs, not from a change on the screen', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    // 40 in the ESC, 90 on the screen (not written), 300 in the file (refused)
    app.keepEscSettings([bluejay(0, 40)]);
    store.dispatch(setIndividual([bluejay(0, 90)]));
    window.confirm = jest.fn(() => true);
    await app.handleRestoreSettings(JSON.stringify(buildBackup([bluejay(0, 300)])));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreOutOfRange', {
      index: 1,
      names: 'BEEP_STRENGTH',
    });
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreNothingToWrite', { index: 1 });
    app.escSettings = {};
    delete window.confirm;
  });

  it('should read back each ESC written, and offer to write back the settings saved before', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    // The ESC keeps what is written, except a beep strength of 60 that reads 55
    let inEsc = bluejay(0, 40);
    app.serial = {
      writeSettings: jest.fn(async(index, esc, settings) => {
        let beep = settings.BEEP_STRENGTH;
        if(beep === 60) {
          beep = 55;
        }

        inEsc = {
          ...esc,
          settings: {
            ...settings,
            BEEP_STRENGTH: beep,
          },
        };
      }),
    };
    app.handleReadEscs = jest.fn(async() => {
      store.dispatch(setIndividual([inEsc]));
      app.keepEscSettings([inEsc]);
    });
    store.dispatch(setIndividual([inEsc]));
    app.keepEscSettings([inEsc]);

    window.confirm = jest.fn(() => true);
    await app.handleRestoreSettings(JSON.stringify(buildBackup([bluejay(0, 60)])));

    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreMismatch', {
      index: 1,
      names: 'BEEP_STRENGTH',
    });
    expect(window.confirm).toHaveBeenCalledTimes(3);
    expect(window.confirm.mock.calls[1][0]).toMatch(/confirmRestoreAfterMismatch 1/);
    // Written back: the 40 saved before the first write, read back as written
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(2);
    expect(app.serial.writeSettings.mock.calls[1][2].BEEP_STRENGTH).toEqual(40);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreVerified', { index: 1 });

    app.escSettings = {};
    click.mockRestore();
    delete window.confirm;
  });

  it('should mark the low voltage cut as a TrueGlide rule, not a value of the file', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const blheliEeprom = require('../../../sources/Blheli/eeprom').default;
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const blheli = {
      index: 0,
      firmwareName: 'BLHeli',
      layout: blheliEeprom.LAYOUT,
      layoutRevision: '19',
      settings: {
        NAME: 'BLHeli',
        LAYOUT: '#TEST#',
        LOW_VOLTAGE_LIMIT: 3,
      },
      meta: { available: true },
    };
    store.dispatch(setIndividual([blheli]));

    window.confirm = jest.fn(() => false);
    await app.handleRestoreSettings(JSON.stringify(buildBackup([blheli])));

    expect(window.confirm).toHaveBeenCalledTimes(1);
    const text = window.confirm.mock.calls[0][0];
    expect(text).toMatch(/restorePreviewLowVoltageRule 1 3.1V\/c Off/);
    expect(text).not.toMatch(/restorePreviewLine/);
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    delete window.confirm;
  });

  it('should say when an ESC written is not read back', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    app.serial = { writeSettings: jest.fn() };
    app.handleReadEscs = jest.fn(async() => {
      store.dispatch(setIndividual([]));
    });
    store.dispatch(setIndividual([bluejay(0, 40)]));

    window.confirm = jest.fn((text) => !/confirmRestoreAfterMismatch/.test(text));
    await app.handleRestoreSettings(JSON.stringify(buildBackup([bluejay(0, 60)])));

    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreNotReadBack', { index: 1 });
    expect(window.confirm).toHaveBeenCalledTimes(2);
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);

    click.mockRestore();
    delete window.confirm;
  });

  it('should not write the direction of a file not checked on the bench', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const reversed = bluejay(0, 60);
    reversed.settings.MOTOR_DIRECTION = 2;
    const normal = bluejay(0, 40);
    normal.settings.MOTOR_DIRECTION = 1;
    store.dispatch(setIndividual([normal]));

    // The ESC is not really read back here: no write back after the difference
    window.confirm = jest.fn((question) => !/confirmRestoreAfterMismatch/.test(question));
    await app.handleRestoreSettings(JSON.stringify(buildBackup([reversed])));

    // No warning on the direction: it does not change
    const text = window.confirm.mock.calls[0][0];
    expect(text).toMatch(/restorePreviewRotationNotWritten 1/);
    expect(text).not.toMatch(/confirmRotationChange/);
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);
    expect(app.serial.writeSettings.mock.calls[0][2].MOTOR_DIRECTION).toEqual(1);
    expect(app.serial.writeSettings.mock.calls[0][2].BEEP_STRENGTH).toEqual(60);
    expect(app.addLogMessage).toHaveBeenCalledWith('checkMotorsOnBench');

    click.mockRestore();
    delete window.confirm;
  });

  it('should save the settings of the ESCs with the answer on the bench check', () => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const saved = [];
    const RealBlob = global.Blob;
    global.Blob = class {
      constructor(parts) {
        saved.push(JSON.parse(parts.join('')));
      }
    };

    // 40 in the ESC, 90 on the screen (not written)
    app.keepEscSettings([bluejay(0, 40)]);
    store.dispatch(setIndividual([bluejay(0, 90)]));

    window.confirm = jest.fn(() => true);
    app.handleSaveEscSettings();
    window.confirm = jest.fn(() => false);
    app.handleSaveEscSettings();
    window.confirm = undefined;
    app.handleSaveEscSettings();

    global.Blob = RealBlob;
    click.mockRestore();
    delete window.confirm;
    app.escSettings = {};

    expect(saved.map((backup) => backup.benchChecked)).toEqual([true, false, false]);
    expect(saved[0].benchCheckedDate).toBeDefined();
    expect(saved[1].benchCheckedDate).toBeUndefined();
    expect(saved[0].escs[0].settings.BEEP_STRENGTH).toEqual(40);
    expect(app.addLogMessage).toHaveBeenCalledWith('escSettingsSavedBench', expect.anything());
    expect(app.addLogMessage).toHaveBeenCalledWith('escSettingsSaved', expect.anything());
  });

  it('should write the direction kept in memory during the flash', async() => {
    const { App: AppClass } = require('../');
    const {
      setBeforeFlash, setIndividual,
    } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const reversed = bluejay(0, 40);
    reversed.settings.MOTOR_DIRECTION = 2;
    const normal = bluejay(0, 40);
    normal.settings.MOTOR_DIRECTION = 1;
    store.dispatch(setBeforeFlash(buildBackup([reversed])));
    store.dispatch(setIndividual([normal]));

    window.confirm = jest.fn((question) => !/confirmRestoreAfterMismatch/.test(question));
    await app.handleRestoreBeforeFlash();

    expect(window.confirm.mock.calls[0][0]).toMatch(/confirmRotationChange/);
    expect(app.serial.writeSettings.mock.calls[0][2].MOTOR_DIRECTION).toEqual(2);
    store.dispatch(setBeforeFlash(null));
    click.mockRestore();
    delete window.confirm;
  });

  it('should write nothing when the file has another number of ESCs', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const backup = buildBackup([bluejay(0, 60), bluejay(1, 60), bluejay(2, 60), bluejay(3, 60)]);
    store.dispatch(setIndividual([bluejay(0, 40), bluejay(1, 40)]));
    await app.handleRestoreSettings(JSON.stringify(backup));

    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreCountMismatch', {
      saved: 4,
      connected: 2,
    });
    expect(app.handleReadEscs).not.toHaveBeenCalled();
  });

  it('should ask before a backup changes the direction, and write nothing if refused', async() => {
    const { App: AppClass } = require('../');
    const { setIndividual } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const reversed = bluejay(0, 40);
    reversed.settings.MOTOR_DIRECTION = 2;
    const normal = bluejay(0, 40);
    normal.settings.MOTOR_DIRECTION = 1;
    // Checked on the bench: the direction may be written, after the question
    const backup = {
      ...buildBackup([reversed]),
      benchChecked: true,
    };
    store.dispatch(setIndividual([normal]));

    window.confirm = jest.fn(() => false);
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(window.confirm.mock.calls[0][0]).toMatch(/confirmRotationChange|1/);
    expect(app.serial.writeSettings).not.toHaveBeenCalled();

    window.confirm = jest.fn(() => true);
    await app.handleRestoreSettings(JSON.stringify(backup));
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);
    expect(app.serial.writeSettings.mock.calls[0][2].MOTOR_DIRECTION).toEqual(2);
    delete window.confirm;
  });

  it('should save the settings of the ESCs, not a common change not written yet', async() => {
    const { App: AppClass } = require('../');
    const {
      setIndividual,
      setMaster,
      updateIndividual,
    } = require('../escsSlice');
    const SettingsBackup = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const blobs = [];
    const OriginalBlob = global.Blob;
    global.Blob = jest.fn((parts) => {
      blobs.push(parts.join(''));
      return new OriginalBlob(parts);
    });

    const read = [bluejay(0, 9), bluejay(1, 9)];
    app.keepEscSettings(read);
    store.dispatch(setIndividual(read));
    store.dispatch(setMaster({ BEEP_STRENGTH: 20 }));
    store.dispatch(updateIndividual(['BEEP_STRENGTH']));
    expect(store.getState().escs.individual[0].settings.BEEP_STRENGTH).toEqual(20);

    app.saveSettingsBackup('settingsBackupSavedDefaults');

    const saved = SettingsBackup.parseBackup(blobs[blobs.length - 1]);
    expect(saved.escs.map((esc) => esc.settings.BEEP_STRENGTH)).toEqual([9, 9]);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsBackupSavedDefaults', expect.anything());
    global.Blob = OriginalBlob;
    click.mockRestore();
  });
});

describe('App firmware integrity', () => {
  const { webcrypto } = require('crypto');
  const { TextEncoder } = require('util');
  const testEntry = {
    url: 'https://example.org/releases/download/v1/TEST_24_v1.hex',
    file: 'test/v1/TEST_24_v1.hex',
    // SHA-256 of "abc"
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const mirrorUrl = 'https://jschmiedd.github.io/TrueGlide-ESC-Configurator/firmwares/test/v1/TEST_24_v1.hex';
  const originalCrypto = window.crypto;
  const originalFetch = global.fetch;
  const originalCaches = window.caches;

  const setup = (answers) => {
    global.fetch = jest.fn(async(url) => {
      const text = answers[url];
      return {
        ok: text !== undefined,
        statusText: 'test',
        text: async() => text,
        clone() {
          return this;
        },
        headers: new Map(),
      };
    });
    const cache = {
      match: jest.fn(async() => undefined),
      put: jest.fn(),
      delete: jest.fn(),
    };
    window.caches = { open: jest.fn(async() => cache) };
    window.Headers = jest.fn(() => ({ set: jest.fn() }));
    window.Response = jest.fn(() => ({
      ok: true,
      text: async() => '',
    }));

    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.flash = jest.fn();

    return {
      app,
      cache,
    };
  };

  beforeAll(() => {
    const { VALIDATED } = require('../../../utils/FirmwareIntegrity');
    if(typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = TextEncoder;
    }
    Object.defineProperty(window, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
    VALIDATED.push(testEntry);
  });

  afterAll(() => {
    const { VALIDATED } = require('../../../utils/FirmwareIntegrity');
    VALIDATED.pop();
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
    global.fetch = originalFetch;
    window.caches = originalCaches;
  });

  it('should flash a validated file from the TrueGlide copy', async() => {
    const { app } = setup({ [mirrorUrl]: 'abc' });
    await app.handleFlashUrl(testEntry.url, 'TEST', 'Test', 'v1', '24', false, 'same');

    expect(global.fetch.mock.calls[0][0]).toEqual(mirrorUrl);
    expect(app.addLogMessage).toHaveBeenCalledWith('firmwareIntegrityOk');
    expect(app.flash).toHaveBeenCalledWith('abc', false, 'same');
  });

  it('should never flash an altered validated file', async() => {
    const { app } = setup({
      [mirrorUrl]: 'abd',
      [`https://cors.bubblesort.me/?${testEntry.url}`]: 'abd',
    });
    await app.handleFlashUrl(testEntry.url, 'TEST', 'Test', 'v1', '24', false, 'same');

    expect(app.flash).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('firmwareIntegrityFailed');
    expect(store.getState().state.isFlashing).toBeFalsy();
  });

  it('should fall back to the publisher when the copy is missing', async() => {
    const { app } = setup({ [`https://cors.bubblesort.me/?${testEntry.url}`]: 'abc' });
    await app.handleFlashUrl(testEntry.url, 'TEST', 'Test', 'v1', '24', false, 'same');

    expect(app.addLogMessage).toHaveBeenCalledWith('firmwareIntegrityOk');
    expect(app.flash).toHaveBeenCalledWith('abc', false, 'same');
  });

  it('should not flash a file that is not validated without a yes', async() => {
    const url = 'https://example.org/other.hex';
    const { app } = setup({ [`https://cors.bubblesort.me/?${url}`]: 'xyz' });
    window.confirm = jest.fn(() => false);
    await app.handleFlashUrl(url, 'TEST', 'Test', 'v1', '24', false, 'same');

    expect(app.flash).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('flashCancelled');
    expect(store.getState().state.isFlashing).toBeFalsy();
  });

  it('should warn before flashing a file that is not validated', async() => {
    const url = 'https://example.org/other.hex';
    const { app } = setup({ [`https://cors.bubblesort.me/?${url}`]: 'xyz' });
    await app.handleFlashUrl(url, 'TEST', 'Test', 'v1', '24', false, 'same');

    expect(app.addLogMessage).toHaveBeenCalledWith('firmwareNotValidated');
    expect(app.flash).toHaveBeenCalledWith('xyz', false, 'same');
  });
});

describe('App audit 07/11', () => {
  const bluejay = (index, direction) => ({
    index,
    firmwareName: 'Bluejay',
    layoutRevision: '206',
    settings: {
      NAME: 'Bluejay',
      LAYOUT: '#J_H_40#',
      MOTOR_DIRECTION: direction,
      BEEP_STRENGTH: 40,
    },
    defaultSettings: {
      MOTOR_DIRECTION: 1,
      BEEP_STRENGTH: 80,
    },
    individualSettings: { MOTOR_DIRECTION: direction },
    meta: { available: true },
  });

  const makeApp = () => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.handleReadEsc = jest.fn(async() => ({ settings: {} }));
    app.saveSettingsBackup = jest.fn();
    app.serial = { writeSettings: jest.fn() };
    return app;
  };

  it('should ask, save and keep the direction before restoring the defaults', async() => {
    const { setIndividual } = require('../escsSlice');
    store.dispatch(setIndividual([bluejay(0, 2), bluejay(1, 2)]));
    const app = makeApp();

    window.confirm = jest.fn(() => false);
    await app.handleResetDefaultls();
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(app.saveSettingsBackup).not.toHaveBeenCalled();

    window.confirm = jest.fn(() => true);
    await app.handleResetDefaultls();
    expect(app.saveSettingsBackup).toHaveBeenCalledTimes(1);
    expect(app.saveSettingsBackup).toHaveBeenCalledWith('settingsBackupSavedDefaults');
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(2);
    const written = app.serial.writeSettings.mock.calls[0][2];
    expect(written.BEEP_STRENGTH).toEqual(80);
    expect(written.MOTOR_DIRECTION).toEqual(2);
  });

  it('should ask before writing a new direction', async() => {
    const { setIndividual } = require('../escsSlice');
    const changed = {
      ...bluejay(1, 2),
      individualSettings: { MOTOR_DIRECTION: 1 },
    };
    store.dispatch(setIndividual([bluejay(0, 2), changed]));
    const app = makeApp();

    window.confirm = jest.fn(() => false);
    await app.handleWriteSettings();
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(window.confirm.mock.calls[0][0]).toContain('2');
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(store.getState().state.isWriting).toBeFalsy();
  });

  // A common setting changed first: every ESC keeps its own direction
  const changeCommonSetting = (escs) => {
    const {
      setIndividual, setMaster, updateIndividual,
    } = require('../escsSlice');
    store.dispatch(setIndividual(escs));
    store.dispatch(setMaster({
      ...escs[0].settings,
      BEEP_STRENGTH: 60,
    }));
    store.dispatch(updateIndividual(['BEEP_STRENGTH']));
  };

  it('should keep the direction of each ESC when restoring the defaults after a common change', async() => {
    changeCommonSetting([bluejay(0, 1), bluejay(1, 2)]);
    const app = makeApp();

    window.confirm = jest.fn(() => true);
    await app.handleResetDefaultls();
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(2);
    expect(app.serial.writeSettings.mock.calls[0][2].MOTOR_DIRECTION).toEqual(1);
    expect(app.serial.writeSettings.mock.calls[1][2].MOTOR_DIRECTION).toEqual(2);
  });

  it('should ask before writing a new direction after a common change', async() => {
    changeCommonSetting([
      bluejay(0, 1),
      {
        ...bluejay(1, 2),
        individualSettings: { MOTOR_DIRECTION: 1 },
      },
    ]);
    const app = makeApp();

    window.confirm = jest.fn(() => false);
    await app.handleWriteSettings();
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
  });

  it('should only give the common settings to the other ESCs', () => {
    changeCommonSetting([bluejay(0, 1), bluejay(1, 2)]);

    const [, second] = store.getState().escs.individual;
    expect(second.settings.BEEP_STRENGTH).toEqual(60);
    expect(second.settings.MOTOR_DIRECTION).toEqual(2);
  });

  it('should not ask when the direction does not change', async() => {
    const { setIndividual } = require('../escsSlice');
    store.dispatch(setIndividual([bluejay(0, 2)]));
    const app = makeApp();

    window.confirm = jest.fn(() => false);
    await app.handleWriteSettings();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(app.serial.writeSettings).toHaveBeenCalledTimes(1);
  });
});

describe('App motor speed during a disconnection', () => {
  it('should never start a motor again once the disconnection has begun', async() => {
    const { App: AppClass } = require('../');
    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    const { setIndividual } = require('../escsSlice');
    store.dispatch({ type: 'state/reset' });
    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(false));
    store.dispatch(setIndividual([]));
    store.dispatch(setMspFeatures({ '3D': false }));

    const app = new AppClass();
    const sent = [];
    let finishExit = null;
    app.serial = {
      spinAllMotors: jest.fn(async(speed) => sent.push(speed)),
      spinMotor: jest.fn(async(index, speed) => sent.push(speed)),
      // cmd_InterfaceExit gets no answer from the board: it takes seconds
      exitFourWayInterface: jest.fn(() => new Promise((resolve) => {
        finishExit = resolve;
      })),
      resetFourWayInterface: jest.fn(),
      close: jest.fn(),
    };

    // A motor runs
    await app.handleAllMotorSpeed(1150);
    expect(sent).toEqual([1150]);

    const disconnecting = app.handleDisconnect({ preventDefault: () => {} });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sent[sent.length - 1]).toEqual(1000);

    // The screen still sends the last speed (keep-alive) while the exit hangs
    await app.handleAllMotorSpeed(1150);
    await app.handleSingleMotorSpeed(0, 1150);
    expect(sent.filter((speed) => speed > 1000)).toEqual([1150]);

    finishExit();
    await disconnecting;
    await app.handleAllMotorSpeed(1150);
    expect(sent.filter((speed) => speed > 1000)).toEqual([1150]);
  });
});

describe('App read while the motors run', () => {
  it('should stop the motors and get the answer before the passthrough', async() => {
    const { App: AppClass } = require('../');
    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    const { setConnected } = require('../escsSlice');
    store.dispatch({ type: 'state/reset' });
    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(false));
    store.dispatch(setConnected(0));
    store.dispatch(setMspFeatures({ '3D': false }));

    const app = new AppClass();
    app.addLogMessage = jest.fn();
    const events = [];
    app.serial = {
      spinAllMotors: jest.fn(async(speed) => events.push(`speed ${speed}`)),
      spinMotor: jest.fn(async(index, speed) => events.push(`speed ${speed}`)),
      getStatus: jest.fn(async() => {
        events.push('status');
        return { armingDisableFlagsReasons: { RX_FAILSAFE: true } };
      }),
      enable4WayInterface: jest.fn(async() => {
        events.push('passthrough');
        // The motor panel disappears with the read and sends its own stop,
        // which reaches the board after the switch (essai du 08/11)
        await app.handleAllMotorSpeed(1000);
        return { connectedESCs: 0 };
      }),
      startFourWayInterface: jest.fn(),
    };

    await app.handleAllMotorSpeed(1150);
    await app.handleReadEscs();

    // The stop is sent (and answered) before the passthrough, nothing after
    const passthrough = events.indexOf('passthrough');
    expect(events.indexOf('speed 1000')).toBeGreaterThanOrEqual(0);
    expect(events.indexOf('speed 1000')).toBeLessThan(passthrough);
    expect(events.slice(passthrough).filter((event) => event.startsWith('speed'))).toEqual([]);
  });
});

describe('App read while the motors run, speed sent during the stop', () => {
  it.each([
    [false, 1000],
    [true, 1500],
  ])('should never send a speed after the read begins (3D %s)', async(is3D, stop) => {
    const { App: AppClass } = require('../');
    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    const { setConnected } = require('../escsSlice');
    store.dispatch({ type: 'state/reset' });
    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(false));
    store.dispatch(setConnected(4));
    store.dispatch(setMspFeatures({ '3D': is3D }));

    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.lastConnected = 4;
    app.handleReadEsc = jest.fn(async() => {
      throw new Error('no ESC in this test');
    });
    const events = [];
    let answerStop = null;
    app.serial = {
      spinAllMotors: jest.fn((speed) => {
        events.push(`speed ${speed}`);
        if(speed === stop) {
          // The stop waits for its answer: a keep-alive tick comes now
          return new Promise((resolve) => {
            answerStop = resolve;
          });
        }
        return Promise.resolve();
      }),
      spinMotor: jest.fn(async(index, speed) => events.push(`speed ${speed}`)),
    };

    const running = is3D ? 1600 : 1150;
    await app.handleAllMotorSpeed(running);
    const reading = app.handleReadEscs();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Keep-alive tick and single motor while the stop is on its way
    await app.handleAllMotorSpeed(running);
    await app.handleSingleMotorSpeed(0, running);
    answerStop();
    await reading;

    expect(events).toEqual([`speed ${running}`, `speed ${stop}`]);
  });
});

describe('App read without answer from the board', () => {
  it('should not leave the screen locked when the status can not be read', async() => {
    const { App: AppClass } = require('../');
    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    const { setConnected } = require('../escsSlice');
    store.dispatch({ type: 'state/reset' });
    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(false));
    store.dispatch(setConnected(0));

    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = {
      spinAllMotors: jest.fn(),
      getStatus: jest.fn(async() => {
        throw new Error('Timed out');
      }),
      enable4WayInterface: jest.fn(),
    };

    await app.handleReadEscs();

    expect(store.getState().state.isReading).toBeFalsy();
    expect(app.serial.enable4WayInterface).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('readEscsFailed');
  });
});

describe('App motor speed', () => {
  it('should never send more than the motor test range', async() => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.serial = {
      spinAllMotors: jest.fn(),
      spinMotor: jest.fn(),
    };

    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    store.dispatch({ type: 'state/reset' });
    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(false));
    store.dispatch(setMspFeatures({ '3D': false }));
    await app.handleAllMotorSpeed(2000);
    await app.handleSingleMotorSpeed(1, 1900);
    expect(app.serial.spinAllMotors).toHaveBeenLastCalledWith(1300);
    expect(app.serial.spinMotor).toHaveBeenLastCalledWith(1, 1300);

    store.dispatch(setMspFeatures({ '3D': true }));
    await app.handleAllMotorSpeed(2000);
    await app.handleAllMotorSpeed(1000);
    expect(app.serial.spinAllMotors).toHaveBeenNthCalledWith(2, 1650);
    expect(app.serial.spinAllMotors).toHaveBeenNthCalledWith(3, 1350);
    store.dispatch(setMspFeatures({}));
  });
});

describe('App connection with a slow flight controller', () => {
  const { TimeoutError } = require('../../../utils/helpers/QueueProcessor');
  const { MspAnswerError } = require('../../../utils/Errors');

  const makeSerial = (getApiVersion, getFourWayInterfaceInfo) => ({
    open: jest.fn(),
    setLogCallback: jest.fn(),
    close: jest.fn(),
    getApiVersion: jest.fn(getApiVersion),
    getFourWayInterfaceInfo: jest.fn(getFourWayInterfaceInfo),
    resetFourWayInterface: jest.fn(),
    exitFourWayInterface: jest.fn(),
    getFcVariant: jest.fn(async() => ({ flightControllerIdentifier: 'BTFL' })),
    getFcVersion: jest.fn(async() => ({ flightControllerVersion: '4.5.0' })),
    getBuildInfo: jest.fn(async() => ({ buildInfo: 'x' })),
    getBoardInfo: jest.fn(async() => ({
      boardIdentifier: 'S7X2',
      boardVersion: 0,
    })),
    getUid: jest.fn(async() => ({ uid: [1, 2] })),
    getMotorData: jest.fn(async() => [1000, 1000, 1000, 1000]),
    getFeatures: jest.fn(async() => ({ '3D': false })),
    setMotorStopValue: jest.fn(),
  });

  it('should keep the motors not spun individually at the 3D neutral', async() => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = makeSerial(async() => ({ apiVersion: '1.46.0' }), async() => true);
    app.serial.getFeatures = jest.fn(async() => ({ '3D': true }));

    await app.handleConnect({ preventDefault: () => {} });

    expect(app.serial.setMotorStopValue).toHaveBeenCalledWith(1500);
    expect(app.addLogMessage).toHaveBeenCalledWith('motorStopValue', { value: 1500 });
    store.dispatch(setMspFeatures({}));
  });

  it('should forget the settings from before a flash on a new connection', async() => {
    const { App: AppClass } = require('../');
    const { setBeforeFlash } = require('../escsSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = makeSerial(async() => ({ apiVersion: '1.46.0' }), async() => true);

    store.dispatch(setBeforeFlash({ escs: [] }));
    await app.handleConnect({ preventDefault: () => {} });

    expect(store.getState().escs.beforeFlash).toBeNull();
  });

  it('should not connect nor set a stop value when the features are not read', async() => {
    const { App: AppClass } = require('../');
    const { setOpen } = require('../serialSlice');
    store.dispatch(setOpen(false));
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = makeSerial(async() => ({ apiVersion: '1.46.0' }), async() => true);
    app.serial.getFeatures = jest.fn(async() => {
      throw new Error('Timed out after 1000ms');
    });

    await app.handleConnect({ preventDefault: () => {} });

    expect(app.serial.setMotorStopValue).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('initializationFailed');
    expect(store.getState().serial.open).toBeFalsy();
  });

  it('should ask again when one answer is late, without trying the passthrough', async() => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    let calls = 0;
    app.serial = makeSerial(async() => {
      calls += 1;
      if(calls === 1) {
        throw new TimeoutError('Timed out after 1000ms');
      }

      return { apiVersion: '1.46.0' };
    }, async() => true);

    await app.handleConnect({ preventDefault: () => {} });

    expect(app.serial.getFourWayInterfaceInfo).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('mspApiVersion', { version: '1.46.0' });
    expect(app.addLogMessage).not.toHaveBeenCalledWith('initializationFailed');
    expect(store.getState().serial.open).toBeTruthy();
  });

  it('should take an MSP answer to the passthrough test for a flight controller not in passthrough', async() => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    let calls = 0;
    app.serial = makeSerial(async() => {
      calls += 1;
      if(calls <= 3) {
        throw new TimeoutError('Timed out after 1000ms');
      }

      return { apiVersion: '1.46.0' };
    }, async() => {
      throw new MspAnswerError('MSP answer instead of a 4-way message');
    });

    await app.handleConnect({ preventDefault: () => {} });

    expect(app.addLogMessage).not.toHaveBeenCalledWith('resetEscFailedPowerCycle', expect.anything());
    expect(app.addLogMessage).not.toHaveBeenCalledWith('initializationFailed');
    expect(app.serial.resetFourWayInterface).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('mspApiVersion', { version: '1.46.0' });
  });

  it('should still try the passthrough when the flight controller never answers in MSP', async() => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = makeSerial(async() => {
      throw new TimeoutError('Timed out after 1000ms');
    }, async() => {
      throw new TimeoutError('Timed out after 1000ms');
    });

    await app.handleConnect({ preventDefault: () => {} });

    // 3 attempts, then the passthrough test, which fails: no further question
    expect(app.serial.getApiVersion).toHaveBeenCalledTimes(3);
    expect(app.serial.getFourWayInterfaceInfo).toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('resetEscFailedPowerCycle', { index: 1 });
    expect(app.addLogMessage).toHaveBeenCalledWith('initializationFailed');
  });

  it('should wait for the answer to exit after a passthrough and ask the API version again', async() => {
    const { App: AppClass } = require('../');
    const { MessageNotOkError } = require('../../../utils/Errors');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    // Silent for 3 requests (left in passthrough), then once more right after
    // leaving the passthrough, then answering
    let apiCalls = 0;
    let infoCalls = 0;
    app.serial = makeSerial(async() => {
      apiCalls += 1;
      if(apiCalls <= 4) {
        throw new TimeoutError('Timed out after 1000ms');
      }

      return { apiVersion: '1.46.0' };
    }, async() => {
      infoCalls += 1;
      if(infoCalls > 1) {
        throw new MessageNotOkError('Message not OK');
      }

      return {};
    });

    await app.handleConnect({ preventDefault: () => {} });

    expect(app.serial.exitFourWayInterface).toHaveBeenCalledWith(true);
    expect(app.serial.getApiVersion).toHaveBeenCalledTimes(5);
    expect(app.addLogMessage).not.toHaveBeenCalledWith('initializationFailed');
    expect(app.addLogMessage).toHaveBeenCalledWith('mspApiVersion', { version: '1.46.0' });
  });

  it('should leave the passthrough even when no ESC answers (ESCs not powered)', async() => {
    const { App: AppClass } = require('../');
    const { MessageNotOkError } = require('../../../utils/Errors');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    let apiCalls = 0;
    app.serial = makeSerial(async() => {
      apiCalls += 1;
      if(apiCalls <= 3) {
        throw new TimeoutError('Timed out after 1000ms');
      }

      return { apiVersion: '1.46.0' };
    }, async() => {
      throw new MessageNotOkError('Message not OK');
    });

    await app.handleConnect({ preventDefault: () => {} });

    expect(app.serial.resetFourWayInterface).not.toHaveBeenCalled();
    expect(app.addLogMessage).toHaveBeenCalledWith('passthroughLeft');
    expect(app.serial.exitFourWayInterface).toHaveBeenCalledWith(true);
    expect(app.addLogMessage).not.toHaveBeenCalledWith('initializationFailed');
    expect(app.addLogMessage).toHaveBeenCalledWith('mspApiVersion', { version: '1.46.0' });
  });
});

describe('App disconnecting after a passthrough', () => {
  const setup = (fourWay, exit) => {
    const { App: AppClass } = require('../');
    const { setFourWay } = require('../serialSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = {
      spinAllMotors: jest.fn(),
      resetFourWayInterface: jest.fn(),
      exitFourWayInterface: jest.fn(exit),
      close: jest.fn(),
    };
    store.dispatch(setFourWay(fourWay));

    return app;
  };

  it('should wait for the answer to exit after a passthrough', async() => {
    const app = setup(true, () => Promise.resolve());

    await app.handleDisconnect({ preventDefault: () => {} });

    expect(app.serial.exitFourWayInterface).toHaveBeenCalledWith(true);
    expect(app.serial.close).toHaveBeenCalled();
  });

  it('should not wait for an answer to exit without a passthrough', async() => {
    const app = setup(false, () => Promise.resolve());

    await app.handleDisconnect({ preventDefault: () => {} });

    expect(app.serial.exitFourWayInterface).toHaveBeenCalledWith(false);
  });

  it('should close the port even without an answer to exit', async() => {
    const { TimeoutError } = require('../../../utils/helpers/QueueProcessor');
    const app = setup(true, () => Promise.reject(new TimeoutError('Timed out after 1000ms')));

    await app.handleDisconnect({ preventDefault: () => {} });

    expect(app.serial.close).toHaveBeenCalled();
    const { setFourWay } = require('../serialSlice');
    store.dispatch(setFourWay(false));
  });
});

describe('App writing common settings', () => {
  const bluejay = (index, revision, pwm) => ({
    index,
    firmwareName: 'Bluejay',
    layoutRevision: revision,
    settings: {
      LAYOUT_REVISION: Number(revision),
      PWM_FREQUENCY: pwm,
      BEEP_STRENGTH: 40,
      MOTOR_DIRECTION: 2,
    },
    individualSettings: { MOTOR_DIRECTION: 2 },
  });

  it('should keep the PWM frequency each ESC was flashed with (Bluejay 0.19)', () => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    // ESC 1 to 3 built for 48 kHz, ESC 4 flashed with the 24 kHz file
    const master = {
      ...bluejay(0, '206', 48).settings,
      BEEP_STRENGTH: 60,
    };

    const merged = app.getMergedSettings(bluejay(3, '206', 24), master);
    expect(merged.PWM_FREQUENCY).toEqual(24);
    // A common setting changed on the screen still goes to every ESC
    expect(merged.BEEP_STRENGTH).toEqual(60);
  });

  it('should still copy the PWM frequency where it is a common setting (Bluejay 0.18)', () => {
    const { App: AppClass } = require('../');
    const app = new AppClass();
    const master = bluejay(0, '205', 48).settings;

    const merged = app.getMergedSettings(bluejay(3, '205', 24), master);
    expect(merged.PWM_FREQUENCY).toEqual(48);
  });
});

describe('App disconnect waits for the port to close', () => {
  it('should log the closed port only once the port is closed', async() => {
    const { App: AppClass } = require('../');
    const { setFourWay } = require('../serialSlice');
    const app = new AppClass();
    const calls = [];
    app.addLogMessage = jest.fn((message) => calls.push(message));
    app.serial = {
      spinAllMotors: jest.fn(),
      resetFourWayInterface: jest.fn(),
      exitFourWayInterface: jest.fn(),
      close: jest.fn(() => new Promise((resolve) => setTimeout(() => {
        calls.push('port closed');
        resolve();
      }, 50))),
    };

    store.dispatch(setFourWay(true));
    await app.handleDisconnect({ preventDefault: () => {} });
    store.dispatch(setFourWay(false));

    expect(calls.indexOf('port closed')).toBeGreaterThan(-1);
    expect(calls.indexOf('port closed')).toBeLessThan(calls.indexOf('closedPort'));
  });
});

describe('App with an ESC in FLASH*FAILED', () => {
  const esc = (index, name, beep) => ({
    index,
    firmwareName: 'Bluejay',
    layoutRevision: '206',
    meta: { available: true },
    settings: {
      NAME: name,
      BEEP_STRENGTH: beep,
      MOTOR_DIRECTION: 2,
    },
    individualSettings: { MOTOR_DIRECTION: 2 },
    defaultSettings: { BEEP_STRENGTH: 40 },
  });

  // ESC 1 is in FLASH*FAILED, ESC 2 to 4 are healthy
  const escs = () => [
    esc(0, '**FLASH*FAILED**', 10),
    esc(1, 'Bluejay', 77),
    esc(2, 'Bluejay', 40),
    esc(3, 'Bluejay', 40),
  ];

  const setup = () => {
    const { App: AppClass } = require('../');
    const {
      setIndividual, setMaster,
    } = require('../escsSlice');
    const { getMasterSettings } = require('../../../utils/helpers/Settings');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.saveSettingsBackup = jest.fn();
    app.confirmAction = jest.fn(() => true);
    app.handleReadEsc = jest.fn(async() => ({
      settingsArray: [],
      settings: {},
      displayName: '',
    }));
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const individual = escs();
    store.dispatch(setIndividual(individual));
    store.dispatch(setMaster(getMasterSettings(individual)));

    const cleanUp = () => {
      store.dispatch(setIndividual([]));
      store.dispatch(setMaster({}));
    };

    return {
      app,
      cleanUp,
    };
  };

  it('should skip that ESC and write the healthy ones with the settings of the first healthy ESC', async() => {
    const {
      app, cleanUp,
    } = setup();

    await app.handleWriteSettings();

    const targets = app.serial.writeSettings.mock.calls.map((call) => call[0]);
    expect(targets).toEqual([1, 2, 3]);
    app.serial.writeSettings.mock.calls.forEach((call) => {
      expect(call[2].BEEP_STRENGTH).toEqual(77);
    });
    expect(app.addLogMessage).toHaveBeenCalledWith('writeSettingsBlockedFlashFailed', { index: 1 });
    expect(app.addLogMessage.mock.calls.filter((call) => call[0] === 'writeSettingsBlockedFlashFailed')).toHaveLength(1);
    cleanUp();
  });

  it('should skip that ESC when restoring the defaults too', async() => {
    const {
      app, cleanUp,
    } = setup();

    await app.handleResetDefaultls();

    const targets = app.serial.writeSettings.mock.calls.map((call) => call[0]);
    expect(targets).toEqual([1, 2, 3]);
    expect(app.addLogMessage).toHaveBeenCalledWith('writeSettingsBlockedFlashFailed', { index: 1 });
    expect(app.addLogMessage.mock.calls.filter((call) => call[0] === 'writeSettingsBlockedFlashFailed')).toHaveLength(1);
    cleanUp();
  });

  it('should not give the common settings to that ESC when a common setting changes', () => {
    const {
      setIndividual, setMaster, updateIndividual,
    } = require('../escsSlice');

    store.dispatch(setIndividual(escs().slice(0, 2)));
    store.dispatch(setMaster({
      NAME: 'Bluejay',
      BEEP_STRENGTH: 60,
    }));
    store.dispatch(updateIndividual(['BEEP_STRENGTH']));

    const [failed, healthy] = store.getState().escs.individual;
    expect(failed.settings.NAME).toEqual('**FLASH*FAILED**');
    expect(healthy.settings.BEEP_STRENGTH).toEqual(60);

    store.dispatch(setIndividual([]));
    store.dispatch(setMaster({}));
  });
});

describe('App with a settings file offline', () => {
  const bluejay = (index, beep) => ({
    index,
    firmwareName: 'Bluejay',
    displayName: 'J-H-40 - Bluejay, 0.19, 24kHz',
    layoutRevision: '208',
    settings: {
      NAME: 'Bluejay',
      LAYOUT: '#J_H_40#',
      MAIN_REVISION: 0,
      SUB_REVISION: 19,
      BEEP_STRENGTH: beep,
      MOTOR_DIRECTION: 2,
    },
    meta: { available: true },
  });

  const serialSpy = () => new Proxy({}, {
    get: (target, name) => {
      if(!target[name]) {
        target[name] = jest.fn();
      }

      return target[name];
    },
  });

  it('should show the ESCs of the file with no port open, and write nothing', async() => {
    const { App: AppClass } = require('../');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const {
      selectCanFlash, selectCanRead, selectCanWrite,
    } = require('../stateSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.serial = serialSpy();

    const text = JSON.stringify(buildBackup([bluejay(0, 40), bluejay(1, 60)]));
    app.handleOpenOffline(text, 'mini.json');

    const state = store.getState();
    expect(state.serial.offline).toEqual(expect.objectContaining({
      fileName: 'mini.json',
      count: 2,
    }));
    expect(state.serial.open).toBeTruthy();
    expect(state.escs.individual.map((esc) => esc.settings.BEEP_STRENGTH)).toEqual([40, 60]);
    expect(state.escs.individual[0].individualSettings.MOTOR_DIRECTION).toEqual(2);
    expect(app.addLogMessage).toHaveBeenCalledWith('offlineOpened', {
      fileName: 'mini.json',
      count: 2,
    });
    expect(selectCanRead(state)).toBeFalsy();
    expect(selectCanWrite(state)).toBeFalsy();
    expect(selectCanFlash(state)).toBeFalsy();

    window.confirm = jest.fn(() => true);
    const event = { preventDefault: jest.fn() };
    await app.handleConnect(event);
    await app.handleReadEscs();
    await app.handleWriteSettings();
    await app.handleResetDefaultls();
    await app.flash(':00000001FF', false, 'same');
    await app.handleRestoreSettings(text);
    await app.handleAllMotorSpeed(1100);
    await app.handleSingleMotorSpeed(0, 1100);
    await app.handleFirmwareDump(0);
    app.handleMelodyWrite(['a:d=4,o=5,b=100:c']);

    expect(Object.keys(app.serial).filter((name) => app.serial[name].mock.calls.length > 0)).toEqual([]);
    expect(app.addLogMessage).toHaveBeenCalledWith('offlineNothingWritten');
    expect(store.getState().serial.offline).not.toBeNull();
    delete window.confirm;

    await app.handleDisconnect(event);
    expect(store.getState().serial.offline).toBeNull();
    expect(store.getState().serial.open).toBeFalsy();
    expect(store.getState().escs.individual).toEqual([]);
  });

  it('should save the settings changed offline to a file marked as edited offline', () => {
    const { App: AppClass } = require('../');
    const {
      setMaster, setIndividualAtIndex,
    } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const { selectCanEdit } = require('../stateSlice');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    let saved = null;
    const RealBlob = global.Blob;
    global.Blob = class {
      constructor(parts) {
        saved = parts.join('');
      }
    };
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const original = buildBackup([bluejay(0, 40), bluejay(1, 40)], new Date('2026-11-20T10:00:00Z'));
    app.handleOpenOffline(JSON.stringify(original), 'mini.json');
    expect(selectCanEdit(store.getState())).toBeTruthy();

    // A common setting and the direction of ESC 2 changed on the screen
    store.dispatch(setMaster({
      ...store.getState().escs.master,
      BEEP_STRENGTH: 70,
    }));
    const second = store.getState().escs.individual[1];
    store.dispatch(setIndividualAtIndex({
      index: 1,
      settings: {
        ...second,
        individualSettings: {
          ...second.individualSettings,
          MOTOR_DIRECTION: 1,
        },
      },
    }));

    app.handleSaveOffline();
    global.Blob = RealBlob;
    click.mockRestore();
    app.handleCloseOffline();

    expect(app.addLogMessage).toHaveBeenCalledWith('offlineSaved', expect.objectContaining({ fileName: expect.stringMatching(/_hors-ligne\.json$/) }));
    const backup = JSON.parse(saved);
    expect(backup.editedOffline).toBeTruthy();
    expect(backup.date).toEqual('2026-11-20T10:00:00.000Z');
    expect(backup.count).toEqual(2);
    expect(backup.escs.map((esc) => esc.settings.BEEP_STRENGTH)).toEqual([70, 70]);
    expect(backup.escs.map((esc) => esc.settings.MOTOR_DIRECTION)).toEqual([2, 1]);
  });

  it('should keep the bench check offline only while no direction changes', () => {
    const { App: AppClass } = require('../');
    const { setIndividualAtIndex } = require('../escsSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:x');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const saved = [];
    const RealBlob = global.Blob;
    global.Blob = class {
      constructor(parts) {
        saved.push(JSON.parse(parts.join('')));
      }
    };

    const checked = {
      ...buildBackup([bluejay(0, 40)]),
      benchChecked: true,
      benchCheckedDate: '2026-11-20T10:00:00.000Z',
    };
    app.handleOpenOffline(JSON.stringify(checked), 'mini.json');
    app.handleSaveOffline();

    const esc = store.getState().escs.individual[0];
    store.dispatch(setIndividualAtIndex({
      index: 0,
      settings: {
        ...esc,
        individualSettings: {
          ...esc.individualSettings,
          MOTOR_DIRECTION: 1,
        },
      },
    }));
    app.handleSaveOffline();

    global.Blob = RealBlob;
    click.mockRestore();
    app.handleCloseOffline();

    expect(saved[0].benchChecked).toBeTruthy();
    expect(saved[0].benchCheckedDate).toEqual('2026-11-20T10:00:00.000Z');
    expect(saved[1].benchChecked).toBeFalsy();
    expect(saved[1].benchCheckedDate).toBeUndefined();
  });

  it('should recall a file edited offline when it is loaded on the ESCs', async() => {
    const { App: AppClass } = require('../');
    const {
      setConnected, setIndividual,
    } = require('../escsSlice');
    store.dispatch(setConnected(1));
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    app.handleReadEscs = jest.fn();
    app.serial = { writeSettings: jest.fn() };

    const backup = {
      ...buildBackup([bluejay(0, 60)]),
      editedOffline: true,
      editedDate: '2026-11-21T10:00:00.000Z',
    };
    store.dispatch(setIndividual([bluejay(0, 40)]));
    const confirm = jest.fn(() => false);
    window.confirm = confirm;
    await app.handleRestoreSettings(JSON.stringify(backup));

    expect(confirm.mock.calls[0][0]).toMatch(/restorePreviewEditedOffline 2026-11-21T10:00:00.000Z/);
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    delete window.confirm;
  });

  it('should keep the file open and touch no port when time passes or a port is plugged', async() => {
    jest.useFakeTimers();
    const { App: AppClass } = require('../');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();
    const port = serialSpy();
    app.serial = port;
    const usbPort = {
      getInfo: () => ({
        usbVendorId: 1,
        usbProductId: 2,
      }), 
    };
    app.serialApi = { getPorts: jest.fn(async() => [usbPort]) };

    app.handleOpenOffline(JSON.stringify(buildBackup([bluejay(0, 40)])), 'mini.json');
    jest.advanceTimersByTime(5000);
    await app.serialDisconnectHandler();
    app.serial = port;
    await app.serialConnectHandler();
    jest.advanceTimersByTime(5000);

    const state = store.getState();
    expect(Object.keys(port).filter((name) => port[name].mock.calls.length > 0)).toEqual([]);
    expect(state.serial.offline).not.toBeNull();
    expect(state.serial.open).toBeTruthy();
    expect(state.serial.fourWay).toBeTruthy();
    expect(state.escs.individual).toHaveLength(1);

    app.handleCloseOffline();
    jest.useRealTimers();
  });

  it('should never be offline with a port opening', async() => {
    const { App: AppClass } = require('../');
    const { setOffline } = require('../serialSlice');
    const { setConnecting } = require('../stateSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();

    // Refused while connecting
    store.dispatch(setConnecting(true));
    app.handleOpenOffline(JSON.stringify(buildBackup([bluejay(0, 40)])), 'mini.json');
    expect(store.getState().serial.offline).toBeNull();
    expect(app.addLogMessage).toHaveBeenCalledWith('offlinePortOpen');
    store.dispatch(setConnecting(false));

    // Offline reached during the connection anyway: the port is closed again
    const serial = {
      open: jest.fn(),
      close: jest.fn(),
      setLogCallback: jest.fn(),
      getApiVersion: jest.fn(async() => ({ apiVersion: '1.46.0' })),
      getFourWayInterfaceInfo: jest.fn(),
      getFcVariant: jest.fn(async() => ({ flightControllerIdentifier: 'BTFL' })),
      getFcVersion: jest.fn(async() => ({ flightControllerVersion: '4.5.0' })),
      getBuildInfo: jest.fn(async() => ({ buildInfo: 'x' })),
      getBoardInfo: jest.fn(async() => ({
        boardIdentifier: 'S7X2',
        boardVersion: 0,
      })),
      getUid: jest.fn(async() => ({ uid: [1, 2] })),
      getMotorData: jest.fn(async() => [1000, 1000]),
      getFeatures: jest.fn(async() => {
        store.dispatch(setOffline({ fileName: 'mini.json' }));
        return {};
      }),
      setMotorStopValue: jest.fn(),
    };
    app.serial = serial;
    await app.handleConnect({ preventDefault: () => {} });

    expect(serial.close).toHaveBeenCalled();
    expect(store.getState().state.isConnecting).toBeFalsy();
    store.dispatch(setOffline(null));
    expect(store.getState().serial.open).toBeFalsy();
  });

  it('should refuse a damaged file, and never open a file while a port is open', () => {
    const { App: AppClass } = require('../');
    const { setOpen } = require('../serialSlice');
    const { buildBackup } = require('../../../utils/SettingsBackup');
    const app = new AppClass();
    app.addLogMessage = jest.fn();

    app.handleOpenOffline('{"format":"other"}', 'x.json');
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreInvalid');
    expect(store.getState().serial.offline).toBeNull();

    store.dispatch(setOpen(true));
    app.handleOpenOffline(JSON.stringify(buildBackup([bluejay(0, 40)])), 'mini.json');
    expect(app.addLogMessage).toHaveBeenCalledWith('offlinePortOpen');
    expect(store.getState().serial.offline).toBeNull();
    store.dispatch(setOpen(false));
  });
});
