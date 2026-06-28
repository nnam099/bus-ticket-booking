const fs = require('fs');
let content = fs.readFileSync('frontend/src/store/slices/authSlice.js', 'utf8');

const thunkToAdd = `
export const registerOperator = createAsyncThunk('auth/registerOperator', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.registerOperator(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Đăng ký đối tác thất bại');
  }
});`;

content = content.replace(/(export const register = createAsyncThunk[\s\S]*?\n\}\);)/, '$1' + '\n' + thunkToAdd);

const reducerToAdd = `
      .addCase(registerOperator.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerOperator.fulfilled, (state) => { state.loading = false; })
      .addCase(registerOperator.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })`;

content = content.replace(/(\.addCase\(register\.rejected[\s\S]*?\}\);)/, '$1' + reducerToAdd);

fs.writeFileSync('frontend/src/store/slices/authSlice.js', content);
