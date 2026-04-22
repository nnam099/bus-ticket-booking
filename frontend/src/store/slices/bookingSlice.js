import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    selectedTrip: null,
    selectedSeats: [],        // Array of { id, seatCode, price }
    lockExpiresAt: null,
    passengerInfo: [],
    paymentMethod: null,
    currentOrder: null,
    step: 1,                  // 1=seat select, 2=passenger info, 3=payment, 4=confirmation
  },
  reducers: {
    setSelectedTrip(state, { payload }) {
      state.selectedTrip = payload;
      state.selectedSeats = [];
      state.step = 1;
    },
    toggleSeat(state, { payload }) {
      const idx = state.selectedSeats.findIndex(s => s.id === payload.id);
      if (idx >= 0) {
        state.selectedSeats.splice(idx, 1);
      } else {
        if (state.selectedSeats.length < 5) { // MAX_SEATS
          state.selectedSeats.push(payload);
        }
      }
    },
    setLockExpiry(state, { payload }) {
      state.lockExpiresAt = payload;
    },
    setPassengerInfo(state, { payload }) {
      state.passengerInfo = payload;
    },
    setPaymentMethod(state, { payload }) {
      state.paymentMethod = payload;
    },
    setCurrentOrder(state, { payload }) {
      state.currentOrder = payload;
    },
    setStep(state, { payload }) {
      state.step = payload;
    },
    resetBooking(state) {
      state.selectedTrip = null;
      state.selectedSeats = [];
      state.lockExpiresAt = null;
      state.passengerInfo = [];
      state.paymentMethod = null;
      state.currentOrder = null;
      state.step = 1;
    },
  },
});

export const {
  setSelectedTrip, toggleSeat, setLockExpiry,
  setPassengerInfo, setPaymentMethod, setCurrentOrder,
  setStep, resetBooking,
} = bookingSlice.actions;
export default bookingSlice.reducer;
