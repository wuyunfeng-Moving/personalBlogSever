import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { Recipe, RecipeListResponse } from '../services/api';

interface RecipesState {
  items: Recipe[] | null;
  currentRecipe: Recipe | null;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: RecipesState = {
  items: null,
  currentRecipe: null,
  totalCount: 0,
  loading: false,
  error: null,
};

export const fetchRecipes = createAsyncThunk<RecipeListResponse, string | undefined>(
  'recipes/fetchRecipes',
  async (model) => {
    const params = model ? { model } : undefined;
    const response = await api.getRecipes(params);
    return response;
  }
);

export const fetchRecipeDetail = createAsyncThunk<Recipe, number>(
  'recipes/fetchRecipeDetail',
  async (id) => {
    const response = await api.getRecipeDetail(id);
    return response;
  }
);

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取菜谱列表失败';
      })
      .addCase(fetchRecipeDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
      })
      .addCase(fetchRecipeDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取菜谱详情失败';
      });
  },
});

export default recipesSlice.reducer; 