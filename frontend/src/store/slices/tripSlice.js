// tripSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tripAPI } from '../../services/api';

export const searchTrips = createAsyncThunk('trip/search', async (params, { rejectWithValue }) => {
  try {
    const res = await tripAPI.search(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Tìm kiếm thất bại');
  }
});

const tripSlice = createSlice({
  name: 'trip',
  initialState: { results: [], loading: false, error: null, searchParams: null },
  reducers: {
    setSearchParams(state, { payload }) { state.searchParams = payload; },
    clearResults(state) { state.results = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchTrips.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(searchTrips.fulfilled, (state, { payload }) => { state.loading = false; state.results = payload; })
      .addCase(searchTrips.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
  },
});

export const { setSearchParams, clearResults } = tripSlice.actions;
export default tripSlice.reducer;
