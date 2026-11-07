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

  it('should warn before flashing a file that is not validated', async() => {
    const url = 'https://example.org/other.hex';
    const { app } = setup({ [`https://cors.bubblesort.me/?${url}`]: 'xyz' });
    await app.handleFlashUrl(url, 'TEST', 'Test', 'v1', '24', false, 'same');

    expect(app.addLogMessage).toHaveBeenCalledWith('firmwareNotValidated');
    expect(app.flash).toHaveBeenCalledWith('xyz', false, 'same');
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
