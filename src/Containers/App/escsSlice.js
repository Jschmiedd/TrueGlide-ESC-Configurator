import { createSlice } from '@reduxjs/toolkit';

/**
 * NOTE: The individual array holds individual ESC settings, the actual index
 *       in the array does not represent the actual index of the ESC. If for
 *       example only one ESC is attached, the individual length will have a
 *       length of 1. The actual index of the ESC must be reat from that object.
 *
 *       Eg.: Only one ESC is attached to motor pin 2 an an FC where 4 ESCs
 *            are expected. The individual array will have a length of 1, but
 *            at index 0 it will have the settings for the ESC attached to motor
 *            pin 2.
 */

const initialState = {
  connected: 0,
  master: {},
  targets: [],
  individual: [],
  batteryBeforeRead: null,
  beforeFlash: null,
};

export const escsSlice = createSlice({
  name: 'escs',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    setMaster: (state, action) => {
      state.master = action.payload;
    },
    updateIndividual: (state, action) => {
      const names = action.payload || [];
      const newIndividual = [];
      for(let i = 0; i < state.individual.length; i += 1) {
        // An ESC in FLASH*FAILED keeps its mark: it is skipped when writing,
        // so it must not take the common settings (checked here directly,
        // importing the Settings helpers would be circular)
        const { settings } = state.individual[i];
        if(settings && settings.NAME === '**FLASH*FAILED**') {
          newIndividual.push(state.individual[i]);
          continue;
        }

        const ownSettings = { ...settings };
        names.forEach((name) => {
          if(name in ownSettings && name in state.master) {
            ownSettings[name] = state.master[name];
          }
        });

        const newSettings = {
          ...state.individual[i],
          settings: ownSettings,
        };

        newIndividual.push(newSettings);
      }

      state.individual = newIndividual;
    },
    setBatteryBeforeRead: (state, action) => {
      state.batteryBeforeRead = action.payload;
    },
    setBeforeFlash: (state, action) => {
      state.beforeFlash = action.payload;
    },
    setTargets: (state, action) => {
      state.targets = action.payload;
    },
    setIndividual: (state, action) => {
      state.individual = action.payload;
    },
    setIndividualAtIndex: (state, action) => {
      const {
        index,
        settings,
      } = action.payload;

      for(let i = 0; i < state.individual.length; i += 1) {
        if(state.individual[i].index === index) {
          state.individual[i] = {
            ...state.individual[i],
            ...settings,
          };

          break;
        }
      }
    },
  },
});

export const {
  setBatteryBeforeRead,
  setBeforeFlash,
  setConnected,
  setMaster,
  setTargets,
  setIndividual,
  setIndividualAtIndex,
  updateIndividual,
} = escsSlice.actions;

export const selectConnected = (state) => state.escs.connected;
export const selectTargets = (state) => state.escs.targets;
export const selectMaster = (state) => state.escs.master;
export const selectIndividual = (state) => state.escs.individual;
export const selectBatteryBeforeRead = (state) => state.escs.batteryBeforeRead;
export const selectBeforeFlash = (state) => state.escs.beforeFlash;

export default escsSlice.reducer;
