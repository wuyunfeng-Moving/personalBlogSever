// 博客API测试脚本
// 使用方法: node test_api.js

const BASE_URL = 'http://localhost:8000/api/v1';

// 测试获取文章列表
async function testGetPosts() {
  console.log('🔍 测试获取文章列表...');
  try {
    const response = await fetch(`${BASE_URL}/posts/`);
    const data = await response.json();
    console.log('✅ 文章列表获取成功:', {
      状态码: response.status,
      文章数量: data.count,
      返回条数: data.results?.length || 0
    });
  } catch (error) {
    console.log('❌ 文章列表获取失败:', error.message);
  }
}

// 测试获取分类列表
async function testGetCategories() {
  console.log('🔍 测试获取分类列表...');
  try {
    const response = await fetch(`${BASE_URL}/categories/`);
    const data = await response.json();
    console.log('✅ 分类列表获取成功:', {
      状态码: response.status,
      分类数量: data.results?.length || 0
    });
  } catch (error) {
    console.log('❌ 分类列表获取失败:', error.message);
  }
}

// 测试获取标签列表
async function testGetTags() {
  console.log('🔍 测试获取标签列表...');
  try {
    const response = await fetch(`${BASE_URL}/tags/`);
    const data = await response.json();
    console.log('✅ 标签列表获取成功:', {
      状态码: response.status,
      标签数量: data.results?.length || 0
    });
  } catch (error) {
    console.log('❌ 标签列表获取失败:', error.message);
  }
}

// 测试获取置顶文章
async function testGetFeaturedPosts() {
  console.log('🔍 测试获取置顶文章...');
  try {
    const response = await fetch(`${BASE_URL}/posts/featured/`);
    const data = await response.json();
    console.log('✅ 置顶文章获取成功:', {
      状态码: response.status,
      置顶文章数量: data.results?.length || 0
    });
  } catch (error) {
    console.log('❌ 置顶文章获取失败:', error.message);
  }
}

// 测试获取热门文章
async function testGetPopularPosts() {
  console.log('🔍 测试获取热门文章...');
  try {
    const response = await fetch(`${BASE_URL}/posts/popular/`);
    const data = await response.json();
    console.log('✅ 热门文章获取成功:', {
      状态码: response.status,
      热门文章数量: data.results?.length || 0
    });
  } catch (error) {
    console.log('❌ 热门文章获取失败:', error.message);
  }
}

// 测试搜索功能
async function testSearch() {
  console.log('🔍 测试搜索功能...');
  try {
    const response = await fetch(`${BASE_URL}/search/?q=Python`);
    const data = await response.json();
    console.log('✅ 搜索功能正常:', {
      状态码: response.status,
      搜索关键词: data.query,
      搜索结果数: data.count || 0
    });
  } catch (error) {
    console.log('❌ 搜索功能失败:', error.message);
  }
}

// 测试获取归档信息
async function testGetArchive() {
  console.log('🔍 测试获取归档信息...');
  try {
    const response = await fetch(`${BASE_URL}/archive/`);
    const data = await response.json();
    console.log('✅ 归档信息获取成功:', {
      状态码: response.status,
      归档年份数: data.results?.length || 0
    });
  } catch (error) {
    console.log('❌ 归档信息获取失败:', error.message);
  }
}

// 测试获取统计信息
async function testGetStats() {
  console.log('🔍 测试获取统计信息...');
  try {
    const response = await fetch(`${BASE_URL}/stats/`);
    const data = await response.json();
    console.log('✅ 统计信息获取成功:', {
      状态码: response.status,
      总文章数: data.total_posts,
      总分类数: data.total_categories,
      总标签数: data.total_tags,
      总评论数: data.total_comments
    });
  } catch (error) {
    console.log('❌ 统计信息获取失败:', error.message);
  }
}

// 测试获取文章详情
async function testGetPostDetail() {
  console.log('🔍 测试获取文章详情...');
  
  // 首先获取文章列表，取第一篇文章的slug
  try {
    const listResponse = await fetch(`${BASE_URL}/posts/`);
    const listData = await listResponse.json();
    
    if (listData.results && listData.results.length > 0) {
      const firstPost = listData.results[0];
      const slug = firstPost.slug;
      
      const detailResponse = await fetch(`${BASE_URL}/posts/${slug}/`);
      const detailData = await detailResponse.json();
      
      console.log('✅ 文章详情获取成功:', {
        状态码: detailResponse.status,
        文章标题: detailData.title,
        文章slug: detailData.slug,
        浏览量: detailData.view_count,
        是否置顶: detailData.is_featured
      });
    } else {
      console.log('⚠️ 没有文章可供测试详情获取');
    }
  } catch (error) {
    console.log('❌ 文章详情获取失败:', error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始API接口测试...\n');
  
  await testGetPosts();
  console.log('');
  
  await testGetCategories();
  console.log('');
  
  await testGetTags();
  console.log('');
  
  await testGetFeaturedPosts();
  console.log('');
  
  await testGetPopularPosts();
  console.log('');
  
  await testSearch();
  console.log('');
  
  await testGetArchive();
  console.log('');
  
  await testGetStats();
  console.log('');
  
  await testGetPostDetail();
  console.log('');
  
  console.log('🎉 API接口测试完成！');
}

// 如果是直接运行此脚本
if (typeof window === 'undefined') {
  // Node.js环境
  const fetch = require('node-fetch');
  runAllTests();
} else {
  // 浏览器环境
  console.log('请在浏览器控制台中运行 runAllTests() 函数');
}

// 导出函数供浏览器使用
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.testGetPosts = testGetPosts;
  window.testGetCategories = testGetCategories;
  window.testGetTags = testGetTags;
  window.testGetFeaturedPosts = testGetFeaturedPosts;
  window.testGetPopularPosts = testGetPopularPosts;
  window.testSearch = testSearch;
  window.testGetArchive = testGetArchive;
  window.testGetStats = testGetStats;
  window.testGetPostDetail = testGetPostDetail;
} 