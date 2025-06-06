import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { BlogPost, PaginatedResponse } from '../services/api';

interface PostsState {
  items: BlogPost[] | null;
  currentPost: BlogPost | null;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  items: null,
  currentPost: null,
  totalCount: 0,
  loading: false,
  error: null,
};

export const fetchPosts = createAsyncThunk<PaginatedResponse<BlogPost>, string | undefined>(
  'posts/fetchPosts',
  async (category) => {
    const params = category ? { category } : undefined;
    const response = await api.getPosts(params);
    return response;
  }
);

export const fetchPostDetail = createAsyncThunk<BlogPost, string>(
  'posts/fetchPostDetail',
  async (slug) => {
    const response = await api.getPost(slug);
    return response;
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取文章列表失败';
      })
      .addCase(fetchPostDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取文章详情失败';
      });
  },
});

export default postsSlice.reducer; 