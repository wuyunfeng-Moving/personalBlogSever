import { configureStore } from '@reduxjs/toolkit';
import postsReducer from './postsSlice';
import deviceTypesReducer from './deviceTypesSlice';

export const store = configureStore({
  reducer: {
    recipes: postsReducer, // 保持'recipes'键名以兼容现有代码
    deviceTypes: deviceTypesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 