import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { DeviceModel } from '../services/api';

interface DeviceTypesState {
  items: DeviceModel[] | null;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: DeviceTypesState = {
  items: null,
  totalCount: 0,
  loading: false,
  error: null,
};

export const fetchDeviceModels = createAsyncThunk(
  'deviceTypes/fetchDeviceModels',
  async () => {
    const response = await api.getDeviceModels();
    return response;
  }
);

const deviceTypesSlice = createSlice({
  name: 'deviceTypes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeviceModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceModels.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchDeviceModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取设备类型列表失败';
      });
  },
});

export default deviceTypesSlice.reducer; 