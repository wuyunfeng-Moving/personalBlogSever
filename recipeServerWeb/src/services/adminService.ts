import api, { Recipe, RecipeListResponse } from './api';

// 重新导出类型以保持兼容性
export type { Recipe, RecipeListResponse };

/**
 * 获取待审核菜谱列表
 * 需要管理员权限
 */
export const getPendingRecipes = async (): Promise<RecipeListResponse> => {
  return await api.getPendingRecipes();
};

/**
 * 审核菜谱
 * @param id 菜谱ID
 * @param action 审核操作 'approve' | 'reject'
 * 需要管理员权限
 */
export const reviewRecipe = async (id: number, action: 'approve' | 'reject'): Promise<{ status: string }> => {
  return await api.reviewRecipe(id, action);
}; 