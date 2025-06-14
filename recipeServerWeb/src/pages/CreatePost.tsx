import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Select, Card, message, Space, Upload, Typography, Modal, Spin } from 'antd';
import { 
  SaveOutlined, 
  SendOutlined,
  RollbackOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { getCurrentUser, UserProfile } from '../services/authService';
import { createPost, updatePost, getPostById, getCategories } from '../services/postService';
import type { UploadFile } from 'antd/es/upload/interface';
import { Category, BlogPost } from '../services/api';
import LocationSelector from '../components/LocationSelector';

const { TextArea } = Input;
const { Option } = Select;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userProfile = await getCurrentUser();
        setUser(userProfile);
        
        if (!userProfile) {
          message.error('请先登录');
          navigate('/login');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败，请重新登录');
        navigate('/login');
      }
    };

    const loadCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.results || []);
      } catch (error) {
        console.error('获取分类失败:', error);
        message.error('获取分类失败');
      }
    };

    loadUser();
    loadCategories();
    
    // 如果有id或slug，则为编辑模式
    const postIdentifier = slug || id;
    if (postIdentifier) {
      setIsEditing(true);
      loadPostData(postIdentifier);
    }
  }, [navigate, id, slug]);

  const loadPostData = async (identifier: string) => {
    setLoadingPost(true);
    try {
      console.log('加载文章数据:', identifier);
      const postData = await getPostById(identifier);
      console.log('获取到的文章数据:', postData);
      
      setPost(postData);
      
      // 填充表单数据
      const formData: any = {
        title: postData.title,
        content: postData.content,
        category: postData.categories && postData.categories.length > 0 ? postData.categories[0].slug : undefined,
        tags: postData.tags ? postData.tags.map((tag: any) => tag.name) : [],
      };

      // 添加地理位置信息
      if (postData.latitude && postData.longitude) {
        formData.location = {
          lat: postData.latitude,
          lng: postData.longitude,
          name: postData.location_name || ''
        };
      }

      console.log('设置表单数据:', formData);
      form.setFieldsValue(formData);
      
    } catch (error: any) {
      console.error('加载文章数据失败:', error);
      message.error('加载文章数据失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingPost(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      // 准备提交的数据
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      formData.append('status', 'published'); // 直接发布
      
      // 处理分类 - 逐个附加
      if (values.category) {
        const selectedCategory = categories.find(cat => cat.slug === values.category);
        if (selectedCategory) {
          formData.append('category_ids', selectedCategory.id.toString());
        }
      }
      
      // 处理标签 - 逐个附加
      if (values.tags && values.tags.length > 0) {
        values.tags.forEach((tag: string) => {
          formData.append('tag_names', tag);
        });
      }
      
      // 处理地理位置
      if (values.location) {
        formData.append('latitude', values.location.lat);
        formData.append('longitude', values.location.lng);
        formData.append('location_name', values.location.name);
      }
      
      // 处理图片
      if (values.image && values.image.length > 0) {
        const imageFile = values.image[0];
        if (imageFile.originFileObj) {
          formData.append('featured_image', imageFile.originFileObj);
        }
      }

      let result;
      if (isEditing && (slug || id)) {
        const identifier = slug || id;
        result = await updatePost(identifier!, formData);
        message.success('文章更新成功！');
      } else {
        result = await createPost(formData);
        message.success('文章发布成功！');
      }
      
      console.log('文章操作成功:', result);
      navigate('/?tab=my-posts');
    } catch (error: any) {
      console.error('保存文章失败:', error);
      console.error('错误详情:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });
      
      // 显示详细的错误信息
      let errorMessage = '操作失败';
      
      if (error.response) {
        const errorData = error.response.data;
        const status = error.response.status;
        
        console.log('服务器响应数据:', errorData);
        
        if (status === 400) {
          // 验证错误
          if (typeof errorData === 'string') {
            errorMessage = `验证失败: ${errorData}`;
          } else if (errorData.detail) {
            errorMessage = `验证失败: ${errorData.detail}`;
          } else if (errorData.error) {
            errorMessage = `验证失败: ${errorData.error}`;
          } else if (errorData.details) {
            // 处理详细的字段错误信息
            const fieldErrors = [];
            for (const [field, errors] of Object.entries(errorData.details)) {
              if (Array.isArray(errors)) {
                fieldErrors.push(`${field}: ${errors.join(', ')}`);
              } else {
                fieldErrors.push(`${field}: ${errors}`);
              }
            }
            errorMessage = `验证失败: ${fieldErrors.join('; ')}`;
          } else {
            // 显示所有字段级别的错误
            const fieldErrors = [];
            for (const [field, errors] of Object.entries(errorData)) {
              if (Array.isArray(errors)) {
                fieldErrors.push(`${field}: ${errors.join(', ')}`);
              } else if (typeof errors === 'string') {
                fieldErrors.push(`${field}: ${errors}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage = `验证失败: ${fieldErrors.join('; ')}`;
            } else {
              errorMessage = `验证失败: ${JSON.stringify(errorData)}`;
            }
          }
        } else if (status === 401) {
          errorMessage = '认证失败，请重新登录';
        } else if (status === 403) {
          errorMessage = '权限不足，无法执行此操作';
        } else if (status === 500) {
          errorMessage = '服务器内部错误，请联系管理员';
        } else {
          errorMessage = `服务器错误 (${status}): ${errorData?.detail || errorData?.error || JSON.stringify(errorData)}`;
        }
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查网络或服务器状态';
      } else {
        errorMessage = `请求失败: ${error.message}`;
      }
      
             // 使用 Modal 显示详细错误信息
      Modal.error({
        title: '操作失败',
        content: (
          <div>
            <p><strong>错误信息:</strong> {errorMessage}</p>
            {error.response && (
              <div>
                <p><strong>HTTP状态码:</strong> {error.response.status}</p>
                <p><strong>服务器响应:</strong></p>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(error.response.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ),
        width: 600,
        maskClosable: true
      });
      
      // 同时显示简单的message提示
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      // 验证并获取所有相关字段的值，而不仅仅是title和content
      const values = await form.getFieldsValue(['title', 'content', 'category', 'tags', 'location', 'image']);
      
      // 至少需要一个标题才能保存草稿
      if (!values.title) {
        message.warning('请输入文章标题以保存草稿。');
        form.validateFields(['title']); // 触发标题字段的验证提示
        return;
      }

      setLoading(true);

      // 准备草稿数据
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      formData.append('status', 'draft'); // 保存为草稿
      
      // 处理分类
      if (values.category) {
        const selectedCategory = categories.find(cat => cat.slug === values.category);
        if (selectedCategory) {
          formData.append('category_ids', selectedCategory.id.toString());
        }
      }
      
      // 处理标签
      if (values.tags && values.tags.length > 0) {
        values.tags.forEach((tag: string) => {
          formData.append('tag_names', tag);
        });
      }
      
      // 处理地理位置
      if (values.location) {
        formData.append('latitude', values.location.lat);
        formData.append('longitude', values.location.lng);
        formData.append('location_name', values.location.name);
      }
      
      // 处理图片
      if (values.image && values.image.length > 0) {
        const imageFile = values.image[0];
        if (imageFile.originFileObj) {
          formData.append('featured_image', imageFile.originFileObj);
        }
      }

      let result;
      if (isEditing && (slug || id)) {
        const identifier = slug || id;
        result = await updatePost(identifier!, formData);
      } else {
        result = await createPost(formData);
      }
      
      console.log('草稿保存成功:', result);
      message.success('草稿已保存！');
    } catch (error: any) {
      console.error('保存草稿失败:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          message.error(`保存失败: ${errorData}`);
        } else if (errorData.detail) {
          message.error(`保存失败: ${errorData.detail}`);
        } else {
          message.error('保存失败，请检查输入数据');
        }
      } else {
        message.error('网络错误，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载文章数据中..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card 
        title={isEditing ? `编辑文章${post ? ` - ${post.title}` : ''}` : "创建新文章"} 
        bordered={false}
        extra={
          <Space>
            <Button 
              icon={<RollbackOutlined />} 
              onClick={() => navigate('/?tab=my-posts')}
            >
              返回
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            category: categories.length > 0 ? categories[0].slug : undefined,
            tags: []
          }}
        >
          <Form.Item
            name="title"
            label="文章标题"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="文章内容"
            rules={[{ required: true, message: '请输入文章内容' }]}
          >
            <TextArea rows={12} placeholder="请输入文章内容" />
          </Form.Item>

          <Form.Item
            name="category"
            label="文章分类"
            rules={[{ required: true, message: '请选择文章分类' }]}
          >
            <Select placeholder="请选择文章分类">
              {categories.map(category => (
                <Option key={category.slug} value={category.slug}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select mode="tags" style={{ width: '100%' }} placeholder="输入标签，按Enter确认">
              <Option value="前端">前端</Option>
              <Option value="后端">后端</Option>
              <Option value="JavaScript">JavaScript</Option>
              <Option value="React">React</Option>
              <Option value="Python">Python</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="地理位置"
          >
            <LocationSelector placeholder="点击添加文章地理位置" />
          </Form.Item>

          <Form.Item
            name="image"
            label="封面图片"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              name="file"
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传封面</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space size="large">
              <Button 
                icon={<SaveOutlined />} 
                onClick={saveDraft}
              >
                保存草稿
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SendOutlined />}
              >
                发布文章
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreatePost; 
