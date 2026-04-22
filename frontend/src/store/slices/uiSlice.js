import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toast: null, modalOpen: null },
  reducers: {
    showToast(state, { payload }) { state.toast = payload; },
    hideToast(state) { state.toast = null; },
    openModal(state, { payload }) { state.modalOpen = payload; },
    closeModal(state) { state.modalOpen = null; },
  },
});

export const { showToast, hideToast, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
