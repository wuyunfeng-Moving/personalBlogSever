import { configureStore } from '@reduxjs/toolkit';
import recipesReducer from './recipesSlice';
import deviceTypesReducer from './deviceTypesSlice';

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    deviceTypes: deviceTypesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 