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
      // TODO: 实现提交文章的逻辑
      console.log('提交的文章数据:', values);
      message.success('文章已保存！');
      navigate('/');
    } catch (error: any) {
      console.error('保存文章失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const values = await form.validateFields();
      // TODO: 实现保存草稿的逻辑
      console.log('保存草稿:', values);
      message.success('草稿已保存！');
    } catch (info) {
      console.log('表单验证失败:', info);
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
