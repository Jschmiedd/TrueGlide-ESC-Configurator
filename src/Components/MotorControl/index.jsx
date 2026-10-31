
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import Slider, { createSliderWithTooltip } from 'rc-slider';
import 'rc-slider/assets/index.css';

import Checkbox from '../Input/Checkbox';
import { useInterval } from '../../utils/helpers/React';

import { selectConnected } from '../../Containers/App/escsSlice';

import './style.scss';

// About 30 % throttle: 300 µs above 1000, or 150 µs on each side of the 3D neutral
const MOTOR_TEST_RANGE = 300;
const MOTOR_TEST_RANGE_3D = 150;

const SliderWithTooltip = createSliderWithTooltip(Slider);

function BatteryState({ getBatteryState }) {
  const { t } = useTranslation('common');

  const cellLimit = 3.7;
  const [batteryState, setBatteryState] = useState({
    text: null,
    danger: false,
  });

  /* istanbul ignore next */
  useInterval(async() => {
    if(getBatteryState) {
      const state = await getBatteryState();

      if(state && state.cellCount > 0) {
        const danger = (state.voltage / state.cellCount) < cellLimit;
        setBatteryState({
          text: `${state.cellCount}S @ ${state.voltage}V`,
          danger,
        });
      } else {
        setBatteryState({
          text: null,
          danger: false,
        });
      }
    }
  }, 1000);

  if(batteryState.text) {
    return (
      <span className={`battery-state ${batteryState.danger ? 'danger' : ''}`}>
        {`${t('battery')} ${batteryState.text}`}
      </span>
    );
  }

  return null;
}

BatteryState.defaultProps = { getBatteryState: null };
BatteryState.propTypes = { getBatteryState: PropTypes.func };

function MotorSlider({
  disabled,
  max,
  min,
  onChange,
  startValue,
}) {
  const [value, setValue] = useState(startValue);

  /* istanbul ignore next */
  const update = useCallback((value) => {
    setValue(value);
    onChange(value);
  }, [onChange]);

  return(
    <SliderWithTooltip
      defaultValue={value}
      disabled={disabled}
      max={max}
      min={min}
      onChange={update}
      step={10}
      tipProps={{
        visible: true,
        placement: 'top',
      }}
    />
  );
}

MotorSlider.propTypes = {
  disabled: PropTypes.bool.isRequired,
  max: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  startValue: PropTypes.number.isRequired,
};

function IndividualMotorSlider({
  disabled,
  index,
  max,
  min,
  onChange,
  startValue,
}) {
  const { t } = useTranslation('common');

  /* istanbul ignore next */
  const update = useCallback((value) => {
    onChange(index + 1, value);
  }, [index, onChange]);

  return(
    <div className={`slider slider-${index}`}>
      <h3>
        {t("motorNr", { index: index + 1 })}
      </h3>

      <MotorSlider
        disabled={disabled}
        max={max}
        min={min}
        onChange={update}
        startValue={startValue}
      />
    </div>
  );
}

IndividualMotorSlider.propTypes = {
  disabled: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  startValue: PropTypes.number.isRequired,
};

function MotorControl({
  getBatteryState,
  onAllUpdate,
  onSingleUpdate,
  startValue,
}) {
  const { t } = useTranslation('common');

  const motorCount = useSelector(selectConnected);

  /**
   * TrueGlide: the test range is limited to about 30 % throttle: 1000-1300,
   * or 1350-1650 around the 1500 neutral in 3D mode (30 % in each direction).
   * It is only meant to check the direction.
   */
  const range = startValue > 1000 ? MOTOR_TEST_RANGE_3D : MOTOR_TEST_RANGE;
  const minValue = Math.max(1000, startValue - range);
  const maxValue = Math.min(2000, startValue + range);

  const [propsRemoved, setPropsRemoved] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [unlockIndividual, setUnlockIndividual] = useState(true);
  const [sliderReset, setSliderReset] = useState(0);
  const [singleReset, setSingleReset] = useState(0);

  // True while at least one motor was sent a speed above the start value.
  const spinningRef = useRef(false);
  const speedsRef = useRef({
    master: startValue,
    single: {},
  });
  const updateSpinning = useCallback(() => {
    const {
      master,
      single,
    } = speedsRef.current;
    spinningRef.current = master !== startValue ||
      Object.values(single).some((speed) => speed !== startValue);
  }, [startValue]);

  // Stops all motors and puts every slider back to its start value.
  const stopMotors = useCallback(() => {
    // Same rule as when leaving: no command when no motor was started
    if(spinningRef.current) {
      onAllUpdate(startValue);
    }
    speedsRef.current = {
      master: startValue,
      single: {},
    };
    spinningRef.current = false;
    setUnlockIndividual(true);
    setSliderReset((count) => count + 1);
  }, [startValue, onAllUpdate]);

  /**
   * Stop all motors when the page is closed or left, and when this tab is
   * removed. Refs keep the listeners stable while the props change.
   *
   * Nothing is sent when no motor was started: a late command would get lost
   * in the passthrough started by reading the ESCs (which removes this tab).
   */
  const stopRef = useRef(null);
  stopRef.current = () => {
    if(spinningRef.current) {
      spinningRef.current = false;
      onAllUpdate(startValue);
    }
  };
  useEffect(() => {
    const stop = () => stopRef.current();
    window.addEventListener('beforeunload', stop);
    window.addEventListener('pagehide', stop);

    return () => {
      window.removeEventListener('beforeunload', stop);
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, []);

  // Motor control can only be enabled once the pilot confirms that the
  // propellers are off; unticking it stops all motors.
  const togglePropsRemoved = useCallback(() => {
    if(propsRemoved) {
      setUnlock(false);
      stopMotors();
    }
    setPropsRemoved(!propsRemoved);
  }, [propsRemoved, stopMotors]);

  const toggleUnlock = useCallback(() => {
    setUnlock(!unlock);
    stopMotors();
  }, [unlock, stopMotors]);

  // Makes no sense to test, component has its own test, we just assume that
  // the slider actually slides.
  /* istanbul ignore next */
  const updateValue = useCallback((value) => {
    if(value !== startValue && unlockIndividual) {
      setUnlockIndividual(false);
    }

    if(value === startValue) {
      setUnlockIndividual(true);

      // Every motor is back at the start value: so are the individual sliders
      setSingleReset((count) => count + 1);
    }

    // The master slider sets every motor
    speedsRef.current = {
      master: value,
      single: {},
    };
    updateSpinning();
    onAllUpdate(value);
  }, [startValue, unlockIndividual, onAllUpdate, updateSpinning]);

  /* istanbul ignore next */
  const updateSingleValue = useCallback((index, speed) => {
    speedsRef.current.single[index] = speed;
    updateSpinning();
    onSingleUpdate(index, speed);
  }, [onSingleUpdate, updateSpinning]);

  const singleSliderElements = [];
  for(let i = 0; i < motorCount; i += 1) {
    singleSliderElements.push(
      <IndividualMotorSlider
        disabled={!unlock || !unlockIndividual}
        index={i}
        key={`${i}-${sliderReset}-${singleReset}`}
        max={maxValue}
        min={minValue}
        onChange={updateSingleValue}
        startValue={startValue}
      />
    );
  }

  const memoizedMasterSlider = useMemo(() => (
    <MotorSlider
      disabled={!unlock}
      key={sliderReset}
      max={maxValue}
      min={minValue}
      onChange={updateValue}
      startValue={startValue}
    />
  ), [startValue, unlock, updateValue, sliderReset, minValue, maxValue]);

  return (
    <div id="motor-control-wrapper">
      <div className="gui-box grey">
        <div className="gui-box-titlebar">
          <div className="spacer-box-title">
            {t('motorControl')}
          </div>
        </div>

        <div className="spacer-box">
          <div>
            <p>
              { t('motorControlTextLine1') }
            </p>

            <p>
              { t('motorControlTextLine2') }
            </p>

            <p>
              { t('motorControlTextLine3') }
            </p>

            <p className="motor-unplug-warning">
              <strong>
                { t('motorControlUnplugBattery') }
              </strong>
            </p>
          </div>

          <div className="line-wrapper">
            <div className="motor-safety-checks">
              <Checkbox
                label={t('propsRemovedConfirm')}
                name="props-removed"
                onChange={togglePropsRemoved}
                value={propsRemoved ? 1 : 0}
              />

              <Checkbox
                disabled={!propsRemoved}
                label={t('enableMotorControl')}
                name="enable-motor-control"
                onChange={toggleUnlock}
                value={unlock ? 1 : 0}
              />
            </div>

            <BatteryState
              getBatteryState={getBatteryState}
            />
          </div>

          <div id="slider-wrapper">
            <div id="single-slider">
              {singleSliderElements}
            </div>

            <div id="master-slider">
              <h3>
                {t('masterSpeed')}
              </h3>

              {memoizedMasterSlider}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MotorControl.defaultProps = {
  getBatteryState: null,
  startValue: 1000,
};
MotorControl.propTypes = {
  getBatteryState: PropTypes.func,
  onAllUpdate: PropTypes.func.isRequired,
  onSingleUpdate: PropTypes.func.isRequired,
  startValue: PropTypes.number,
};

export default MotorControl;
