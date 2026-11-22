const SETTINGS_LAYOUT_0 = [
  {
    name: 'SINUSOIDAL_STARTUP',
    type: 'bool',
    label: 'escSinusoidalStartup',
    group: 'am32sine',
  },
  {
    name: 'COMPLEMENTARY_PWM',
    type: 'bool',
    label: 'escComplementaryPwm',
    group: 'am32pwm',
  },
  {
    name: 'VARIABLE_PWM_FREQUENCY',
    type: 'bool',
    label: 'escVariablePwmFrequency',
    group: 'am32pwm',
  },
  {
    name: 'STUCK_ROTOR_PROTECTION',
    type: 'bool',
    label: 'escStuckRotorProtection',
    group: 'am32safety',
  },
  {
    name: 'STALL_PROTECTION',
    type: 'bool',
    label: 'escStallProtection',
    group: 'am32safety',
  },
  {
    name: 'TIMING_ADVANCE',
    type: 'number',
    min: 0,
    max: 22.5,
    step: 7.5,
    label: 'escTimingAdvance',
    displayFactor: 7.5,
    order: 100,
  },
  {
    name: 'MOTOR_KV',
    type: 'number',
    min: 20,
    max: 10220,
    step: 40,
    label: 'escMotorKv',
    displayFactor: 40,
    displayOffset: 20,
    group: 'am32motor',
  },
  {
    name: 'MOTOR_POLES',
    type: 'number',
    min: 2,
    max: 36,
    step: 1,
    label: 'escMotorPoles',
    group: 'am32motor',
  },
  {
    name: 'STARTUP_POWER',
    type: 'number',
    min: 50,
    max: 150,
    step: 1,
    label: 'escStartupPower',
    order: 200,
  },
  {
    name: 'PWM_FREQUENCY',
    type: 'number',
    min: 24,
    max: 48,
    step: 1,
    label: 'escPwmFrequency',
    visibleIf: (settings) => settings.VARIABLE_PWM_FREQUENCY === 0,
  },
  {
    name: 'BRAKE_ON_STOP',
    type: 'bool',
    label: 'escBrakeOnStop',
    group: 'am32brake',
  },
];

const SETTINGS_LAYOUT_1 = [
  ...SETTINGS_LAYOUT_0,
  {
    name: 'BEEP_VOLUME',
    type: 'number',
    label: 'escBeepVolume',
    min: 0,
    max: 11,
    step: 1,
  },
  {
    name: 'INTERVAL_TELEMETRY',
    type: 'bool',
    label: 'escIntervalTelemetry',
  },
  {
    name: 'SERVO_LOW_THRESHOLD',
    type: 'number',
    label: 'escServoLowThreshold',
    min: 750,
    max: 1250,
    step: 1,
    displayFactor: 2,
    displayOffset: 750,
    group: 'am32servo',
  },
  {
    name: 'SERVO_HIGH_THRESHOLD',
    type: 'number',
    label: 'escServoHighThreshold',
    min: 1750,
    max: 2250,
    step: 1,
    displayFactor: 2,
    displayOffset: 1750,
    group: 'am32servo',
  },
  {
    name: 'SERVO_NEUTRAL',
    type: 'number',
    label: 'escServoNeutral',
    min: 1374,
    max: 1629,
    step: 1,
    displayFactor: 1,
    displayOffset: 1374,
    group: 'am32servo',
  },
  {
    name: 'SERVO_DEAD_BAND',
    type: 'number',
    label: 'escServoDeadBand',
    min: 0,
    max: 100,
    step: 1,
    group: 'am32servo',
  },
  // LOW_VOLTAGE_CUTOFF and LOW_VOLTAGE_THRESHOLD are not shown: TrueGlide
  // never lets an ESC cut the motors in flight (see utils/LowVoltage.js).
  {
    name: 'RC_CAR_REVERSING',
    type: 'bool',
    label: 'escRcCarReversing',
  },
];

const SETTINGS_LAYOUT_2 = [
  ...SETTINGS_LAYOUT_1,
  {
    name: 'USE_HALL_SENSORS',
    type: 'bool',
    label: 'escHallSensors',
  },
  {
    name: 'SINE_MODE_RANGE',
    type: 'number',
    label: 'escSineModeRange',
    min: 5,
    max: 25,
    step: 1,
    visibleIf: (settings) => settings.SINUSOIDAL_STARTUP === 1,
    group: 'am32sine',
  },
  {
    name: 'BRAKE_STRENGTH',
    type: 'number',
    label: 'escBrakeStrength',
    min: 1,
    max: 10,
    step: 1,
    visibleIf: (settings) => settings.BRAKE_ON_STOP === 1,
    group: 'am32brake',
  },
  {
    name: 'ESC_PROTOCOL',
    type: 'enum',
    label: 'escSelectProtocol',
    options: [
      {
        value: 0,
        label: 'Auto',
      },
      {
        value: 1,
        label: 'DShot',
      },
      {
        value: 2,
        label: 'Servo',
      },
      {
        value: 3,
        label: 'Serial',
      },
      {
        value: 4,
        label: 'EDT ARM',
      },
    ],
    order: 0,
  },
  {
    name: 'RUNNING_BRAKE_LEVEL',
    type: 'number',
    label: 'am32RunningBrakeLevel',
    min: 1,
    max: 10,
    step: 1,
    group: 'am32brake',
  },
  {
    name: 'TEMPERATURE_LIMIT',
    type: 'number',
    label: 'am32TemperatureLimit',
    min: 70,
    max: 141,
    step: 1,
    disableValue: 141,
    group: 'am32safety',
  },
  {
    name: 'CURRENT_LIMIT',
    type: 'number',
    label: 'am32CurrentLimit',
    min: 0,
    max: 202,
    step: 2,
    displayFactor: 2,
    disableValue: 202,
    group: 'am32safety',
  },
  {
    name: 'SINE_MODE_POWER',
    type: 'number',
    label: 'am32SineModePower',
    min: 1,
    max: 10,
    step: 1,
    visibleIf: (settings) => settings.SINUSOIDAL_STARTUP === 1,
    group: 'am32sine',
  },
];

/**
 * Layout 4 (AM32 2.21 and 2.22). Bounds and values from the AM32 firmware,
 * commit 2a695a8dea4c6c432049c0becd8cffb05945f2b5 (loadEEpromSettings() in
 * Src/main.c, the parameter table of Src/DroneCAN/DroneCAN.c) and the AM32
 * configurator, commit e11c42e7840b388b40091767f1abb8e58c161f88
 * (pages/configurator.vue). Left out because the two do not give the same
 * bounds or meaning, or the screen could not show the value exactly: timing
 * advance (now 10 to 42), ramp rate, minimum duty cycle, active brake power,
 * brake on zero throttle and the absolute voltage cutoff (TrueGlide never lets
 * an ESC cut the motors, see utils/LowVoltage). Those bytes are written back
 * unchanged.
 */
const SETTINGS_LAYOUT_4 = [
  ...SETTINGS_LAYOUT_2.filter((setting) => ![
    'TIMING_ADVANCE',
    'PWM_FREQUENCY',
    'VARIABLE_PWM_FREQUENCY',
    'BRAKE_ON_STOP',
    'BRAKE_STRENGTH',
  ].includes(setting.name)),
  {
    // 0 fixed, 1 range set by the PWM frequency, 2 automatic (by RPM)
    name: 'VARIABLE_PWM_FREQUENCY',
    type: 'enum',
    label: 'escVariablePwmFrequency',
    options: [
      {
        value: 0,
        label: 'Fixed',
      },
      {
        value: 1,
        label: 'Variable',
      },
      {
        value: 2,
        label: 'by RPM',
      },
    ],
    group: 'am32pwm',
  },
  {
    name: 'PWM_FREQUENCY',
    type: 'number',
    min: 8,
    max: 144,
    step: 1,
    label: 'escPwmFrequency',
    visibleIf: (settings) => Number(settings.VARIABLE_PWM_FREQUENCY) < 2,
  },
  {
    // 1 drag brake, 2 active brake (when armed)
    name: 'BRAKE_ON_STOP',
    type: 'enum',
    label: 'escBrakeOnStop',
    options: [
      {
        value: 0,
        label: 'Off',
      },
      {
        value: 1,
        label: 'Brake on stop',
      },
      {
        value: 2,
        label: 'Active brake',
      },
    ],
    group: 'am32brake',
  },
  {
    name: 'BRAKE_STRENGTH',
    type: 'number',
    label: 'escBrakeStrength',
    min: 1,
    max: 10,
    step: 1,
    visibleIf: (settings) => Number(settings.BRAKE_ON_STOP) === 1,
    group: 'am32brake',
  },
  {
    name: 'AUTO_ADVANCE',
    type: 'bool',
    label: 'am32AutoAdvance',
  },
  {
    name: 'DISABLE_STICK_CALIBRATION',
    type: 'bool',
    label: 'am32DisableStickCalibration',
  },
  {
    // The firmware uses twice the value as gain
    name: 'CURRENT_P',
    type: 'number',
    label: 'am32CurrentP',
    min: 0,
    max: 510,
    step: 2,
    displayFactor: 2,
    group: 'am32safety',
  },
  {
    name: 'CURRENT_I',
    type: 'number',
    label: 'am32CurrentI',
    min: 0,
    max: 255,
    step: 1,
    group: 'am32safety',
  },
  {
    name: 'CURRENT_D',
    type: 'number',
    label: 'am32CurrentD',
    min: 0,
    max: 510,
    step: 2,
    displayFactor: 2,
    group: 'am32safety',
  },
  {
    // Byte 14 is only used from firmware 2.22 on (reserved in 2.21)
    name: 'DEMAG_COMPENSATION',
    type: 'enum',
    label: 'am32DemagCompensation',
    options: [
      {
        value: 0,
        label: 'Off',
      },
      {
        value: 1,
        label: 'Coast only',
      },
      {
        value: 2,
        label: '1/32 power cut',
      },
      {
        value: 3,
        label: '1/16 power cut',
      },
      {
        value: 4,
        label: '1/8 power cut',
      },
    ],
    visibleIf: (settings) => settings.MAIN_REVISION > 2 || (settings.MAIN_REVISION === 2 && settings.SUB_REVISION >= 22),
    group: 'am32motor',
  },
];

const COMMON = {
  '0': { base: SETTINGS_LAYOUT_0 },
  '1': { base: SETTINGS_LAYOUT_1 },
  '2': { base: SETTINGS_LAYOUT_2 },
  '4': { base: SETTINGS_LAYOUT_4 },
};

const INDIVIDUAL_SETTINGS_0 = [
  {
    name: 'MOTOR_DIRECTION',
    type: 'bool',
    label: 'escDirectionReversed',
  },
  {
    name: 'BIDIRECTIONAL_MODE',
    type: 'bool',
    label: 'escBidirectionalMode',
  },
];

const INDIVIDUAL_SETTINGS_1 = [
  ...INDIVIDUAL_SETTINGS_0,
  {
    name: 'STARTUP_MELODY',
    type: 'melody',
    label: 'startupMelody',
    value: [2, 58, 4, 32, 52, 66, 13, 0, 69, 45, 13, 0, 52, 66, 13, 0, 78, 39, 211, 0, 69, 45, 208, 25, 52, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    melodyLength: 128,
  },
];

const INDIVIDUAL_SETTINGS_2 = [
  ...INDIVIDUAL_SETTINGS_1,
  {
    name: 'STARTUP_MELODY',
    type: 'melody',
    label: 'startupMelody',
    value: [2, 58, 4, 32, 52, 66, 13, 0, 69, 45, 13, 0, 52, 66, 13, 0, 78, 39, 211, 0, 69, 45, 208, 25, 52, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    melodyLength: 128,
  },
];

const INDIVIDUAL = {
  '0': { base: INDIVIDUAL_SETTINGS_0 },
  '1': { base: INDIVIDUAL_SETTINGS_1 },
  '2': { base: INDIVIDUAL_SETTINGS_2 },
  '4': { base: INDIVIDUAL_SETTINGS_2 },
};

const DEFAULT_SETTINGS_0 = {
  MOTOR_DIRECTION: 0,
  BIDIRECTIONAL_MODE: 0,
  SINUSOIDAL_STARTUP: 0,
  COMPLEMENTARY_PWM: 1,
  VARIABLE_PWM_FREQUENCY: 1,
  STUCK_ROTOR_PROTECTION: 1,
  TIMING_ADVANCE: 2,
  PWM_FREQUENCY: 24,
  STARTUP_POWER: 100,
  MOTOR_KV: 55,
  MOTOR_POLES: 14,
  BRAKE_ON_STOP: 1,
  STALL_PROTECTION: 0,
};

const DEFAULT_SETTINGS_1 = {
  ...DEFAULT_SETTINGS_0,
  BEEP_VOLUME: 5,
  INTERVAL_TELEMETRY: 0,
  SERVO_LOW_THRESHOLD: 128,
  SERVO_HIGH_THRESHOLD: 128,
  SERVO_NEUTRAL: 128,
  SERVO_DEAD_BAND: 50,
  LOW_VOLTAGE_CUTOFF: 0,
  LOW_VOLTAGE_THRESHOLD: 50,
  RC_CAR_REVERSING: 0,
  STARTUP_MELODY: [2, 58, 4, 32, 52, 66, 13, 0, 69, 45, 13, 0, 52, 66, 13, 0, 78, 39, 211, 0, 69, 45, 208, 25, 52, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const DEFAULT_SETTINGS_2 = {
  ...DEFAULT_SETTINGS_1,
  USE_HALL_SENSORS: 0,
  SINE_MODE_RANGE: 8,
  BRAKE_STRENGTH: 10,
  RUNNING_BRAKE_LEVEL: 10,
  TEMPERATURE_LIMIT: 141,
  CURRENT_LIMIT: 101,
  SINE_MODE_POWER: 6,
  ESC_PROTOCOL: 0,
};

/**
 * Layout 4: only the values the firmware itself sets when it takes over an
 * older EEPROM (loadEEpromSettings() in Src/main.c, same commit). No other
 * default is known for this layout: the other settings are kept.
 */
const DEFAULT_SETTINGS_4 = {
  DISABLE_STICK_CALIBRATION: 0,
  CURRENT_P: 100,
  CURRENT_I: 0,
  CURRENT_D: 100,
  DEMAG_COMPENSATION: 0,
};

const DEFAULTS = {
  '0': DEFAULT_SETTINGS_0,
  '1': DEFAULT_SETTINGS_1,
  '2': DEFAULT_SETTINGS_2,
  '4': DEFAULT_SETTINGS_4,
};

const settings = {
  DEFAULTS,
  INDIVIDUAL,
  COMMON,
};

export default settings;
