const BOOT_LOADER_PINS = {
  PA2: 0x02,
  PB4: 0x14,
  PA6: 0x06,
};

/**
 * Further signal pins the public AM32 bootloader can report (code is
 * port * 16 + pin). ESCs answering with one of them are AM32, but are not
 * handled by this configurator yet.
 */
const BOOT_LOADER_PINS_UNSUPPORTED = {
  PA0: 0x00,
  PA15: 0x0F,
  PB2: 0x12,
  PC6: 0x26,
};

const RESET_DELAY_MS = 5000;
const LAYOUT_SIZE = 0xB0;

const BOOT_LOADER_VERSION_OFFSET = 0x00C0;
const BOOT_LOADER_VERSION_SIZE = 1;

// The bootloader only starts the firmware with this value in BOOT_BYTE
const BOOT_BYTE_READY = 0x01;

/**
 * First bootloader version whose check of BOOT_BYTE is proven on every MCU:
 * v12, the first version of am32-firmware/AM32-bootloader (commit 3a9e057;
 * CHECK_EEPROM_BEFORE_JUMP 1 from commit 35a244f, tag v12.0.2). Older
 * bootloaders came one per MCU; only the F051 one (V5 to V10) and the
 * AT32F421 one (v5) have a public source, and both check it.
 */
const BOOT_BYTE_CHECKED_FROM = 12;

const LAYOUT = {
  BOOT_BYTE: {
    offset: 0x00,
    size: 1,
  },
  LAYOUT_REVISION: {
    offset: 0x01,
    size: 1,
  },
  BOOT_LOADER_REVISION: {
    offset: 0x02,
    size: 1,
  },
  MAIN_REVISION: {
    offset: 0x03,
    size: 1,
  },
  SUB_REVISION: {
    offset: 0x04,
    size: 1,
  },
  NAME: {
    offset: 0x05,
    size: 12,
  },
  MOTOR_DIRECTION: {
    offset: 0x11,
    size: 1,
  },
  BIDIRECTIONAL_MODE: {
    offset: 0x12,
    size: 1,
  },
  SINUSOIDAL_STARTUP: {
    offset: 0x13,
    size: 1,
  },
  COMPLEMENTARY_PWM: {
    offset: 0x14,
    size: 1,
  },
  VARIABLE_PWM_FREQUENCY: {
    offset: 0x15,
    size: 1,
  },
  STUCK_ROTOR_PROTECTION: {
    offset: 0x16,
    size: 1,
  },
  TIMING_ADVANCE: {
    offset: 0x17,
    size: 1,
  },
  PWM_FREQUENCY: {
    offset: 0x18,
    size: 1,
  },
  STARTUP_POWER: {
    offset: 0x19,
    size: 1,
  },
  MOTOR_KV: {
    offset: 0x1a,
    size: 1,
  },
  MOTOR_POLES: {
    offset: 0x1b,
    size: 1,
  },
  BRAKE_ON_STOP: {
    offset: 0x1c,
    size: 1,
  },
  STALL_PROTECTION: {
    offset: 0x1d,
    size: 1,
  },
  BEEP_VOLUME: {
    offset: 0x1e,
    size: 1,
  },
  INTERVAL_TELEMETRY:{
    offset: 0x1f,
    size: 1,
  },
  SERVO_LOW_THRESHOLD: {
    offset: 0x20,
    size: 1,
  },
  SERVO_HIGH_THRESHOLD: {
    offset: 0x21,
    size: 1,
  },
  SERVO_NEUTRAL: {
    offset: 0x22,
    size: 1,
  },
  SERVO_DEAD_BAND: {
    offset: 0x23,
    size: 1,
  },
  LOW_VOLTAGE_CUTOFF: {
    offset: 0x24,
    size: 1,
  },
  LOW_VOLTAGE_THRESHOLD: {
    offset: 0x25,
    size: 1,
  },
  RC_CAR_REVERSING: {
    offset: 0x26,
    size: 1,
  },
  USE_HALL_SENSORS: {
    offset: 0x27,
    size: 1,
  },
  SINE_MODE_RANGE: {
    offset: 0x28,
    size: 1,
  },
  BRAKE_STRENGTH: {
    offset: 0x29,
    size: 1,
  },
  RUNNING_BRAKE_LEVEL: {
    offset: 0x2A,
    size: 1,
  },
  TEMPERATURE_LIMIT: {
    offset: 0x2B,
    size: 1,
  },
  CURRENT_LIMIT: {
    offset: 0x2C,
    size: 1,
  },
  SINE_MODE_POWER: {
    offset: 0x2D,
    size: 1,
  },
  ESC_PROTOCOL: {
    offset: 0x2E,
    size: 1,
  },
  STARTUP_MELODY: {
    offset: 0x30,
    size: 128,
  },
};

/**
 * EEPROM layout 4 (AM32 2.21 and 2.22), from the AM32 firmware, commit
 * 2a695a8dea4c6c432049c0becd8cffb05945f2b5, Inc/eeprom.h (EEprom_t) and
 * Inc/version.h (EEPROM_VERSION 4): bytes 5 to 16 no longer hold a name but
 * settings, and a CAN block (bytes 176 to 183) and reserved bytes (184 to 191)
 * follow the melody. The firmware reads and writes the 192 bytes at once
 * (sizeof(eepromBuffer.buffer) in Src/main.c) and the bootloader erases the
 * whole page before writing: the 192 bytes are always read and written back,
 * those not described here (15, 16 and 176 to 191) unchanged.
 */
const LAYOUT_4_SIZE = 0xC0;

const LAYOUT_4 = {
  ...Object.fromEntries(Object.entries(LAYOUT).filter(([name]) => name !== 'NAME')),
  MAX_RAMP: {
    offset: 0x05,
    size: 1,
  },
  MINIMUM_DUTY_CYCLE: {
    offset: 0x06,
    size: 1,
  },
  DISABLE_STICK_CALIBRATION: {
    offset: 0x07,
    size: 1,
  },
  ABSOLUTE_VOLTAGE_CUTOFF: {
    offset: 0x08,
    size: 1,
  },
  CURRENT_P: {
    offset: 0x09,
    size: 1,
  },
  CURRENT_I: {
    offset: 0x0A,
    size: 1,
  },
  CURRENT_D: {
    offset: 0x0B,
    size: 1,
  },
  ACTIVE_BRAKE_POWER: {
    offset: 0x0C,
    size: 1,
  },
  BRAKE_ON_ZERO_THROTTLE: {
    offset: 0x0D,
    size: 1,
  },
  DEMAG_COMPENSATION: {
    offset: 0x0E,
    size: 1,
  },
  AUTO_ADVANCE: {
    offset: 0x2F,
    size: 1,
  },
};

// Layouts read again with their own layout once their revision (byte 1) is known
const LAYOUTS = {
  4: {
    LAYOUT: LAYOUT_4,
    LAYOUT_SIZE: LAYOUT_4_SIZE,
  },
};

const EEPROM = {
  LAYOUT,
  LAYOUT_SIZE,
  LAYOUTS,
  BOOT_BYTE_READY,
  BOOT_BYTE_CHECKED_FROM,
  NAMES: [''],
  RESET_DELAY: RESET_DELAY_MS,
  BOOT_LOADER_OFFSET: BOOT_LOADER_VERSION_OFFSET,
  BOOT_LOADER_SIZE: BOOT_LOADER_VERSION_SIZE,
  BOOT_LOADER_PINS,
  BOOT_LOADER_PINS_UNSUPPORTED,
};

export default EEPROM;
