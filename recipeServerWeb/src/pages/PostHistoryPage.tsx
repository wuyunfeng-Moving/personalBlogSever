import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostHistory, PostHistory } from '../services/postService';
import { getPostById, BlogPost } from '../services/postService';
import { Typography, Spin, Alert, Timeline, Collapse, Card, Row, Col, Tag, Button, Empty } from 'antd';
import { DiffOutlined, ClockCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const historyIconMap = {
    '+': <PlusOutlined style={{ color: '#52c41a' }} />,
    '~': <EditOutlined style={{ color: '#1890ff' }} />,
    '-': <DeleteOutlined style={{ color: '#ff4d4f' }} />,
};

const PostHistoryPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [history, setHistory] = useState<PostHistory[]>([]);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null]);

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const [historyData, postData] = await Promise.all([
                    getPostHistory(slug),
                    getPostById(slug)
                ]);
                setHistory(historyData);
                setPost(postData);

                if (historyData.length >= 2) {
                    setSelectedVersions([historyData[1].content, historyData[0].content]);
                } else if (historyData.length === 1) {
                    setSelectedVersions(['', historyData[0].content]);
                }

            } catch (err: any) {
                setError(err.response?.data?.detail || '无法加载文章历史记录');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    if (error) {
        return <Alert message="加载出错" description={error} type="error" showIcon />;
    }
    
    if (!post) {
        return <Empty description="未找到指定的文章" />;
    }

    const handleSelectForCompare = (versionContent: string, position: 'old' | 'new') => {
        if (position === 'old') {
            setSelectedVersions([versionContent, selectedVersions[1]]);
        } else {
            setSelectedVersions([selectedVersions[0], versionContent]);
        }
    };
    
    const oldContent = selectedVersions[0] ?? '';
    const newContent = selectedVersions[1] ?? '';

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>文章历史记录: "{post.title}"</Title>
            <Paragraph>
                <Text type="secondary">这里记录了文章的所有修改历史。您可以选择任意两个版本进行内容比较。</Text>
            </Paragraph>
            <Link to={`/posts/${slug}`}>
                <Button style={{ marginBottom: 24 }}>返回文章</Button>
            </Link>

            <Row gutter={24}>
                <Col xs={24} md={8}>
                    <Card title="版本列表" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <Timeline>
                            {history.map((record, index) => (
                                <Timeline.Item key={record.history_id} dot={historyIconMap[record.history_type]}>
                                    <Text strong>{record.history_type_display}</Text> by{' '}
                                    <Text code>{record.history_user?.username || '未知用户'}</Text>
                                    <br />
                                    <Text type="secondary">{new Date(record.history_date).toLocaleString()}</Text>
                                    <Collapse ghost>
                                        <Panel header="版本详情" key={record.history_id}>
                                            <Paragraph copyable={{ text: record.content }}>
                                                <strong>标题:</strong> {record.title} <br/>
                                                <strong>状态:</strong> {record.status}
                                            </Paragraph>
                                            <div>
                                                <Button size="small" onClick={() => handleSelectForCompare(record.content, 'old')}>作为旧版</Button>
                                                <Button size="small" style={{ marginLeft: 8 }} onClick={() => handleSelectForCompare(record.content, 'new')}>作为新版</Button>
                                            </div>
                                        </Panel>
                                    </Collapse>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card title={<><DiffOutlined /> 版本内容比较</>}>
                        {selectedVersions[0] === null || selectedVersions[1] === null ? (
                            <Empty description="请从左侧列表中选择两个版本进行比较" />
                        ) : (
                            <ReactDiffViewer
                                oldValue={oldContent}
                                newValue={newContent}
                                splitView={true}
                                compareMethod={DiffMethod.WORDS}
                                leftTitle="旧版本"
                                rightTitle="新版本"
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PostHistoryPage; 