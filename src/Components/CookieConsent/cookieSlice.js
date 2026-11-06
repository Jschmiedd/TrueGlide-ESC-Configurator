import { createSlice } from '@reduxjs/toolkit';

const initialState = { accepted: false };

export const cookieSlice = createSlice({
  name: 'cookie',
  initialState,
  reducers: {
    accept: (state) => {
      // TrueGlide: no statistics script is ever loaded (privacy)
      state.accepted = true;
    },
  },
});

export const { accept } = cookieSlice.actions;

export default cookieSlice.reducer;
