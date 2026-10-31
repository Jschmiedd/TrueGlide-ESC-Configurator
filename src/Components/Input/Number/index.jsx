import React, {
  useCallback,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import Info from '../Info';

import './style.scss';

function Number({
  name,
  value,
  min,
  max,
  label,
  onChange,
  inSync,
  offset,
  factor,
  step,
  hint,
  disabled,
}) {
  const [displayValue, setDisplayValue] = useState(value * factor + offset);

  const updateValue = useCallback(() => {
    // Clamp the stored (raw) value, so that rounding can never go past
    // the limits (for example 255.875 rounded to 256).
    const rawMin = Math.ceil((min - offset) / factor);
    const rawMax = Math.floor((max - offset) / factor);

    let value = Math.round((displayValue - offset) / factor);
    if(isNaN(value)) {
      value = rawMin;
    }

    value = Math.min(Math.max(value, rawMin), rawMax);

    setDisplayValue(value * factor + offset);
    onChange(name, value);
  }, [displayValue, offset, factor, min, max, onChange, name]);

  const handleChange = useCallback((e) => {
    let value = parseInt(e.target.value, 10);
    setDisplayValue(value);
  }, []);

  return (
    <div className="number-text">
      <label>
        <div className="input-wrapper">
          <input
            data-testid={name}
            disabled={disabled}
            max={max}
            min={min}
            name={name}
            onBlur={updateValue}
            onChange={handleChange}
            step={step}
            type="number"
            value={inSync ? displayValue : 0}
          />
        </div>

        <Info
          hint={hint}
          inSync={inSync}
          label={label}
          name={name}
        />
      </label>
    </div>
  );
}

Number.defaultProps = {
  disabled: false,
  factor: 1,
  hint: null,
  inSync: true,
  max: 255,
  min: 1,
  offset: 0,
  step: 1,
  value: 0,
};
Number.propTypes = {
  disabled: PropTypes.bool,
  factor: PropTypes.number,
  hint: PropTypes.string,
  inSync: PropTypes.bool,
  label: PropTypes.string.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
  name: PropTypes.string.isRequired,
  offset: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  step: PropTypes.number,
  value: PropTypes.number,
};

export default Number;
