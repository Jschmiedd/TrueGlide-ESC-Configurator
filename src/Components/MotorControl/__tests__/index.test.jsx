import React from 'react';
import {
  render,
  screen,
  act,
  fireEvent,
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

  it('should not send a stop command when no motor was started', () => {
    storeRef.store.dispatch(setConnected(4));

    const { unmount } = render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    onAllUpdate.mockClear();
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('beforeunload'));

    // Reading the ESCs removes this tab: no late command in the passthrough
    unmount();
    expect(onAllUpdate).not.toHaveBeenCalled();
  });

  it('should stop all motors when the page or the tab is left', () => {
    storeRef.store.dispatch(setConnected(1));

    const { unmount } = render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    const spin = () => fireEvent.keyDown(screen.getAllByRole('slider').pop(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'enable-motor-control' }));

    spin();
    onAllUpdate.mockClear();
    window.dispatchEvent(new Event('pagehide'));
    expect(onAllUpdate).toHaveBeenLastCalledWith(1000);

    spin();
    onAllUpdate.mockClear();
    window.dispatchEvent(new Event('beforeunload'));
    expect(onAllUpdate).toHaveBeenLastCalledWith(1000);

    spin();
    onAllUpdate.mockClear();
    unmount();
    expect(onAllUpdate).toHaveBeenLastCalledWith(1000);

    // Listeners are removed with the tab
    onAllUpdate.mockClear();
    window.dispatchEvent(new Event('pagehide'));
    expect(onAllUpdate).not.toHaveBeenCalled();
  });

  it('should not send a stop command once the sliders are back to the start value', () => {
    storeRef.store.dispatch(setConnected(1));

    const { unmount } = render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'enable-motor-control' }));

    // Individual slider up and down again
    const single = () => screen.getAllByRole('slider')[0];
    fireEvent.keyDown(single(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    fireEvent.keyDown(single(), {
      key: 'ArrowDown',
      keyCode: 40,
    });

    // Master slider up and down again
    const master = () => screen.getAllByRole('slider').pop();
    fireEvent.keyDown(master(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    fireEvent.keyDown(master(), {
      key: 'ArrowDown',
      keyCode: 40,
    });
    expect(master().getAttribute('aria-valuenow')).toEqual('1000');

    onAllUpdate.mockClear();
    window.dispatchEvent(new Event('pagehide'));
    unmount();
    expect(onAllUpdate).not.toHaveBeenCalled();
  });

  it('should stop all motors when only one motor was started', () => {
    storeRef.store.dispatch(setConnected(2));

    const { unmount } = render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'enable-motor-control' }));
    fireEvent.keyDown(screen.getAllByRole('slider')[1], {
      key: 'ArrowUp',
      keyCode: 38,
    });
    expect(onSingleUpdate).toHaveBeenLastCalledWith(2, 1010);

    onAllUpdate.mockClear();
    unmount();
    expect(onAllUpdate).toHaveBeenLastCalledWith(1000);
  });

  it('should limit the motor test to about 30 % throttle, also in 3D mode', () => {
    storeRef.store.dispatch(setConnected(1));

    const { unmount } = render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    screen.getAllByRole('slider').forEach((slider) => {
      expect(slider.getAttribute('aria-valuemin')).toEqual('1000');
      expect(slider.getAttribute('aria-valuemax')).toEqual('1300');
    });
    unmount();

    // 3D mode: around the 1500 center
    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1500}
      />,
      { wrapper: storeRef.wrapper }
    );

    screen.getAllByRole('slider').forEach((slider) => {
      expect(slider.getAttribute('aria-valuemin')).toEqual('1350');
      expect(slider.getAttribute('aria-valuemax')).toEqual('1650');
    });
  });

  it('should put the individual sliders back when the master slider is at the start value', () => {
    storeRef.store.dispatch(setConnected(1));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'enable-motor-control' }));

    const single = () => screen.getAllByRole('slider')[0];
    const master = () => screen.getAllByRole('slider').pop();
    fireEvent.keyDown(single(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    expect(single().getAttribute('aria-valuenow')).toEqual('1010');

    // Master up and back to the start value: every motor is at 1000
    fireEvent.keyDown(master(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    fireEvent.keyDown(master(), {
      key: 'ArrowDown',
      keyCode: 40,
    });
    expect(onAllUpdate).toHaveBeenLastCalledWith(1000);
    expect(single().getAttribute('aria-valuenow')).toEqual('1000');
  });

  it('should ask to unplug the battery before leaving', () => {
    storeRef.store.dispatch(setConnected(1));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    expect(screen.getByText(/motorControlUnplugBattery/i)).toBeInTheDocument();
  });

  it('should put the sliders back to the start value when the motors are stopped', () => {
    storeRef.store.dispatch(setConnected(1));

    render(
      <MotorControl
        getBatteryState={getBatteryState}
        onAllUpdate={onAllUpdate}
        onSingleUpdate={onSingleUpdate}
        startValue={1000}
      />,
      { wrapper: storeRef.wrapper }
    );

    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'enable-motor-control' }));

    // The master slider comes after the individual ones
    const masterHandle = () => screen.getAllByRole('slider').pop();
    fireEvent.keyDown(masterHandle(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    expect(masterHandle().getAttribute('aria-valuenow')).toEqual('1010');

    userEvent.click(screen.getByRole('checkbox', { name: 'props-removed' }));
    expect(masterHandle().getAttribute('aria-valuenow')).toEqual('1000');
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
    fireEvent.keyDown(screen.getAllByRole('slider').pop(), {
      key: 'ArrowUp',
      keyCode: 38,
    });
    onAllUpdate.mockClear();
    userEvent.click(propsRemoved);
    expect(enable).toBeDisabled();
    expect(enable).not.toBeChecked();
    expect(onAllUpdate).toHaveBeenLastCalledWith(1000);
  });

  it('should not send a stop command when toggling without any motor started', () => {
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
    onAllUpdate.mockClear();
    userEvent.click(propsRemoved);
    userEvent.click(enable);
    userEvent.click(enable);
    userEvent.click(enable);
    userEvent.click(propsRemoved);

    expect(onAllUpdate).not.toHaveBeenCalled();
  });

  it('should describe the limited range, including 3D mode', () => {
    const fr = require('../../../translations/fr/common.json');
    const en = require('../../../translations/en/common.json');

    // No "above idle" wording: in 3D mode the range is around the neutral
    expect(fr.motorControlUnplugBattery).toMatch(/1350 à 1650 µs en mode 3D/);
    expect(fr.motorControlUnplugBattery).not.toMatch(/au-dessus du ralenti/);
    expect(en.motorControlUnplugBattery).toMatch(/1350 to 1650 µs in 3D mode/);
    expect(en.motorControlUnplugBattery).not.toMatch(/above idle/);
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
