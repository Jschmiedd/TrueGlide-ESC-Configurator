import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';

import escsReducer, {
  setBatteryBeforeRead,
  setIndividual,
} from '../../../../Containers/App/escsSlice';
import settingsReducer from '../../../AppSettings/settingsSlice';
import stateReducer from '../../../../Containers/App/stateSlice';
import serialReducer from '../../../../Containers/App/serialSlice';

import BatteryBeforeRead from '../';
import Flash from '../../';

jest.mock('../../CommonSettings', () => function CommonSettings() {
  return require('react').createElement('div', null, 'commonSettingsMock');
});
jest.mock('../../Escs', () => function Escs() {
  return null;
});

const enCommon = require('../../../../translations/en/common.json');
const frCommon = require('../../../../translations/fr/common.json');

function renderBattery(battery, language) {
  const store = configureStore({ reducer: { escs: escsReducer } });
  store.dispatch(setBatteryBeforeRead(battery));
  i18next.changeLanguage(language);

  render(
    <I18nextProvider i18n={i18next}>
      <Provider store={store}>
        <BatteryBeforeRead />
      </Provider>
    </I18nextProvider>
  );
}

describe('BatteryBeforeRead', () => {
  beforeAll(async() => {
    await i18next.init({
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      lng: 'fr',
      resources: {
        en: { common: enCommon },
        fr: { common: frCommon },
      },
    });
  });

  it('should say the battery was measured before reading, with its time', () => {
    renderBattery({
      cellCount: 4,
      voltage: 16.4,
      time: '10:11:12',
    }, 'fr');

    expect(screen.getByText('Batterie avant la lecture (10:11:12) : 4S @ 16.4V')).toBeInTheDocument();
    expect(screen.queryByText(/douteux/i)).not.toBeInTheDocument();
  });

  it('should say it in English too', () => {
    renderBattery({
      cellCount: 4,
      voltage: 16.4,
      time: '10:11:12',
    }, 'en');

    expect(screen.getByText('Battery before reading (10:11:12): 4S @ 16.4V')).toBeInTheDocument();
  });

  it('should say no battery was detected before reading', () => {
    renderBattery({
      cellCount: 0,
      voltage: 0,
      time: '10:11:12',
    }, 'fr');

    expect(screen.getByText('Aucune batterie détectée avant la lecture (10:11:12)')).toBeInTheDocument();
  });

  it('should say the battery was unknown before reading', () => {
    renderBattery({
      status: 'unknown',
      time: '10:11:12',
    }, 'fr');

    expect(screen.getByText('Batterie inconnue avant la lecture (10:11:12)')).toBeInTheDocument();
  });

  it('should warn about a doubtful cell count', () => {
    renderBattery({
      cellCount: 1,
      voltage: 15,
      time: '10:11:12',
    }, 'fr');

    expect(screen.getByText(/Batterie avant la lecture \(10:11:12\) : 1S @ 15V – nombre de cellules douteux : débranchez tout, puis rebranchez/)).toBeInTheDocument();
  });

  it('should warn about a doubtful cell count in English too', () => {
    renderBattery({
      cellCount: 1,
      voltage: 15,
      time: '10:11:12',
    }, 'en');

    expect(screen.getByText(/1S @ 15V – cell count doubtful: unplug everything, then plug back in/)).toBeInTheDocument();
  });

  it('should be shown above the common settings once the ESCs are read', () => {
    const store = configureStore({
      reducer: {
        escs: escsReducer,
        serial: serialReducer,
        settings: settingsReducer,
        state: stateReducer,
      },
    });
    store.dispatch(setBatteryBeforeRead({
      cellCount: 4,
      voltage: 16.4,
      time: '10:11:12',
    }));
    i18next.changeLanguage('fr');

    const { rerender } = render(
      <I18nextProvider i18n={i18next}>
        <Provider store={store}>
          <Flash
            flashProgress={[]}
            onFirmwareDump={jest.fn()}
            progressReferences={[]}
            unsupported={false}
          />
        </Provider>
      </I18nextProvider>
    );
    expect(screen.queryByText(/avant la lecture/)).not.toBeInTheDocument();

    store.dispatch(setIndividual([{
      index: 0,
      settings: {},
      individualSettings: {},
    }]));
    rerender(
      <I18nextProvider i18n={i18next}>
        <Provider store={store}>
          <Flash
            flashProgress={[]}
            onFirmwareDump={jest.fn()}
            progressReferences={[]}
            unsupported={false}
          />
        </Provider>
      </I18nextProvider>
    );
    const battery = screen.getByText(/Batterie avant la lecture \(10:11:12\)/);
    const common = screen.getByText('commonSettingsMock');
    expect(battery.compareDocumentPosition(common) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
