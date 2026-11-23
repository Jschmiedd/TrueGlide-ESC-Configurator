import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { Provider } from 'react-redux';

import { store } from '../../../store';
import { TimeoutError } from '../../../utils/helpers/QueueProcessor';
import BatteryBeforeRead from '../../../Components/Flash/BatteryBeforeRead';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('i18next', () => ({
  changeLanguage: () => null,
  t: () => null,
}));
jest.mock('../../../utils/helpers/General', () => ({
  ...jest.requireActual('../../../utils/helpers/General'),
  delay: () => Promise.resolve(),
}));

const TIME = /^\d\d:\d\d:\d\d$/;

function prepareRead() {
  const {
    setOpen,
    setFourWay,
  } = require('../serialSlice');
  const {
    setConnected,
    setBatteryBeforeRead,
  } = require('../escsSlice');
  store.dispatch({ type: 'state/reset' });
  store.dispatch(setOpen(true));
  store.dispatch(setFourWay(false));
  store.dispatch(setConnected(0));
  store.dispatch(setBatteryBeforeRead(null));

  const { App: AppClass } = require('../');
  const app = new AppClass();
  app.addLogMessage = jest.fn();
  const events = [];
  app.serial = {
    spinAllMotors: jest.fn(),
    getStatus: jest.fn(async() => ({ armingDisableFlagsReasons: { RX_FAILSAFE: true } })),
    getBatteryState: jest.fn(async() => {
      events.push('battery');
      return {
        cellCount: 4,
        voltage: 16.4,
      };
    }),
    enable4WayInterface: jest.fn(async() => {
      events.push('passthrough');
      events.push(store.getState().escs.batteryBeforeRead);
      return { connectedESCs: 0 };
    }),
    startFourWayInterface: jest.fn(),
  };

  return {
    app,
    events,
  };
}

describe('App battery before reading', () => {
  it('should store the battery before the passthrough', async() => {
    const {
      app,
      events,
    } = prepareRead();

    await app.handleReadEscs();

    expect(events.slice(0, 2)).toEqual(['battery', 'passthrough']);
    expect(events[2].cellCount).toEqual(4);
    expect(events[2].voltage).toEqual(16.4);
    expect(events[2].time).toMatch(TIME);
    expect(app.serial.getBatteryState).toHaveBeenCalledTimes(1);
    expect(app.addLogMessage).not.toHaveBeenCalledWith('batteryMissingBeforeRead');
  });

  it('should tell to plug the battery and still read when none is detected', async() => {
    const {
      app,
      events,
    } = prepareRead();
    app.serial.getBatteryState = jest.fn(async() => ({
      cellCount: 0,
      voltage: 0,
    }));

    await app.handleReadEscs();

    expect(app.addLogMessage).toHaveBeenCalledWith('batteryMissingBeforeRead');
    const missing = app.addLogMessage.mock.calls.findIndex((call) => call[0] === 'batteryMissingBeforeRead');
    const reading = app.addLogMessage.mock.calls.findIndex((call) => call[0] === 'readEscs');
    expect(missing).toBeLessThan(reading);
    expect(events).toContain('passthrough');
    expect(store.getState().escs.batteryBeforeRead.cellCount).toEqual(0);
  });

  it.each([
    ['throws', () => {
      throw new Error('no answer');
    }],
    ['times out', () => Promise.reject(new TimeoutError('Timed out after 1000ms'))],
  ])('should still read when the battery %s, and show it unknown', async(name, getBatteryState) => {
    const {
      app,
      events,
    } = prepareRead();
    app.serial.getBatteryState = jest.fn(getBatteryState);

    await app.handleReadEscs();

    expect(events).toContain('passthrough');
    expect(app.addLogMessage).toHaveBeenCalledWith('readEscs', { connected: 0 });
    expect(app.addLogMessage).not.toHaveBeenCalledWith('readEscsFailed');
    expect(store.getState().state.isReading).toBeFalsy();

    const battery = store.getState().escs.batteryBeforeRead;
    expect(battery.status).toEqual('unknown');
    expect(battery.time).toMatch(TIME);

    render(
      <Provider store={store}>
        <BatteryBeforeRead />
      </Provider>
    );
    expect(screen.getByText('batteryBeforeReadUnknown')).toBeInTheDocument();
  });

  it('should send no battery request in passthrough and keep the first time', async() => {
    const { app } = prepareRead();
    const { setBatteryBeforeRead } = require('../escsSlice');

    await app.handleReadEscs();
    expect(store.getState().serial.fourWay).toBeTruthy();
    const measured = {
      ...store.getState().escs.batteryBeforeRead,
      time: '07:08:09',
    };
    store.dispatch(setBatteryBeforeRead(measured));

    await app.handleReadEscs();

    expect(app.serial.getBatteryState).toHaveBeenCalledTimes(1);
    expect(store.getState().escs.batteryBeforeRead).toEqual(measured);
  });

  // One Bluejay ESC is read after the battery
  const readOneEsc = (battery) => {
    const { app } = prepareRead();
    app.serial.getBatteryState = jest.fn(async() => battery);
    app.serial.enable4WayInterface = jest.fn(async() => ({ connectedESCs: 1 }));
    app.serial.writeSettings = jest.fn();
    app.handleReadEsc = jest.fn(async() => ({
      firmwareName: 'Bluejay',
      displayName: 'Bluejay',
      layoutRevision: '208',
      meta: { available: true },
      settings: { NAME: 'Bluejay' },
      individualSettings: {},
    }));
    window.confirm = jest.fn(() => true);

    return app;
  };

  it('should propose the settings of the battery read, and load nothing', async() => {
    const app = readOneEsc({
      cellCount: 4,
      voltage: 14.71,
    });
    const restore = jest.spyOn(app, 'handleRestoreSettings');

    await app.handleReadEscs();

    const lines = app.addLogMessage.mock.calls.map((call) => call[0]);
    expect(lines.indexOf('batteryCellsProposal')).toBeGreaterThan(lines.indexOf('readEscsSuccess'));
    expect(app.addLogMessage).toHaveBeenCalledWith('batteryCellsProposal', { cells: 4 });
    expect(app.serial.writeSettings).not.toHaveBeenCalled();
    expect(restore).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    delete window.confirm;
  });

  it.each([
    ['doubtful', {
      cellCount: 1,
      voltage: 14.7,
    }],
    ['missing', {
      cellCount: 0,
      voltage: 0,
    }],
  ])('should propose nothing when the cell count is %s', async(name, battery) => {
    const app = readOneEsc(battery);

    await app.handleReadEscs();

    expect(app.addLogMessage).toHaveBeenCalledWith('readEscsSuccess');
    expect(app.addLogMessage).not.toHaveBeenCalledWith('batteryCellsProposal', expect.anything());
    delete window.confirm;
  });
});

