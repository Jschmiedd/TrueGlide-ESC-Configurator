import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import serialReducer, {
  setConnected,
  setHasSerial,
  setOffline,
  setOpen,
  setPortNames,
} from '../../../Containers/App/serialSlice';

import PortPicker from '../';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

function setupTestStore() {
  const refObj = {};

  beforeEach(() => {
    const store = configureStore({ reducer: { serial: serialReducer } });
    refObj.store = store;
    refObj.wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
  });

  return refObj;
}

let onChangePort;
let onConnect;
let onDisconnect;
let onSetPort;

describe('PortPicker', () => {
  const storeRef = setupTestStore();

  beforeEach(() => {
    onChangePort = jest.fn();
    onConnect = jest.fn();
    onDisconnect = jest.fn();
    onSetPort = jest.fn();
  });

  it('should show warning screen', () => {
    render(
      <PortPicker
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText('Web Serial')).toBeInTheDocument();
  });

  it('should allow port choice', () => {
    storeRef.store.dispatch(setHasSerial(true));

    render(
      <PortPicker
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText(/serialPermission/i)).toBeInTheDocument();
    expect(screen.getByText(/openPortSelection/i)).toBeInTheDocument();

    userEvent.click(screen.getByText(/openPortSelection/i));
    expect(onSetPort).toHaveBeenCalled();
  });

  it('should display ports', () => {
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));

    render(
      <PortPicker
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText(/openPortSelection/i)).toBeInTheDocument();
  });

  it('should allow to change port and baudrate', () => {
    storeRef.store.dispatch(setOpen(true));
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));
    storeRef.store.dispatch(setPortNames(['p1', 'p2']));

    render(
      <PortPicker
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText(/openPortSelection/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole(/combobox/i, { name: 'baudRate' }), {
      target: {
        value: '57600',
        name: 'baudRate',
      },
    });

    fireEvent.change(screen.getByRole(/combobox/i, { name: 'port' }), {
      target: {
        value: '1',
        name: 'port',
      },
    });
  });

  it('should open a settings file offline from the port list', async() => {
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));
    storeRef.store.dispatch(setPortNames(['p1']));
    const onOfflineOpen = jest.fn();
    const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    render(
      <PortPicker
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onOfflineOpen={onOfflineOpen}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    fireEvent.change(screen.getByRole(/combobox/i, { name: 'port' }), { target: { value: 'offline-file' } });
    expect(click).toHaveBeenCalled();
    expect(onChangePort).not.toHaveBeenCalled();

    const file = new File(['{"format":"trueglide-esc-reglages"}'], 'mini.json', { type: 'application/json' });
    userEvent.upload(screen.getByTestId('offline-file'), file);
    await waitFor(() => expect(onOfflineOpen).toHaveBeenCalledWith('{"format":"trueglide-esc-reglages"}', 'mini.json'));
    click.mockRestore();
  });

  it('should offer the offline file even before a port is allowed', () => {
    storeRef.store.dispatch(setHasSerial(true));

    render(
      <PortPicker
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onOfflineOpen={jest.fn()}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByRole('button', { name: 'offlineOpenFile' })).toBeInTheDocument();
  });

  it('should only offer to leave the offline file while it is open', () => {
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));
    storeRef.store.dispatch(setOpen(true));
    storeRef.store.dispatch(setOffline({
      fileName: 'mini.json',
      count: 4,
    }));

    render(
      <PortPicker
        isIdle
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onOfflineOpen={jest.fn()}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByRole(/combobox/i, { name: 'port' })).toBeDisabled();
    userEvent.click(screen.getByText('disconnectOffline'));
    expect(onDisconnect).toHaveBeenCalled();
    expect(onConnect).not.toHaveBeenCalled();
  });
});
