import React from 'react';
import { Button, Card, Space, Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const ModalTest: React.FC = () => {
  const handleSimpleConfirm = () => {
    console.log('handleSimpleConfirm called');
    Modal.confirm({
      title: '简单确认',
      content: '这是一个简单的确认对话框',
      onOk() {
        console.log('用户点击了确认');
        message.success('确认成功！');
      },
      onCancel() {
        console.log('用户点击了取消');
        message.info('已取消');
      }
    });
  };

  const handleAsyncConfirm = () => {
    console.log('handleAsyncConfirm called');
    Modal.confirm({
      title: '异步确认',
      content: '这是一个异步确认对话框',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        console.log('异步操作开始');
        try {
          // 模拟异步操作
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.success('异步操作成功！');
          console.log('异步操作完成');
        } catch (error) {
          console.error('异步操作失败:', error);
          message.error('操作失败');
        }
      },
      onCancel() {
        console.log('用户取消了异步确认');
      }
    });
  };

  const handleDeleteTest = (id: string, name: string) => {
    console.log('handleDeleteTest called with:', { id, name });
    Modal.confirm({
      title: `确定要删除 "${name}" 吗？`,
      content: '此操作不可撤销',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 500,
      onOk: async () => {
        console.log('开始删除操作:', { id, name });
        try {
          const hideLoading = message.loading(`正在删除 "${name}"...`, 0);
          
          // 模拟API调用
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              // 模拟50%的成功率
              if (Math.random() > 0.5) {
                resolve('success');
              } else {
                reject(new Error('模拟删除失败'));
              }
            }, 2000);
          });
          
          hideLoading();
          message.success(`"${name}" 删除成功！`);
          console.log('删除成功');
          
        } catch (error: any) {
          console.error('删除失败:', error);
          message.error(error.message || '删除失败');
        }
      },
      onCancel() {
        console.log('用户取消删除');
      }
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card title="Modal.confirm 测试页面">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h3>基础功能测试</h3>
            <Space wrap>
              <Button onClick={handleSimpleConfirm}>
                简单确认对话框
              </Button>
              <Button onClick={handleAsyncConfirm}>
                异步确认对话框
              </Button>
            </Space>
          </div>

          <div>
            <h3>模拟删除功能测试</h3>
            <Space wrap>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTest('post-1', '测试文章1')}
              >
                删除测试文章1
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTest('post-2', '测试文章2')}
              >
                删除测试文章2
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTest('post-3', '北京游记')}
              >
                删除北京游记
              </Button>
            </Space>
          </div>

          <div>
            <h3>说明</h3>
            <ul>
              <li>请打开浏览器开发者工具查看控制台输出</li>
              <li>每个按钮都会触发不同类型的确认对话框</li>
              <li>删除测试有50%的成功率，用于测试错误处理</li>
              <li>观察Modal是否正常显示和响应</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ModalTest; 