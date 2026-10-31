import React from 'react';
import {
  render, screen, fireEvent,
} from '@testing-library/react';

import Number from '../';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

describe('Number', () => {
  it('should display a num', () => {
    const onChange = jest.fn();

    render(
      <Number
        label="test"
        name="test"
        onChange={onChange}
      />
    );

    expect(screen.getByText(/test/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: 1250,
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: -10,
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: 'Nan',
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));
  });

  it('should never round past the maximum stored value', () => {
    const onChange = jest.fn();

    // Bluejay minimum startup power: 1124 is 253.8 stored, 1125 would be 255.9
    render(
      <Number
        factor={1000 / 2047}
        label="test"
        max={1124}
        min={1000}
        name="test"
        offset={1000}
        onChange={onChange}
        value={0}
      />
    );

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: 1125,
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));

    expect(onChange).toHaveBeenLastCalledWith('test', 253);
  });

  it('should handle out of sync', () => {
    const onChange = jest.fn();

    render(
      <Number
        inSync={false}
        label="test"
        name="test"
        onChange={onChange}
      />
    );

    expect(screen.getByText(/test/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: 1250,
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: -10,
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));

    fireEvent.change(screen.getByRole(/spinbutton/i), {
      target: {
        value: 'Nan',
        name: 'test',
      },
    });
    fireEvent.blur(screen.getByRole(/spinbutton/i));
  });
});
