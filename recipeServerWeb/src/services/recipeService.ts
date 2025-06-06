import api, { RecipeListResponse, RecipeFormData, CommandStep, CloudCommandData } from './api';

// 重新导出类型以保持兼容性
export type { RecipeFormData, CommandStep, CloudCommandData };

// 获取菜谱列表
export const getRecipes = async (params?: { model?: string; author?: string }) => {
  return api.getRecipes(params);
};

// 获取我的菜谱
export const getMyRecipes = async () => {
  return api.getMyRecipes();
};

// 获取菜谱详情
export const getRecipeById = async (id: string) => {
  return api.getRecipeDetail(id);
};

// 创建菜谱
export const createRecipe = async (data: RecipeFormData | FormData) => {
  return api.createRecipe(data);
};

// 更新菜谱
export const updateRecipe = async (id: string, data: RecipeFormData | FormData) => {
  console.log('updateRecipe data', data);
  return api.updateRecipe(id, data);
};

// 删除菜谱
export const deleteRecipe = async (id: string) => {
  return api.deleteRecipe(id);
};

// 提交菜谱审核
export const submitRecipeForReview = async (id: string) => {
  return api.submitRecipeForReview(id);
};

// 撤销菜谱审核
export const cancelRecipeReview = async (id: string) => {
  return api.cancelRecipeReview(id);
};

// 获取菜谱命令
export const getRecipeCommands = async (recipeId: number | string, modelIdentifier: string) => {
  return api.getRecipeCommands(recipeId, modelIdentifier);
}; 