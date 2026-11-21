/**
 * Simulated ESCs for the tests: they keep their settings, answer reads and
 * writes like real ESCs, and can be told to fail. Never used by the
 * application itself.
 */
import { store } from '../../store';
import {
  setConnected,
  setIndividual,
} from '../../Containers/App/escsSlice';

function simulatedBluejay(index, settings = {}) {
  return {
    index,
    firmwareName: 'Bluejay',
    displayName: 'J-H-40 - Bluejay, 0.19, 24kHz',
    layoutRevision: '208',
    settings: {
      NAME: 'Bluejay',
      LAYOUT: '#J_H_40#',
      MAIN_REVISION: 0,
      SUB_REVISION: 19,
      BEEP_STRENGTH: 40,
      MOTOR_DIRECTION: 2,
      ...settings,
    },
    meta: { available: true },
  };
}

class MockedEsc {
  constructor(escs) {
    this.escs = escs.map((esc) => ({
      ...esc,
      settings: { ...esc.settings },
    }));
    this.writes = [];
    this.notRead = [];
    this.readBack = {};
    this.writeFails = [];

    this.serial = { writeSettings: this.writeSettings };
  }

  writeSettings = async(index, esc, settings) => {
    this.writes.push({
      index,
      settings: { ...settings },
    });
    if(this.writeFails.includes(index)) {
      throw new Error('Write failed');
    }

    const target = this.escs.find((item) => item.index === index);
    target.settings = {
      ...settings,
      ...(this.readBack[index] || {}),
    };
  };

  /**
   * Reads the ESCs into the application, as a real read does.
   */
  read = (app) => async() => {
    const individual = this.escs
      .filter((esc) => !this.notRead.includes(esc.index))
      .map((esc) => ({
        ...esc,
        settings: { ...esc.settings },
      }));
    store.dispatch(setConnected(this.escs.length));
    store.dispatch(setIndividual(individual));
    app.keepEscSettings(individual);
  };

  attach(app) {
    app.serial = this.serial;
    app.handleReadEscs = this.read(app);

    return app.handleReadEscs();
  }
}

export {
  MockedEsc,
  simulatedBluejay,
};
