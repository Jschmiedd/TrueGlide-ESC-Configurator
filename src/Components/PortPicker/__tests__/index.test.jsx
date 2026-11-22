import React from 'react';
import {
  act,
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
        isIdle
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

  it('should open the offline file again when it is the only choice', () => {
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));
    storeRef.store.dispatch(setPortNames([]));
    const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

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

    // Nothing chosen yet: choosing the file is a change, again and again
    const list = screen.getByRole(/combobox/i, { name: 'port' });
    expect(list.value).toEqual('');
    fireEvent.change(list, { target: { value: 'offline-file' } });
    expect(list.value).toEqual('');
    expect(click).toHaveBeenCalledTimes(1);
    expect(onChangePort).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it('should show the port in use after choosing a file or a new port list', () => {
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));
    storeRef.store.dispatch(setPortNames(['p1', 'p2']));
    const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

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

    const list = screen.getByRole(/combobox/i, { name: 'port' });
    expect(list.value).toEqual('0');
    fireEvent.change(list, { target: { value: '1' } });
    expect(onChangePort).toHaveBeenCalledWith('1');
    expect(list.value).toEqual('1');

    // File chosen, then cancelled: the list still shows the port in use
    fireEvent.change(list, { target: { value: 'offline-file' } });
    expect(click).toHaveBeenCalledTimes(1);
    expect(list.value).toEqual('1');

    // The application takes the first port again when the list changes
    act(() => {
      storeRef.store.dispatch(setPortNames(['p1', 'p2']));
    });
    expect(list.value).toEqual('0');
    expect(onChangePort).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it('should not hide the offline disconnect button when no port is left', () => {
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

    expect(screen.queryByRole('button', { name: 'serialPermission' })).not.toBeInTheDocument();
    expect(screen.getByText('disconnectOffline')).toBeInTheDocument();
  });

  it('should offer a port again once the offline file is closed with no port', () => {
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

    expect(screen.queryByRole('button', { name: 'serialPermission' })).not.toBeInTheDocument();
    act(() => {
      storeRef.store.dispatch(setOffline(null));
      storeRef.store.dispatch(setOpen(false));
    });
    expect(screen.getByRole('button', { name: 'serialPermission' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'offlineOpenFile' })).toBeInTheDocument();
  });

  it('should offer the offline file even before a port is allowed', () => {
    storeRef.store.dispatch(setHasSerial(true));

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

  it('should not offer the offline file while a port is opening', () => {
    storeRef.store.dispatch(setConnected(true));
    storeRef.store.dispatch(setHasSerial(true));
    storeRef.store.dispatch(setPortNames(['p1']));

    render(
      <PortPicker
        isIdle={false}
        onChangePort={onChangePort}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onOfflineOpen={jest.fn()}
        onSetPort={onSetPort}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.queryByText('offlineOpenFile')).not.toBeInTheDocument();
  });
});
