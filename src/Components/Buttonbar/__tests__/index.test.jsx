import React from 'react';
import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import escsReducer, {
  setBatteryBeforeRead,
  setBeforeFlash,
  setIndividual,
} from '../../../Containers/App/escsSlice';
import melodiesReducer, { updateAll } from '../../MelodyEditor/melodiesSlice';
import stateReducer, { setWriting } from '../../../Containers/App/stateSlice';
import serialReducer, { setOffline } from '../../../Containers/App/serialSlice';

import Buttonbar from '../';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

function setupTestStore() {
  const refObj = {};

  beforeEach(() => {
    const store = configureStore({
      reducer: {
        escs: escsReducer,
        melodies: melodiesReducer,
        serial: serialReducer,
        state: stateReducer,
      },
    });
    refObj.store = store;
    refObj.wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
  });

  return refObj;
}

let onWriteSetup;
let onReadSetup;
let onResetDefaults;

describe('Buttonbar', () => {
  const storeRef = setupTestStore();

  beforeEach(() => {
    onWriteSetup = jest.fn();
    onReadSetup = jest.fn();
    onResetDefaults = jest.fn();
  });

  it('should display buttons', () => {
    storeRef.store.dispatch(updateAll([
      'test',
      'test',
      'test',
      'test',
    ]));

    render(
      <Buttonbar
        onReadSetup={onReadSetup}
        onResetDefaults={onResetDefaults}
        onWriteSetup={onWriteSetup}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.queryAllByText(/resetDefaults/i).length).toEqual(2);
    expect(screen.getByText(/escButtonRead/i)).toBeInTheDocument();
    expect(screen.getByText(/escButtonWrite/i)).toBeInTheDocument();
    expect(screen.getByText(/escButtonFlashAll/i)).toBeInTheDocument();
    expect(screen.getAllByText(/escButtonOpenMelodyEditor/i).length).toEqual(2);
  });

  it('should not trigger handlers when disabled', () => {
    storeRef.store.dispatch(setWriting(true));

    render(
      <Buttonbar
        onReadSetup={onReadSetup}
        onResetDefaults={onResetDefaults}
        onWriteSetup={onWriteSetup}
      />,
      { wrapper: storeRef.wrapper }
    );

    userEvent.click(screen.queryAllByText(/resetDefaults/i)[1]);
    expect(onResetDefaults).not.toHaveBeenCalled();

    userEvent.click(screen.getByText(/escButtonRead/i));
    expect(onReadSetup).not.toHaveBeenCalled();

    userEvent.click(screen.getByText(/escButtonWrite/i));
    expect(onWriteSetup).not.toHaveBeenCalled();

    const flashButton = screen.getByText(/escButtonFlashAll/i);
    userEvent.click(flashButton);
    expect(flashButton.getAttribute("disabled")).toBe("");

    const { targets } = storeRef.store.getState().escs;
    expect(targets.length).toBe(0);
  });

  it('should trigger handlers when enabled', () => {
    storeRef.store.dispatch(setIndividual([{}]));

    render(
      <Buttonbar
        onReadSetup={onReadSetup}
        onResetDefaults={onResetDefaults}
        onWriteSetup={onWriteSetup}
      />,
      { wrapper: storeRef.wrapper }
    );

    userEvent.click(screen.queryAllByText(/resetDefaults/i)[1]);
    expect(onResetDefaults).toHaveBeenCalled();

    userEvent.click(screen.getByText(/escButtonRead/i));
    expect(onReadSetup).toHaveBeenCalled();

    userEvent.click(screen.getByText(/escButtonWrite/i));
    expect(onWriteSetup).toHaveBeenCalled();

    userEvent.click(screen.getByText(/escButtonFlashAll/i));

    const { targets } = storeRef.store.getState().escs;
    expect(targets.length).toBe(1);
  });

  it('should open melody editor', () => {
    storeRef.store.dispatch(updateAll([
      'test',
      'test',
      'test',
      'test',
    ]));

    const onWriteSetup = jest.fn();
    const onReadSetup = jest.fn();
    const onResetDefaults = jest.fn();
    const onSeletFirmwareForAll = jest.fn();

    render(
      <Buttonbar
        onReadSetup={onReadSetup}
        onResetDefaults={onResetDefaults}
        onSeletFirmwareForAll={onSeletFirmwareForAll}
        onWriteSetup={onWriteSetup}
      />,
      { wrapper: storeRef.wrapper }
    );

    const openButtons = screen.getAllByText(/escButtonOpenMelodyEditor/i);
    expect(openButtons.length).toEqual(2);

    userEvent.click(openButtons[1]);

    const melodies = storeRef.store.getState().melodies;
    expect(melodies.show).toBeTruthy();
  });

  it('should load a backup file only when asked', async() => {
    storeRef.store.dispatch(setWriting(false));
    const onRestoreSettings = jest.fn();

    const { rerender } = render(
      <Buttonbar
        onReadSetup={jest.fn()}
        onResetDefaults={jest.fn()}
        onWriteSetup={jest.fn()}
      />,
      { wrapper: storeRef.wrapper }
    );
    expect(screen.queryByText(/escButtonRestoreBackup/i)).not.toBeInTheDocument();

    rerender(
      <Buttonbar
        onReadSetup={jest.fn()}
        onResetDefaults={jest.fn()}
        onRestoreSettings={onRestoreSettings}
        onWriteSetup={jest.fn()}
      />
    );
    expect(screen.getByText(/escButtonRestoreBackup/i)).toBeInTheDocument();

    const file = new File(['{"format":"trueglide-esc-reglages"}'], 'reglages.json', { type: 'application/json' });
    userEvent.upload(screen.getByTestId('restore-settings-file'), file);

    await waitFor(() => expect(onRestoreSettings).toHaveBeenCalledWith('{"format":"trueglide-esc-reglages"}'));
  });

  it('should offer the settings from before the flash only while they are kept', () => {
    const onRestoreBeforeFlash = jest.fn();
    render(
      <Buttonbar
        onReadSetup={jest.fn()}
        onResetDefaults={jest.fn()}
        onRestoreBeforeFlash={onRestoreBeforeFlash}
        onWriteSetup={jest.fn()}
      />,
      { wrapper: storeRef.wrapper }
    );
    expect(screen.queryByText(/escButtonRestoreBeforeFlash/i)).not.toBeInTheDocument();

    act(() => {
      storeRef.store.dispatch(setBeforeFlash({ escs: [] }));
    });
    expect(screen.getByText(/escButtonRestoreBeforeFlash/i)).toBeInTheDocument();
  });

  it('should offer to save the file only offline', () => {
    const onOfflineSave = jest.fn();
    render(
      <Buttonbar
        onOfflineSave={onOfflineSave}
        onReadSetup={jest.fn()}
        onResetDefaults={jest.fn()}
        onWriteSetup={jest.fn()}
      />,
      { wrapper: storeRef.wrapper }
    );
    expect(screen.queryByText(/offlineSave/i)).not.toBeInTheDocument();

    act(() => {
      storeRef.store.dispatch(setOffline({ fileName: 'mini.json' }));
    });
    userEvent.click(screen.getByText(/offlineSave/i));
    expect(onOfflineSave).toHaveBeenCalled();
  });

  it('should offer to save the settings of the ESCs, not offline', () => {
    const onSaveEscSettings = jest.fn();
    storeRef.store.dispatch(setIndividual([{
      index: 0,
      settings: {},
    }]));
    render(
      <Buttonbar
        onReadSetup={jest.fn()}
        onResetDefaults={jest.fn()}
        onSaveEscSettings={onSaveEscSettings}
        onWriteSetup={jest.fn()}
      />,
      { wrapper: storeRef.wrapper }
    );
    userEvent.click(screen.getByText(/escButtonSaveSettings/i));
    expect(onSaveEscSettings).toHaveBeenCalled();

    act(() => {
      storeRef.store.dispatch(setOffline({ fileName: 'mini.json' }));
    });
    expect(screen.queryByText(/escButtonSaveSettings/i)).not.toBeInTheDocument();
  });

  it('should propose the settings file of the battery read, without loading anything', () => {
    const onRestoreSettings = jest.fn();
    storeRef.store.dispatch(setBatteryBeforeRead({
      cellCount: 4,
      voltage: 14.71,
    }));
    const view = (
      <Buttonbar
        onReadSetup={jest.fn()}
        onResetDefaults={jest.fn()}
        onRestoreSettings={onRestoreSettings}
        onWriteSetup={jest.fn()}
      />
    );
    render(view, { wrapper: storeRef.wrapper });

    // Nothing read yet: no proposal
    expect(screen.queryByText('batteryCellsProposal')).not.toBeInTheDocument();

    act(() => {
      storeRef.store.dispatch(setIndividual([{
        index: 0,
        settings: {},
      }]));
    });
    expect(screen.getByText('batteryCellsProposal')).toBeInTheDocument();
    expect(onRestoreSettings).not.toHaveBeenCalled();

    // 1S @ 14.7V: the cell count is doubtful, nothing is proposed
    act(() => {
      storeRef.store.dispatch(setBatteryBeforeRead({
        cellCount: 1,
        voltage: 14.7,
      }));
    });
    expect(screen.queryByText('batteryCellsProposal')).not.toBeInTheDocument();

    act(() => {
      storeRef.store.dispatch(setBatteryBeforeRead({ status: 'unknown' }));
    });
    expect(screen.queryByText('batteryCellsProposal')).not.toBeInTheDocument();
  });
});
