import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Select, InputNumber, Card, message, Space, Divider, Upload, Tabs, Row, Col, Popconfirm, Tag, Tooltip, Alert, Table, Typography, Modal } from 'antd';
import { 
  MinusCircleOutlined, 
  PlusOutlined, 
  UploadOutlined, 
  SaveOutlined, 
  SendOutlined,
  RollbackOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EditOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchDeviceModels } from '../store/deviceTypesSlice';
import { getCurrentUser, UserProfile } from '../services/authService';
import { 
  createRecipe, 
  updateRecipe, 
  getRecipeById, 
  submitRecipeForReview, 
  cancelRecipeReview,
  deleteRecipe,
  RecipeFormData
} from '../services/recipeService';
import type { UploadFile } from 'antd/es/upload/interface';
import CommandList from '../components/CommandList';
import CloudCommandSummary  from '../components/CloudCommandSummary';
import { CloudCommandData } from '../services/recipeService';
import CloudCommandGuide from '../components/CloudCommandGuide';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const difficultyOptions = [
  { value: '1', label: '简单' },  // API要求: 1-简单
  { value: '2', label: '适中' },  // API要求: 2-适中
  { value: '3', label: '困难' },  // API要求: 3-困难
];

const suitablePersonOptions = [
  { value: 1, label: '老人' },   // API要求: 1-老人
  { value: 2, label: '成人' },   // API要求: 2-成人
  { value: 3, label: '儿童' },   // API要求: 3-儿童
  { value: 4, label: '婴幼儿' }, // API要求: 4-婴幼儿
];

// Recipe类型定义
interface Recipe {
  id: number;
  title: string;
  description: string;
  steps: Array<string | {
    stepNo: number;
    stepDescription: string;
    imageUrl?: string;
  }>;
  ingredients: string[];
  staple_food: string[];
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  tags?: string[] | string;
  suitable_person?: number;
  work_modes?: string[] | string;
  temperature_value?: number;
  temperature_unit?: string;
  comal_position?: string;
  cloud_commands?:{
    'model': string,
    'commands': [
        {
            'step': number,
            'action': string,
            'details': string
        },

    ]
};
  status: 'draft' | 'pending' | 'published' | 'rejected';
  author: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  image?: string;
}

const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [selectedDeviceModels, setSelectedDeviceModels] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for Cloud Command Guide
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [editingCommandSet, setEditingCommandSet] = useState<any>(null);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  
  // Modal state for device type editing
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [editingDeviceIndex, setEditingDeviceIndex] = useState<number | null>(null);
  const [tempDeviceModel, setTempDeviceModel] = useState<string>('');
  
  const deviceTypes = useSelector((state: RootState) => state.deviceTypes);

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
        // 处理异常情况，可能是网络错误、认证失败等
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败，请重新登录');
        navigate('/login');
      }
    };

    loadUser();
    dispatch(fetchDeviceModels());
    
    // 如果有 ID，则获取现有菜谱数据进行编辑
    if (id) {
      setIsEditing(true);
      fetchRecipe(id);
    }
  }, [dispatch, navigate, id]);
  
  const fetchRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      const data = await getRecipeById(recipeId) as Recipe;
      setRecipe(data);
      
      // 添加日志，检查数据中是否有 cloud_commands 字段
      console.log('获取的菜谱数据:', data);
      console.log('cloud_commands 存在:', !!data.cloud_commands);
      console.log('cloud_commands 内容:', data.cloud_commands);
      
      // Format cloud_commands from object to array if needed
      if (data.cloud_commands && !Array.isArray(data.cloud_commands)) {
        // Cast to any to avoid TypeScript errors when changing shape
        (data as any).cloud_commands = [data.cloud_commands];
      }
      
      // 格式化步骤和食材数据以适应表单
      const formattedSteps = Array.isArray(data.steps) 
        ? data.steps.map((step: any) => {
            // 如果步骤是对象格式（新API）
            if (typeof step === 'object' && step.stepDescription) {
              return { 
                content: step.stepDescription,
                image: step.imageUrl ? [{
                  uid: `-${step.stepNo}`,
                  name: `step-${step.stepNo}-image.jpg`,
                  status: 'done',
                  url: step.imageUrl
                }] : undefined
              };
            } 
            // 如果步骤是字符串格式（旧API）
            else if (typeof step === 'string') {
              return { content: step };
            }
            // 默认返回空对象
            return { content: '' };
          })
        : [{ content: '' }];
        
      const formattedIngredients = Array.isArray(data.ingredients)
        ? data.ingredients.map((item: string) => {
            // 匹配名称和数量+单位部分
            const match = item.match(/^(.+?):(.+)$/);
            if (match && match.length >= 3) {
              const name = match[1];
              const amountWithUnit = match[2];
              
              // 尝试分离数字和单位
              const amountMatch = amountWithUnit.match(/^(\d+\.?\d*)(.*)$/);
              if (amountMatch && amountMatch.length >= 3) {
                return { 
                  name, 
                  amount: amountMatch[1], 
                  unit: amountMatch[2] || '克'
                };
              }
              
              // 如果没有明确的单位格式，假设最后的单位是"适量"或默认为"克"
              return { 
                name, 
                amount: amountWithUnit.trim() === '适量' ? '' : amountWithUnit,
                unit: amountWithUnit.trim() === '适量' ? '适量' : '克'
              };
            }
            return { name: item, amount: '', unit: '克' };
          })
        : [{ name: '', amount: '', unit: '克' }];
        
      const formattedStapleFood = Array.isArray(data.staple_food)
        ? data.staple_food.map((item: string) => {
            // 匹配名称和数量+单位部分
            const match = item.match(/^(.+?):(.+)$/);
            if (match && match.length >= 3) {
              const name = match[1];
              const amountWithUnit = match[2];
              
              // 尝试分离数字和单位
              const amountMatch = amountWithUnit.match(/^(\d+\.?\d*)(.*)$/);
              if (amountMatch && amountMatch.length >= 3) {
                return { 
                  name, 
                  amount: amountMatch[1], 
                  unit: amountMatch[2] || '克'
                };
              }
              
              // 如果没有明确的单位格式，假设最后的单位是"适量"或默认为"克"
              return { 
                name, 
                amount: amountWithUnit.trim() === '适量' ? '' : amountWithUnit,
                unit: amountWithUnit.trim() === '适量' ? '适量' : '克'
              };
            }
            return { name: item, amount: '', unit: '克' };
          })
        : [{ name: '', amount: '', unit: '克' }];
      
      // 处理封面图片
      let coverImageFileList = undefined;
      if (data.image) {
        coverImageFileList = [
          {
            uid: '-1',
            name: 'cover-image.jpg',
            status: 'done',
            url: data.image,
          },
        ];
      }
      
      // 处理标签和工作模式 - 如果是字符串，转为数组
      let tags = data.tags;
      if (typeof tags === 'string') {
        tags = tags.split(',').map(tag => tag.trim());
      }
      
      let workModes = data.work_modes;
      if (typeof workModes === 'string') {
        workModes = workModes.split(',').map(mode => mode.trim());
      }
      
      // 保存设备型号信息（用于下拉框选择）
      let selectedModels: string[] = [];
      let cloudCommands = undefined;
      
      // Properly handle cloud_commands whether it's an object or array
      if (data.cloud_commands) {
        // Handle direct object format
        if (typeof data.cloud_commands === 'object' && !Array.isArray(data.cloud_commands)) {
          cloudCommands = [data.cloud_commands];
          if (data.cloud_commands.model) {
            selectedModels = [data.cloud_commands.model];
          }
        } 
        // Handle array format
        else if (Array.isArray(data.cloud_commands)) {
          cloudCommands = data.cloud_commands;
          selectedModels = data.cloud_commands.map(cmd => cmd.model).filter(Boolean);
        }
        
        console.log('Initialized cloud commands:', cloudCommands);
      }
      
      // 设置表单数据
      const formData = {
        ...data,
        steps: formattedSteps,
        ingredients: formattedIngredients,
        staple_food: formattedStapleFood,
        selectedDeviceModels: selectedModels,
        cover_image: coverImageFileList,
        tags,
        work_modes: workModes,
        cloud_commands: cloudCommands
      };
      
      form.setFieldsValue(formData);
      setSelectedDeviceModels(selectedModels);
      
    } catch (error: any) {
      message.error('获取菜谱数据失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceModelChange = (value: string[]) => {
    setSelectedDeviceModels(value);
    
    // 获取当前的表单值
    const currentValues = form.getFieldValue('cloud_commands') || {
      model: value[0] || '',
      commands: []
    };
    
    // 更新 model 字段为第一个选择的设备
    if (value.length > 0 && (!currentValues.model || !value.includes(currentValues.model))) {
      form.setFieldsValue({
        cloud_commands: {
          ...currentValues,
          model: value[0]
        }
      });
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  
  const formatFormDataForApi = (values: any): RecipeFormData | FormData => {
    console.log('formatFormDataForApi input values:', values);
    console.log('cloud_commands before formatting:', values.cloud_commands);
    
    // 确保云命令格式符合API要求 - 正确的格式是:
    // cloud_commands?: Array<{
    //   model: string;
    //   hex_command: string; // Mandatory (can be empty string "")
    //   steps?: Array<{ 
    //     stepNo: number;
    //     stepDescription: string;
    //   }>;
    // }>;
    let formattedCloudCommands = undefined;
    if (values.cloud_commands) {
      if (Array.isArray(values.cloud_commands)) {
        // 如果是数组，选择第一个命令集(API只支持一个设备的命令)
        if (values.cloud_commands.length > 0) {
          const primaryCommand = values.cloud_commands[0];
          // 转换为API需要的格式
          formattedCloudCommands = [{
            model: primaryCommand.model,
            hex_command: "111", // 必需字段，可以为空字符串
            steps: Array.isArray(primaryCommand.steps) 
              ? primaryCommand.steps.map((cmd: any) => ({
                  stepNo: cmd.stepNo,
                  stepDescription: cmd.stepDescription
                })) 
              : []
          }];
          console.log('从数组中提取并格式化云命令:', formattedCloudCommands);
        }
      } else if (typeof values.cloud_commands === 'object') {
        // 如果已经是单个对象，确保格式正确
        if (values.cloud_commands.model) {
          formattedCloudCommands = [{
            model: values.cloud_commands.model,
            hex_command: "", // 必需字段，可以为空字符串
            steps: Array.isArray(values.cloud_commands.commands) 
              ? values.cloud_commands.commands.map((cmd: any) => ({
                  stepNo: cmd.step,
                  stepDescription: `${cmd.action}: ${cmd.details}`
                })) 
              : []
          }];
          console.log('格式化单个对象云命令:', formattedCloudCommands);
        }
      }
    }
    
    // 将处理后的云命令赋值回values
    values.cloud_commands = formattedCloudCommands;

    // 根据API文档格式化步骤 - 使用stepNo和stepDescription字段
    const formattedSteps = values.steps.map((step: any, index: number) => ({
      stepNo: index + 1,
      stepDescription: step.content,
      imageUrl: "" // 先设置为空，图片将通过单独的字段上传
    }));
    
    // 格式化食材为 "名称:数量单位" 格式的字符串数组
    const formattedIngredients = values.ingredients.map((item: any) => 
      `${item.name}:${item.amount}${item.unit || '克'}`
    );
    
    const formattedStapleFood = values.staple_food.map((item: any) => 
      `${item.name}:${item.amount}${item.unit || '克'}`
    );
    
    // 检查是否有图片需要上传 (封面图或步骤图片)
    const hasCoverImage = values.cover_image && values.cover_image.length > 0;
    
    // 如果有图片上传，使用FormData格式
    if (hasCoverImage) {
      const formData = new FormData();
      
      // 基本信息
      formData.append('title', values.title);
      formData.append('description', values.description);
      
      // 添加步骤信息 - 使用API要求的格式
      formData.append('steps', JSON.stringify(formattedSteps));
      
      // 食材和主食列表
      formData.append('ingredients', JSON.stringify(formattedIngredients));
      formData.append('staple_food', JSON.stringify(formattedStapleFood));
      
      // 添加必填字段
      formData.append('difficulty', values.difficulty); // 数字: 1-简单, 2-适中, 3-困难
      formData.append('prep_time_minutes', String(values.prep_time_minutes));
      formData.append('cook_time_minutes', String(values.cook_time_minutes));
      formData.append('servings', String(values.servings));
      
      // 添加可选字段
      if (values.tags && values.tags.length > 0) {
        // API要求逗号分隔的字符串
        formData.append('tags', Array.isArray(values.tags) ? values.tags.join(',') : values.tags);
      }
      
      if (values.suitable_person) {
        // 人群: 1-老人, 2-成人, 3-儿童, 4-婴幼儿
        formData.append('suitable_person', String(values.suitable_person));
      }
      
      if (values.work_modes && values.work_modes.length > 0) {
        // API要求逗号分隔的字符串
        formData.append('work_modes', Array.isArray(values.work_modes) ? values.work_modes.join(',') : values.work_modes);
      }
      
      if (values.temperature_value) {
        formData.append('temperature_value', String(values.temperature_value));
      }
      
      if (values.temperature_unit) {
        formData.append('temperature_unit', values.temperature_unit);
      }
      
      if (values.comal_position) {
        formData.append('comal_position', String(values.comal_position));
      }
      
      // 设备类型
      if (values.device_types && values.device_types.length > 0) {
        formData.append('device_types', JSON.stringify(values.device_types));
      }
      
      // 添加封面图片 - API使用'image'字段名而不是'cover_image'
      const coverFile = values.cover_image[0].originFileObj;
      if (coverFile) {
        formData.append('image', coverFile);
      }
      
      // 添加步骤图片 - 使用API推荐的方式二：为每个步骤提供单独的命名图片字段
      values.steps.forEach((step: any, index: number) => {
        if (step.image && step.image.length > 0 && step.image[0].originFileObj) {
          formData.append(`step_${index + 1}_image`, step.image[0].originFileObj);
        }
      });
      
      // 设备类型和云菜谱命令
      if (values.cloud_commands) {
        try {
          // 确保格式正确
          const cloudCommands = values.cloud_commands;
          // 验证是否为数组且包含必要的字段
          if (Array.isArray(cloudCommands) && cloudCommands.length > 0) {
            const commandsJson = JSON.stringify(cloudCommands);
            formData.append('cloud_commands', commandsJson);
            console.log('添加到FormData的云命令:', commandsJson);
            
            // For debugging, also log entries in FormData
            console.log('FormData entries:');
            for (let pair of formData.entries()) {
              console.log(pair[0], pair[1]);
            }
          } else {
            console.log('云命令格式不正确，不添加到FormData:', cloudCommands);
          }
        } catch (error) {
          console.error('Failed to stringify cloud_commands:', error);
        }
      } else {
        console.log('No cloud_commands to add to FormData');
      }
      
      return formData;
    } else {
      // 没有图片，使用普通JSON格式
      const apiData: RecipeFormData = {
        title: values.title,
        description: values.description,
        steps: formattedSteps, // 使用新的步骤格式
        ingredients: formattedIngredients,
        staple_food: formattedStapleFood,
        difficulty: values.difficulty,
        prep_time_minutes: values.prep_time_minutes,
        cook_time_minutes: values.cook_time_minutes,
        servings: values.servings,
        //device_types: values.device_types,
      };
      
      // 添加可选字段
      if (values.tags && values.tags.length > 0) {
        apiData.tags = Array.isArray(values.tags) ? values.tags.join(',') : values.tags;
      }
      
      if (values.suitable_person) {
        apiData.suitable_person = values.suitable_person;
      }
      
      if (values.work_modes && values.work_modes.length > 0) {
        apiData.work_modes = Array.isArray(values.work_modes) ? values.work_modes.join(',') : values.work_modes;
      }
      
      if (values.temperature_value) {
        apiData.temperature_value = values.temperature_value;
      }
      
      if (values.temperature_unit) {
        apiData.temperature_unit = values.temperature_unit;
      }
      
      if (values.comal_position) {
        apiData.comal_position = values.comal_position;
      }
      
      // 添加云菜谱命令
      if (values.cloud_commands) {
        // 验证是否为数组且包含必要的字段
        const cloudCommands = values.cloud_commands;
        if (Array.isArray(cloudCommands) && cloudCommands.length > 0) {
          console.log('Adding valid cloud_commands to apiData:', cloudCommands);
          apiData.cloud_commands = cloudCommands;
        } else {
          console.log('云命令格式不正确，不添加到apiData:', cloudCommands);
        }
      } else {
        console.log('No cloud_commands to add to apiData');
      }
      
      console.log('Final apiData:', apiData);
      return apiData;
    }
  };
  
  const submitRecipe = async (values: any, status: 'draft' | 'pending') => {
    if (!user) {
      message.error('请先登录');
      navigate('/login');
      return;
    }

    // 准备API数据格式
    console.log('原始表单值:', values);
    console.log('云命令(提交前):', values.cloud_commands);
    const formData = formatFormDataForApi(values);
    console.log('云命令(格式化后):', formData instanceof FormData ? '在FormData中' : formData.cloud_commands);
    
    // 如果是FormData对象，需要手动设置status
    if (formData instanceof FormData) {
      formData.set('status', status);
    } else {
      // 否则是普通的RecipeFormData对象
      formData.status = status;
    }
    
    setLoading(true);
    try {
      let response;

      console.log('formData', formData);
      
      // 根据是否是编辑模式选择调用不同的API
      if (isEditing && id) {
        response = await updateRecipe(id, formData) as { status?: 'draft' | 'pending' | 'published' | 'rejected' };
        console.log('更新菜谱响应:', response);
        message.success(status === 'draft' ? '菜谱已更新！' : '菜谱已提交审核！');
      } else {
        response = await createRecipe(formData) as { status?: 'draft' | 'pending' | 'published' | 'rejected' };
        console.log('创建菜谱响应:', response);
        message.success(status === 'draft' ? '菜谱已保存为草稿！' : '菜谱已提交审核！');
      }
      
      // 如果状态已更改，更新本地recipe对象
      if (recipe && response?.status) {
        setRecipe({...recipe, status: response.status});
      }
      
      if (status === 'pending') {
        navigate('/');
      }
    } catch (error: any) {
      console.error('保存菜谱失败:', error);
      message.error(error.response?.data?.error || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values: any) => {
    submitRecipe(values, 'pending');
  };
  
  const saveDraft = () => {
    form.validateFields()
      .then(values => {
        submitRecipe(values, 'draft');
      })
      .catch(info => {
        message.error('表单验证失败，请检查必填项');
      });
  };
  
  const handleSubmitForReview = async () => {
    if (!id) return;
    
    setSubmitLoading(true);
    try {
      const response = await submitRecipeForReview(id) as { status: 'draft' | 'pending' | 'published' | 'rejected' };
      message.success('菜谱已提交审核！');
      if (recipe) {
        setRecipe({...recipe, status: response.status});
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交审核失败，请重试');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const handleCancelReview = async () => {
    if (!id) return;
    
    setCancelLoading(true);
    try {
      const response = await cancelRecipeReview(id) as { status: 'draft' | 'pending' | 'published' | 'rejected' };
      message.success('已撤销审核！');
      if (recipe) {
        setRecipe({...recipe, status: response.status});
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '撤销审核失败，请重试');
    } finally {
      setCancelLoading(false);
    }
  };
  
  const handleDeleteRecipe = async () => {
    if (!id) return;
    
    setDeleteLoading(true);
    try {
      await deleteRecipe(id);
      message.success('菜谱已删除！');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败，请重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft':
        return <Tag color="orange">草稿</Tag>;
      case 'pending':
        return <Tag color="blue">待审核</Tag>;
      case 'published':
        return <Tag color="green">已发布</Tag>;
      case 'rejected':
        return <Tag color="red">已拒绝</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Function to handle clearing all cloud commands
  const handleClearCloudCommands = () => {
    form.setFieldsValue({
      cloud_commands: undefined
    });
  };

  // Function to open the device selection modal
  const openDeviceModal = (index: number, currentModel: string) => {
    setEditingDeviceIndex(index);
    setTempDeviceModel(currentModel);
    setDeviceModalVisible(true);
  };

  // Function to handle device model change
  const handleDeviceModelSelect = () => {
    if (editingDeviceIndex === null || !tempDeviceModel) {
      setDeviceModalVisible(false);
      return;
    }

    const currentCommands = form.getFieldValue(['cloud_commands']) || [];
    
    // Check if this model already exists in another tab
    const modelExists = currentCommands.some(
      (cmd: any, i: number) => i !== editingDeviceIndex && cmd.model === tempDeviceModel
    );
    
    if (modelExists) {
      message.error(`设备类型 "${tempDeviceModel}" 已存在，请选择其他设备类型`);
      return;
    }
    
    // Update the model for this tab
    const updatedCommands = [...currentCommands];
    updatedCommands[editingDeviceIndex] = {
      ...updatedCommands[editingDeviceIndex],
      model: tempDeviceModel
    };
    
    form.setFieldsValue({
      cloud_commands: updatedCommands
    });
    
    setDeviceModalVisible(false);
  };

  // Cloud Command Guide Handlers
  const handleOpenGuideForAdd = () => {
    setEditingCommandSet(null);
    setIsEditingGuide(false);
    setIsGuideVisible(true);
  };

  const handleOpenGuideForEdit = (commandSet: any) => {
    setEditingCommandSet(commandSet);
    setIsEditingGuide(true);
    setIsGuideVisible(true);
  };

  const handleCloseGuide = () => {
    setIsGuideVisible(false);
  };

  const handleSaveCommandSet = (savedData: CloudCommandData) => {
    console.log('Received cloud command data:', savedData);
    
    // Get current commands or initialize empty array
    let currentCommands = form.getFieldValue('cloud_commands') || [];
    
    // Ensure currentCommands is an array
    if (!Array.isArray(currentCommands)) {
      currentCommands = currentCommands ? [currentCommands] : [];
    }
    
    const updatedCommands = [...currentCommands];
    
    // Check if we're editing an existing command set
    if (isEditingGuide && editingCommandSet) {
      // Replace the edited command set
      const index = updatedCommands.findIndex(cmd => cmd.model === editingCommandSet.model);
      if (index !== -1) {
        updatedCommands[index] = savedData;
      } else {
        updatedCommands.push(savedData);
      }
    } else {
      // Add new command set
      updatedCommands.push(savedData);
    }
    
    console.log('Updated cloud commands:', updatedCommands);
    
    // Update form state - use setFields instead of setFieldsValue for more control
    form.setFields([
      {
        name: 'cloud_commands',
        value: updatedCommands,
        touched: true,
        validating: false,
      }
    ]);
    
    // Log for debugging
    setTimeout(() => {
      console.log('Form values after update:', form.getFieldsValue());
      console.log('Cloud commands from form:', form.getFieldValue('cloud_commands'));
    }, 0);
    
    handleCloseGuide();
    message.success(isEditingGuide ? '命令已更新' : '命令已添加');
  };

  const handleDeleteCommandSet = (model: string) => {
    const currentCommands = form.getFieldValue('cloud_commands') || [];
    const updatedCommands = currentCommands.filter((cmd: any) => cmd.model !== model);
    
    // Use setFields instead of setFieldsValue for consistency
    form.setFields([
      {
        name: 'cloud_commands',
        value: updatedCommands,
        touched: true,
        validating: false,
      }
    ]);
    
    console.log('Cloud commands after deletion:', form.getFieldValue('cloud_commands'));
    message.success(`设备 "${model}" 的命令已删除`);
  };

  // 渲染操作按钮
  const renderActionButtons = () => {
    if (!isEditing || !recipe) {
      // 创建新菜谱时的按钮
      return (
        <Row gutter={16}>
          <Col span={12}>
            <Button 
              icon={<SaveOutlined />} 
              onClick={saveDraft} 
              block
            >
              保存草稿
            </Button>
          </Col>
          <Col span={12}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SendOutlined />}
              block
            >
              提交审核
            </Button>
          </Col>
        </Row>
      );
    }
    
    // 编辑现有菜谱时的按钮，根据状态显示不同操作
    return (
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Button 
            icon={<SaveOutlined />} 
            onClick={saveDraft}
            loading={loading}
            block
          >
            保存修改
          </Button>
        </Col>
        
        {recipe.status === 'draft' && (
          <Col span={12}>
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              loading={submitLoading}
              onClick={handleSubmitForReview}
              block
            >
              提交审核
            </Button>
          </Col>
        )}
        
        {recipe.status === 'pending' && (
          <Col span={12}>
            <Button 
              type="default" 
              icon={<RollbackOutlined />}
              loading={cancelLoading}
              onClick={handleCancelReview}
              block
            >
              撤销审核
            </Button>
          </Col>
        )}
        
        <Col span={24}>
          <Popconfirm
            title="确定要删除这个菜谱吗?"
            onConfirm={handleDeleteRecipe}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              loading={deleteLoading}
              block
            >
              删除菜谱
            </Button>
          </Popconfirm>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card 
        title={isEditing ? "编辑菜谱" : "创建新菜谱"} 
        bordered={false}
        extra={
          <Space>
            <Button 
              icon={<RollbackOutlined />} 
              onClick={() => navigate('/?tab=my-recipes')}
            >
              返回
            </Button>
            {recipe && (
              <div>
                {getStatusDisplay(recipe.status)}
              </div>
            )}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            steps: [{ content: '' }],
            ingredients: [{ name: '', amount: '', unit: '克' }],
            staple_food: [{ name: '', amount: '', unit: '克' }],
            //device_types: [],
            difficulty: '2',
            suitable_person: 4
          }}
        >
          <Form.Item
            name="title"
            label="菜谱名称"
            rules={[{ required: true, message: '请输入菜谱名称' }]}
          >
            <Input placeholder="请输入菜谱名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="description"
                label="菜谱描述"
                rules={[{ required: true, message: '请输入菜谱描述' }]}
              >
                <TextArea rows={4} placeholder="请输入菜谱描述" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cover_image"
                label="封面图片"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                extra="建议尺寸：500x300"
              >
                <Upload
                  name="cover"
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传封面</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">食材</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Card title="辅料" bordered={false}>
                <Form.List name="ingredients" rules={[
                  {
                    validator: async (_, ingredients) => {
                      if (!ingredients || ingredients.length === 0) {
                        return Promise.reject(new Error('至少添加一种辅料'));
                      }
                    },
                  },
                ]}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            rules={[{ required: true, message: '请输入食材名称' }]}
                          >
                            <Input placeholder="食材名称" style={{ width: 120 }} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'amount']}
                            rules={[{ required: true, message: '请输入数量' }]}
                          >
                            <Input placeholder="数量" style={{ width: 60 }} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'unit']}
                            initialValue="克"
                          >
                            <Select style={{ width: 70 }}>
                              <Option value="克">克</Option>
                              <Option value="千克">千克</Option>
                              <Option value="毫升">毫升</Option>
                              <Option value="升">升</Option>
                              <Option value="勺">勺</Option>
                              <Option value="茶匙">茶匙</Option>
                              <Option value="汤匙">汤匙</Option>
                              <Option value="个">个</Option>
                              <Option value="片">片</Option>
                              <Option value="根">根</Option>
                              <Option value="适量">适量</Option>
                            </Select>
                          </Form.Item>
                          {fields.length > 1 ? (
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          ) : null}
                        </Space>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加辅料
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="主食" bordered={false}>
                <Form.List name="staple_food">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            rules={[{ required: true, message: '请输入主食名称' }]}
                          >
                            <Input placeholder="主食名称" style={{ width: 120 }} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'amount']}
                            rules={[{ required: true, message: '请输入数量' }]}
                          >
                            <Input placeholder="数量" style={{ width: 60 }} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'unit']}
                            initialValue="克"
                          >
                            <Select style={{ width: 70 }}>
                              <Option value="克">克</Option>
                              <Option value="千克">千克</Option>
                              <Option value="毫升">毫升</Option>
                              <Option value="升">升</Option>
                              <Option value="勺">勺</Option>
                              <Option value="茶匙">茶匙</Option>
                              <Option value="汤匙">汤匙</Option>
                              <Option value="个">个</Option>
                              <Option value="碗">碗</Option>
                              <Option value="份">份</Option>
                              <Option value="适量">适量</Option>
                            </Select>
                          </Form.Item>
                          {fields.length > 1 ? (
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          ) : null}
                        </Space>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加主食
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          <CloudCommandGuide
            visible={isGuideVisible}
            deviceTypes={deviceTypes.items?.filter((device: any) => device.status === 'approved') || []}
            initialData={editingCommandSet}
            onClose={handleCloseGuide}
            onSave={handleSaveCommandSet}
            isEditing={isEditingGuide}
          />

          <Divider orientation="left">基本信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  {difficultyOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="suitable_person"
                label="适合人群"
              >
                <Select placeholder="请选择适合人群">
                  {suitablePersonOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="prep_time_minutes"
                label="准备时间（分钟）"
                rules={[{ required: true, message: '请输入准备时间' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="cook_time_minutes"
                label="烹饪时间（分钟）"
                rules={[{ required: true, message: '请输入烹饪时间' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="servings"
                label="份量（人份）"
                rules={[{ required: true, message: '请输入份量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="temperature_value"
                label="温度值"
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="temperature_unit"
                label="温度单位"
              >
                <Select placeholder="请选择温度单位">
                  <Option value="C">摄氏度</Option>
                  <Option value="F">华氏度</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="comal_position"
                label="锅具位置"
              >
                <Input placeholder="例如：1（前）、2（后）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select mode="tags" style={{ width: '100%' }} placeholder="输入标签，按Enter确认">
            </Select>
          </Form.Item>

          <Form.Item
            name="work_modes"
            label="工作模式"
          >
            <Select mode="tags" style={{ width: '100%' }} placeholder="输入工作模式，按Enter确认">
              <Option value="煎">煎</Option>
              <Option value="炒">炒</Option>
              <Option value="蒸">蒸</Option>
              <Option value="煮">煮</Option>
              <Option value="炖">炖</Option>
              <Option value="烤">烤</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">烹饪步骤</Divider>
          <Form.List name="steps" rules={[
            {
              validator: async (_, steps) => {
                if (!steps || steps.length === 0) {
                  return Promise.reject(new Error('至少添加一个步骤'));
                }
              },
            },
          ]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key} 
                    style={{ marginBottom: 16 }}
                    title={`步骤 ${name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      ) : null
                    }
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      label="步骤说明"
                      rules={[{ required: true, message: '请输入步骤内容' }]}
                    >
                      <TextArea placeholder="请输入步骤内容" rows={3} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'image']}
                      label="步骤图片"
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
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>上传图片</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ content: '' })}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加步骤
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <CloudCommandSummary 
            commands={(() => {
              const cmds_temp: RecipeFormData['cloud_commands'] = form.getFieldValue('cloud_commands');
              // Normalize to array or empty array
              if (!cmds_temp) return [];
              return cmds_temp;
            })()}
            deviceTypes={deviceTypes.items || []}
            onAddCommand={handleOpenGuideForAdd}
            onEditCommand={handleOpenGuideForEdit}
            onDeleteCommand={handleDeleteCommandSet}
          />

          {/* Hidden field to ensure cloud_commands is included in form data */}
          <Form.Item name="cloud_commands" hidden>
            <Input />
          </Form.Item>

          <Form.Item>
            {renderActionButtons()}
          </Form.Item>
        </Form>
      </Card>

      {/* Device selection modal */}
      <Modal
        title="选择设备类型"
        open={deviceModalVisible}
        onOk={handleDeviceModelSelect}
        onCancel={() => setDeviceModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form.Item
          label="设备类型"
          required
        >
          <Select 
            value={tempDeviceModel}
            onChange={setTempDeviceModel}
            style={{ width: '100%' }}
          >
            {deviceTypes.items?.filter((device: any) => device.status === 'approved').map((device: any) => (
              <Select.Option key={device.model_identifier} value={device.model_identifier}>
                {device.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Modal>
    </div>
  );
};

export default CreateRecipe; 
