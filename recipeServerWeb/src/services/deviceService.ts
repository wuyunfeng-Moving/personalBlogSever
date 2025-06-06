import api, { DeviceModel, DeviceModelListResponse } from './api';

// 重新导出类型以保持兼容性
export type { DeviceModel };

// 获取设备类型列表
export const getDeviceModels = async () => {
  return await api.getDeviceModels();
};

// 获取设备类型详情
export const getDeviceModelById = async (id: number | string) => {
  return await api.getDeviceModelDetail(id);
};

// 创建设备类型 (仅管理员)
export const createDeviceModel = async (deviceModel: Omit<DeviceModel, 'id' | 'status'>) => {
  return await api.createDeviceModel(deviceModel);
};

// 更新设备类型 (仅管理员)
export const updateDeviceModel = async (id: number | string, deviceModel: Partial<Omit<DeviceModel, 'id' | 'status'>>) => {
  return await api.updateDeviceModel(id, deviceModel);
};

// 删除设备类型 (仅管理员)
export const deleteDeviceModel = async (id: number | string) => {
  await api.deleteDeviceModel(id);
}; 