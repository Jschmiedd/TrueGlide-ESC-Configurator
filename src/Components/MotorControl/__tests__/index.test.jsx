import React from 'react';
import {
  render,
  screen,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import escsReducer, { setConnected } from '../../../Containers/App/escsSlice';

import MotorControl from '../';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

let onAllUpdate;
let onSingleUpdate;
let getBatteryState;

function setupTestStore() {
  const refObj = {};

  beforeEach(() => {
    const store = configureStore({ reducer: { escs: escsReducer } });
    refObj.store = store;
    refObj.wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
  });

  return refObj;
}

describe('MotorControl', () => {
  const storeRef = setupTestStore();

  beforeEach(() => {
    onAllUpdate = jest.fn();
    onSingleUpdate = jest.fn();
    getBatteryState = jest.fn();
  });

  it('should render without motor count', () => {
    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText('motorControl')).toBeInTheDocument();
    expect(screen.getByText(/enableMotorControl/i)).toBeInTheDocument();
    expect(screen.getByText(/masterSpeed/i)).toBeInTheDocument();
  });

  it('should render with motorcount', () => {
    storeRef.store.dispatch(setConnected(4));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText('motorControl')).toBeInTheDocument();
    expect(screen.getByText(/enableMotorControl/i)).toBeInTheDocument();
    expect(screen.getByText(/masterSpeed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/motorNr/i).length).toEqual(4);

    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
  });

  it('should only allow motor control once the propellers are removed', () => {
    storeRef.store.dispatch(setConnected(4));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
      />,
      { wrapper: storeRef.wrapper }
    );

    const propsRemoved = screen.getByRole('checkbox', { name: 'props-removed' });
    const enable = screen.getByRole('checkbox', { name: 'enable-motor-control' });
    expect(screen.getByText(/propsRemovedConfirm/i)).toBeInTheDocument();
    expect(enable).toBeDisabled();

    userEvent.click(propsRemoved);
    expect(enable).not.toBeDisabled();
    userEvent.click(enable);
    expect(enable).toBeChecked();

    // Unticking the confirmation locks motor control again and stops the motors
    onAllUpdate.mockClear();
    userEvent.click(propsRemoved);
    expect(enable).toBeDisabled();
    expect(enable).not.toBeChecked();
    expect(onAllUpdate).toHaveBeenCalled();
  });

  it('should show battery state', async () => {
    storeRef.store.dispatch(setConnected(4));

    const getBatteryState = jest.fn(() => (
      {
        cellCount: 1,
        voltage: 3.8,
      }
    ));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText('motorControl')).toBeInTheDocument();
    expect(screen.getByText(/enableMotorControl/i)).toBeInTheDocument();
    expect(screen.getByText(/masterSpeed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/motorNr/i).length).toEqual(4);

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });
    });

    expect(getBatteryState).toHaveBeenCalled();
    expect(screen.getByText(/battery 1S @ 3.8V/i)).toBeInTheDocument();
  });

  it('should highlight battery low', async () => {
    storeRef.store.dispatch(setConnected(4));

    const getBatteryState = jest.fn(() => (
      {
        cellCount: 1,
        voltage: 2.8,
      }
    ));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText('motorControl')).toBeInTheDocument();
    expect(screen.getByText(/enableMotorControl/i)).toBeInTheDocument();
    expect(screen.getByText(/masterSpeed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/motorNr/i).length).toEqual(4);

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });
    });

    expect(getBatteryState).toHaveBeenCalled();
    expect(screen.getByText(/battery 1S @ 2.8V/i)).toBeInTheDocument();
  });
});
