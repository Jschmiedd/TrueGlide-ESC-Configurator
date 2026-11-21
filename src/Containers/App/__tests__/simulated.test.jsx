import { store } from '../../../store';
import {
  MockedEsc,
  simulatedBluejay,
} from '../../../utils/__tests__/MockedEsc';

jest.mock('i18next', () => ({
  changeLanguage: () => null,
  t: () => null,
}));

let saved;
let RealBlob;
let click;

function setup(escs) {
  const { App: AppClass } = require('../');
  const app = new AppClass();
  app.addLogMessage = jest.fn();
  const esc = new MockedEsc(escs);

  return {
    app,
    esc,
  };
}

beforeEach(() => {
  saved = [];
  RealBlob = global.Blob;
  global.Blob = class {
    constructor(parts) {
      saved.push(parts.join(''));
    }
  };
  URL.createObjectURL = jest.fn(() => 'blob:x');
  URL.revokeObjectURL = jest.fn();
  click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  window.confirm = jest.fn((question) => !/confirmRestoreAfterMismatch/.test(question));
});

afterEach(() => {
  global.Blob = RealBlob;
  click.mockRestore();
  delete window.confirm;
  const { setOffline } = require('../serialSlice');
  const { setConnected } = require('../escsSlice');
  store.dispatch(setOffline(null));
  store.dispatch(setConnected(0));
});

describe('Offline settings with simulated ESCs', () => {
  it('should save the ESCs, prepare a change offline and write it to the same ESCs', async() => {
    const drone = [simulatedBluejay(0), simulatedBluejay(1), simulatedBluejay(2), simulatedBluejay(3)];
    const {
      app, esc,
    } = setup(drone);
    await esc.attach(app);

    // Saved from the ESCs, checked on the bench
    app.handleSaveEscSettings();
    const file = saved[0];

    // Opened offline, beep changed, saved again
    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    store.dispatch(setOpen(false));
    app.handleOpenOffline(file, 'drone.json');
    const { setMaster } = require('../escsSlice');
    store.dispatch(setMaster({
      ...store.getState().escs.master,
      BEEP_STRENGTH: 80,
    }));
    app.handleSaveOffline();
    const prepared = saved[saved.length - 1];
    app.handleCloseOffline();

    // Back on the ESCs: read, then load the prepared file
    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(true));
    await esc.attach(app);
    await app.handleRestoreSettings(prepared);

    expect(esc.writes).toHaveLength(4);
    expect(esc.escs.map((item) => item.settings.BEEP_STRENGTH)).toEqual([80, 80, 80, 80]);
    expect(esc.escs.map((item) => item.settings.MOTOR_DIRECTION)).toEqual([2, 2, 2, 2]);
    [1, 2, 3, 4].forEach((index) => {
      expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreVerified', { index });
    });
    expect(app.addLogMessage).toHaveBeenCalledWith('checkMotorsOnBench');
  });

  it('should refuse the file on other ESCs, another version or an ESC not read', async() => {
    const {
      app, esc,
    } = setup([simulatedBluejay(0), simulatedBluejay(1)]);
    await esc.attach(app);
    app.handleSaveEscSettings();
    const file = saved[0];

    // Another version of the firmware
    esc.escs[1].settings.SUB_REVISION = 20;
    await esc.attach(app);
    await app.handleRestoreSettings(file);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreSkipped', { index: 2 });

    // An ESC not read
    esc.escs[1].settings.SUB_REVISION = 19;
    esc.notRead = [1];
    await esc.attach(app);
    await app.handleRestoreSettings(file);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreEscNotRead', {
      read: 1,
      connected: 2,
    });

    // Only the matching ESC was ever written, and only with its own values
    expect(esc.writes.every((write) => write.index === 0)).toBeTruthy();
  });

  it('should find a difference after writing and put back the settings from before', async() => {
    const {
      app, esc,
    } = setup([simulatedBluejay(0, { BEEP_STRENGTH: 60 })]);
    await esc.attach(app);
    app.handleSaveEscSettings();
    const file = saved[0];

    esc.escs[0].settings.BEEP_STRENGTH = 40;
    await esc.attach(app);
    esc.readBack = { 0: { BEEP_STRENGTH: 55 } };
    window.confirm = jest.fn(() => true);
    await app.handleRestoreSettings(file);

    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreMismatch', {
      index: 1,
      names: 'BEEP_STRENGTH',
    });
    // The 40 of before was written back
    expect(esc.writes.map((write) => write.settings.BEEP_STRENGTH)).toEqual([60, 40]);
  });

  it('should keep the direction of each ESC from a file not checked on the bench', async() => {
    const {
      app, esc,
    } = setup([simulatedBluejay(0, { MOTOR_DIRECTION: 1 })]);
    await esc.attach(app);
    window.confirm = jest.fn((question) => !/confirmBenchChecked|confirmRestoreAfterMismatch/.test(question));
    app.handleSaveEscSettings();
    const file = JSON.parse(saved[0]);
    file.escs[0].settings.MOTOR_DIRECTION = 2;
    file.escs[0].settings.BEEP_STRENGTH = 70;

    window.confirm = jest.fn(() => true);
    await app.handleRestoreSettings(JSON.stringify(file));

    expect(esc.escs[0].settings.MOTOR_DIRECTION).toEqual(1);
    expect(esc.escs[0].settings.BEEP_STRENGTH).toEqual(70);
  });

  it('should write nothing to the ESCs while a file is open offline', async() => {
    const {
      app, esc,
    } = setup([simulatedBluejay(0)]);
    await esc.attach(app);
    app.handleSaveEscSettings();
    const file = saved[0];

    const { setOpen } = require('../serialSlice');
    store.dispatch(setOpen(false));
    app.handleOpenOffline(file, 'drone.json');
    await app.handleRestoreSettings(file);
    await app.handleWriteSettings();
    app.handleCloseOffline();

    expect(esc.writes).toEqual([]);
  });

  it('should save a value chosen in a list as a number and find no false difference', async() => {
    const {
      app, esc,
    } = setup([simulatedBluejay(0)]);
    await esc.attach(app);
    app.handleSaveEscSettings();

    const {
      setOpen, setFourWay,
    } = require('../serialSlice');
    const { setIndividualAtIndex } = require('../escsSlice');
    store.dispatch(setOpen(false));
    app.handleOpenOffline(saved[0], 'drone.json');

    // The lists of the screen give text
    const shown = store.getState().escs.individual[0];
    store.dispatch(setIndividualAtIndex({
      index: 0,
      settings: {
        ...shown,
        individualSettings: {
          ...shown.individualSettings,
          MOTOR_DIRECTION: '1',
        },
      },
    }));
    app.handleSaveOffline();
    const prepared = JSON.parse(saved[saved.length - 1]);
    app.handleCloseOffline();
    expect(prepared.escs[0].settings.MOTOR_DIRECTION).toEqual(1);

    store.dispatch(setOpen(true));
    store.dispatch(setFourWay(true));
    await esc.attach(app);
    prepared.benchChecked = true;
    await app.handleRestoreSettings(JSON.stringify(prepared));

    expect(esc.escs[0].settings.MOTOR_DIRECTION).toEqual(1);
    expect(app.addLogMessage).toHaveBeenCalledWith('settingsRestoreVerified', { index: 1 });
    expect(app.addLogMessage).not.toHaveBeenCalledWith('settingsRestoreMismatch', expect.anything());
  });
});
