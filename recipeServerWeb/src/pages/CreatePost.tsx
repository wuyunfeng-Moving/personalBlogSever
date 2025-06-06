import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Select, Card, message, Space, Upload, Typography } from 'antd';
import { 
  SaveOutlined, 
  SendOutlined,
  RollbackOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { getCurrentUser, UserProfile } from '../services/authService';
import { createPost, updatePost, getPostById } from '../services/postService';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;

// 博客文章分类选项
const categoryOptions = [
  { value: 'tech', label: '技术' },
  { value: 'life', label: '生活' },
  { value: 'travel', label: '旅行' },
  { value: 'thoughts', label: '随笔' },
  { value: 'tutorials', label: '教程' },
];

// Post类型定义
interface Post {
  id: number;
  title: string;
  description: string;
  content: string;
  category: string;
  tags?: string[] | string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  author: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  image?: string;
}

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

    loadUser();
    
    if (id) {
      setIsEditing(true);
      // TODO: 实现获取文章数据的逻辑
    }
  }, [navigate, id]);

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
      formData.append('excerpt', values.description);
      formData.append('status', 'published'); // 直接发布
      
      // 处理分类 - 将分类名称转换为数字ID
      const categoryMap: { [key: string]: number } = {
        'tech': 1,
        'life': 2,
        'travel': 3,
        'thoughts': 4,
        'tutorials': 5
      };
      
      if (values.category && categoryMap[values.category]) {
        formData.append('category_ids', JSON.stringify([categoryMap[values.category]]));
      }
      
      // 处理标签
      if (values.tags && values.tags.length > 0) {
        formData.append('tag_names', JSON.stringify(values.tags));
      }
      
      // 处理图片
      if (values.image && values.image.length > 0) {
        const imageFile = values.image[0];
        if (imageFile.originFileObj) {
          formData.append('featured_image', imageFile.originFileObj);
        }
      }

      let result;
      if (isEditing && id) {
        result = await updatePost(id, formData);
        message.success('文章更新成功！');
      } else {
        result = await createPost(formData);
        message.success('文章发布成功！');
      }
      
      console.log('文章操作成功:', result);
      navigate('/?tab=my-posts');
    } catch (error: any) {
      console.error('保存文章失败:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          message.error(`操作失败: ${errorData}`);
        } else if (errorData.detail) {
          message.error(`操作失败: ${errorData.detail}`);
        } else if (errorData.error) {
          message.error(`操作失败: ${errorData.error}`);
        } else {
          // 显示字段级别的错误
          const errorMessages = [];
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${errors}`);
            }
          }
          message.error(`操作失败: ${errorMessages.join('; ')}`);
        }
      } else {
        message.error('网络错误，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const values = await form.validateFields(['title', 'content']); // 草稿只需要标题和内容
      
      // 准备草稿数据
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content || '');
      formData.append('excerpt', values.description || '');
      formData.append('status', 'draft'); // 保存为草稿
      
      // 处理分类
      const categoryMap: { [key: string]: number } = {
        'tech': 1,
        'life': 2,
        'travel': 3,
        'thoughts': 4,
        'tutorials': 5
      };
      
      if (values.category && categoryMap[values.category]) {
        formData.append('category_ids', JSON.stringify([categoryMap[values.category]]));
      }
      
      // 处理标签
      if (values.tags && values.tags.length > 0) {
        formData.append('tag_names', JSON.stringify(values.tags));
      }
      
      // 处理图片
      if (values.image && values.image.length > 0) {
        const imageFile = values.image[0];
        if (imageFile.originFileObj) {
          formData.append('featured_image', imageFile.originFileObj);
        }
      }

      let result;
      if (isEditing && id) {
        result = await updatePost(id, formData);
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
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card 
        title={isEditing ? "编辑文章" : "创建新文章"} 
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
            category: 'tech',
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
            name="description"
            label="文章摘要"
            rules={[{ required: true, message: '请输入文章摘要' }]}
          >
            <TextArea rows={3} placeholder="请输入文章摘要" />
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
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
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
