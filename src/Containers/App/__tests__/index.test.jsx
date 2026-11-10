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

    const backup = buildBackup([bluejay(0, 60)]);
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
