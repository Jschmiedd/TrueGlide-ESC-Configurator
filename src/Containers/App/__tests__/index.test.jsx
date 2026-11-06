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
});
