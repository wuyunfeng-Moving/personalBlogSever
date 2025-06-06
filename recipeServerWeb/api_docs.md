# 菜谱服务 API 文档

## 目录
1. [认证相关](#认证相关)
2. [用户相关](#用户相关)
3. [菜谱相关](#菜谱相关)
4. [菜谱审核相关](#菜谱审核相关)
5. [设备类型管理](#设备类型管理)
6. [设备状态更新](#设备状态更新)
7. [错误响应](#错误响应)
8. [使用示例](#使用示例)

## 认证相关

### 用户注册
- **URL**: `/api/v1/auth/register/`
- **方法**: `POST`
- **描述**: 注册新用户
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "password2": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
  ```
- **响应**: 201 Created
  ```json
  {
    "id": "integer",
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
  ```
- **错误响应**: 400 Bad Request
  ```json
  {
    "username": ["该用户名已存在"],
    "password": ["密码太简单", "两次密码不匹配"],
    "email": ["请输入有效的电子邮箱地址"],
    "error": "注册失败，请检查输入信息"
  }
  ```
  注：错误响应会包含具体的字段错误信息，方便客户端识别问题原因

### 管理员注册
- **URL**: `/api/v1/auth/admin/register/`
- **方法**: `POST`
- **描述**: 注册新管理员（需要管理员权限）
- **请求体**: 同用户注册
- **响应**: 同用户注册
- **错误响应**: 同用户注册

### 用户登录
- **URL**: `/api/v1/auth/login/`
- **方法**: `POST`
- **描述**: 用户登录获取JWT令牌
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**: 200 OK
  ```json
  {
    "access": "string",
    "refresh": "string"
  }
  ```

### 刷新令牌
- **URL**: `/api/v1/auth/refresh/`
- **方法**: `POST`
- **描述**: 使用刷新令牌获取新的访问令牌
- **请求体**:
  ```json
  {
    "refresh": "string"
  }
  ```
- **响应**: 200 OK
  ```json
  {
    "access": "string"
  }
  ```

## 用户相关

### 获取/更新用户资料
- **URL**: `/api/v1/users/profile/`
- **方法**: 
  - `GET`: 获取用户资料
  - `PUT`: 更新用户资料
- **权限**: 需要认证
- **响应**: 200 OK
  ```json
  {
    "id": "integer",
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "date_joined": "datetime",
    "is_admin": "boolean"
  }
  ```

## 菜谱相关

### 获取菜谱列表
- **URL**: `/api/v1/recipes/`
- **方法**: `GET`
- **描述**: 获取菜谱列表
- **查询参数**:
  - `model`: 设备型号标识符（可选），按设备型号筛选
  - `author`: 作者筛选（可选），使用 `me` 查询当前登录用户的所有菜谱
- **备注**: 
  - 未登录用户只能查看已发布的菜谱
  - 设置 `author=me` 时需要认证，会返回当前用户的所有菜谱（包括草稿、待审核等）
- **响应**: 200 OK
    ```json
    {
    "count": "integer",
    "next": "string", // 下一页URL，如果没有则为null
    "previous": "string", // 上一页URL，如果没有则为null
        "results": [
            {
        "id": "integer",
        "title": "string",
        "description": "string",
                "author": {
          "id": "integer",
          "username": "string",
          "email": "string",
          "first_name": "string", 
          "last_name": "string",
          "date_joined": "datetime"
                },
        "prep_time_minutes": "integer",
        "cook_time_minutes": "integer",
        "servings": "integer",
        "image": "string", // 图片文件路径
        "imageUrl": "string", // 完整的图片URL
        "status": "string", // draft, pending, published, rejected, archived
        "created_at": "datetime",
        "updated_at": "datetime"
      }
        ]
    }
    ```

### 创建菜谱
- **URL**: `/api/v1/recipes/create/`
- **方法**: `POST`
- **权限**: 需要认证
- **请求格式**: `application/json` 或 `multipart/form-data`
- **请求体**: 
  - 基本信息字段（如 `title`, `description` 等）应作为JSON负载的一部分。
  - 如果要上传主封面图，添加一个名为 `image` 的文件字段。
  - `steps` 字段 (主烹饪步骤) 应是一个JSON字符串化的数组，其中每个步骤对象可以包含:
    - `stepNo` (integer, required)
    - `stepDescription` (string, required)
    - `imageUrl` (string, optional): 步骤图片的URL。
    - `imageFile` (file, optional): 步骤图片的文件实体。
  - **云命令格式** (`cloud_commands`字段 - 可选，是一个**列表**，包含一个或多个设备型号的命令集):
    ```json
    [
    {
        "model": "设备型号标识符_A",
        "hex_command": "a1b2c3d4e5f6", // 单个16进制命令字符串
        "steps": [ // 与该 hex_command 关联的步骤描述
          { 
            "stepNo": 1, // 步骤编号
            "stepDescription": "指令A步骤1描述"
          },
          { 
            "stepNo": 2, 
            "stepDescription": "指令A步骤2描述"
          }
          // ... 更多步骤描述
        ]
      },
      {
        "model": "设备型号标识符_B",
        "hex_command": "ffff0000",
        "steps": [ 
          { "stepNo": 1, "stepDescription": "指令B步骤1描述" }
        ]
      }
      // ... 更多设备型号
    ]
    ```
    - 注意：当使用`multipart/form-data`时，`cloud_commands`必须是JSON字符串化的**列表**。
  - **步骤图片上传方式**:
    - **方式一**: 直接在steps对象中通过`imageFile`字段提供（复杂，不推荐）
    - **方式二**: 为每个步骤提供单独的命名图片字段，格式为 `step_[步骤编号]_image`，例如：
      - `step_1_image`: 第一个步骤的图片
      - `step_2_image`: 第二个步骤的图片
  - **注意**: 
    - 对于每个步骤，只能提供 `imageUrl` 或使用单独的命名字段提供图片，不能同时提供。
    - 如果任何一个步骤包含图片文件，或者上传了主 `image` 文件，则整个请求**必须**使用 `multipart/form-data` 格式。
    - 如果使用 `multipart/form-data`，非文件字段（如`title`, `description`, `steps` JSON字符串等）应作为表单数据发送。

- **请求体示例 (`multipart/form-data`，含云命令)**: 
  ```
  // multipart/form-data 请求
  // 字段:
  title: "包含多设备命令的菜谱"
  description: "这是一个示例"
  image: [文件数据] // 主封面图 (可选)
  steps: "[{\"stepNo\": 1, \"stepDescription\": \"主步骤1\"}]" // 主步骤 JSON 字符串
  cloud_commands: "[{\"model\": \"MODEL_A\", \"hex_command\": \"a1b2c3d4\", \"steps\": [{\"stepNo\": 1, \"stepDescription\": \"指令A描述\"}]}, {\"model\": \"MODEL_B\", \"hex_command\": \"ffff00\", \"steps\": [{\"stepNo\": 1, \"stepDescription\": \"指令B描述\"}]}]" // JSON 字符串化的云命令列表
  step_1_image: [文件数据] // 第1步的图片
  step_2_image: [文件数据] // 第2步的图片
  // ... 其他字段 ... 
  ```

- **请求体示例 (`application/json`, 包含多个云命令)**: 
        ```json
        {
    "title": "带多云命令的菜谱",
    "description": "这是一个带云命令的菜谱示例",
    "steps": [
                {
        "stepNo": 1,
        "stepDescription": "第一步",
        "imageUrl": ""
      },
      {
        "stepNo": 2,
        "stepDescription": "第二步",
        "imageUrl": ""
      }
    ],
    "ingredients": [],
    "staple_food": [],
    "difficulty": 1,
    "suitable_person": 2,
    "tags": "test,云命令",
    "work_modes": "测试",
    "temperature_value": 180,
    "temperature_unit": "℃",
    "comal_position": 3,
    "cloud_commands": [
      {
        "model": "MODEL_A",
        "hex_command": "a1b2c3d4e5f6",
        "steps": [
          { "stepNo": 1, "stepDescription": "指令A步骤1描述" },
          { "stepNo": 2, "stepDescription": "指令A步骤2描述" }
        ]
      },
      {
        "model": "MODEL_B",
        "hex_command": "ffff0000",
        "steps": [
          { "stepNo": 1, "stepDescription": "指令B步骤1描述" }
        ]
                }
            ]
        }
        ```
- **响应**: 201 Created (返回创建的菜谱详情，步骤中 `imageUrl` 会包含上传后生成的URL)

### 获取菜谱详情
- **URL**: `/api/v1/recipes/<id>/`
- **方法**: `GET`
- **响应**: 200 OK
    ```json
    {
    "id": "integer",
    "title": "string",
    "description": "string",
    "author": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "first_name": "string", 
      "last_name": "string",
      "date_joined": "datetime"
    },
    "steps": [
      {
        "stepNo": "integer",
        "stepDescription": "string",
        "imageUrl": "string" // 步骤图片URL，如果没有则为空字符串
      }
    ],
    "ingredients": "array", // 食材列表，通常是字符串数组
    "staple_food": "array", // 主料列表，通常是字符串数组
    "prep_time_minutes": "integer",
    "cook_time_minutes": "integer",
    "servings": "integer",
    "image": "string", // 图片文件路径
    "imageUrl": "string", // 完整的图片URL
    "difficulty": "integer", // 1:简单, 2:适中, 3:困难
    "suitable_person": "integer", // 1:老人, 2:成人, 3:儿童, 4:婴幼儿
    "tags": "string", // 逗号分隔的标签
    "work_modes": "string", // 逗号分隔的工作模式
    "temperature_value": "float", // 温度值
    "temperature_unit": "string", // 温度单位
    "comal_position": "integer", // 锅位置
    "status": "string", // draft, pending, published, rejected, archived
    "created_at": "datetime",
    "updated_at": "datetime",
    "cloud_commands": [ // 关联的设备命令列表
      {
        "model": "string", // 设备型号标识符
        "hex_command": "string", // 单个16进制命令字符串
        "steps": [ // 关联的步骤描述
          { 
            "stepNo": "integer", 
            "stepDescription": "string"
          }
          // ... 更多步骤描述
        ]
      }
      // 可能包含多个设备型号的命令
    ]
    }
    ```

### 更新菜谱
- **URL**: `/api/v1/recipes/<id>/update/`
- **方法**: `PUT`
- **权限**: 需要认证（仅作者）
- **请求体**: 同创建菜谱。如果提供了`cloud_commands`字段（必须是**列表**格式，每项包含`model`, `hex_command`, `steps`），它将**完全替换**该菜谱版本现有的所有设备命令关联。
  - **云命令格式** (`cloud_commands`字段 - 用于**替换**所有现有命令关联):
    ```json
    [
    {
        "model": "设备型号标识符_A",
        "hex_command": "aabbccdd",
        "steps": [ ... ] // 步骤描述列表
      },
      {
        "model": "设备型号标识符_C", // 可以添加新的，或修改现有的，或省略旧的
        "hex_command": "11223344",
        "steps": [ ... ]
      }
      // ... 列表中的模型将成为该版本新的命令关联
    ]
    ```
    - 注意：当使用`multipart/form-data`时，`cloud_commands`必须是JSON字符串化的**列表**。
    - 注意：空列表 `[]` 将删除所有现有命令关联。
- **响应**: 200 OK

### 删除菜谱
- **URL**: `/api/v1/recipes/<id>/delete/`
- **方法**: `DELETE`
- **权限**: 需要认证（仅作者）
- **响应**: 204 No Content

### 上传菜谱封面图片
- **URL**: `/api/v1/recipes/<id>/image/`
- **方法**: `POST`
- **权限**: 需要认证（仅作者）
- **请求格式**: `multipart/form-data`
- **请求体**:
  - `image`: 图片文件
- **响应**: 200 OK
  ```json
  {
    "imageUrl": "string" // 上传成功后的图片URL
  }
  ```
- **错误**: 
  - 400: 未提供图片文件或文件无效
  - 403: 权限不足
  - 404: 菜谱不存在
  - 500: 保存图片失败


### 上传菜谱步骤图片
- **URL**: `/api/v1/recipes/<recipe_id>/steps/<step_no>/image/`
- **方法**: `POST`
- **权限**: 需要认证（仅作者）
- **请求格式**: `multipart/form-data`
- **请求体**:
  - `image`: 图片文件
- **响应**: 200 OK
  ```json
  {
    "imageUrl": "string" // 上传成功后的图片URL
  }
  ```
- **错误**: 
  - 400: 未提供图片文件、文件无效或步骤号无效
  - 403: 权限不足
  - 404: 菜谱不存在
  - 500: 保存图片失败

### 提交审核
- **URL**: `/api/v1/recipes/<id>/submit-review/`
- **方法**: `PUT`
- **权限**: 需要认证（仅作者）
- **请求体**:
  ```json
  {}
  ```
- **响应**: 200 OK
  ```json
  {
    "status": "pending"
  }
  ```

### 撤销审核
- **URL**: `/api/v1/recipes/<id>/cancel-review/`
- **方法**: `PUT`
- **权限**: 需要认证（仅作者）
- **请求体**:
  ```json
  {}
  ```
- **响应**: 200 OK
  ```json
  {
    "status": "draft"
  }
```

### 获取菜谱命令
- **URL**: `/api/v1/recipes/<id>/commands/`
- **方法**: `GET`
- **查询参数**:
  - `model`: 设备型号标识符（必需）
- **响应**: 200 OK (返回指定型号的命令信息)
  ```json
  {
    "model": "string",
    "recipe_id": "integer",
    "hex_command": "string", // 单个16进制命令字符串
    "steps": [
      { 
        "stepNo": "integer", 
        "stepDescription": "string"
      }
      // ... 更多步骤描述
    ]
  }
  ```


## 菜谱审核相关

### 获取待审核菜谱列表
- **URL**: `/api/v1/recipes/pending/`
- **方法**: `GET`
- **权限**: 需要管理员权限
- **描述**: 获取所有待审核的菜谱
- **响应**: 200 OK
  ```json
  {
    "count": "integer",
    "next": "string", // 下一页URL，如果没有则为null
    "previous": "string", // 上一页URL，如果没有则为null
    "results": [
      {
        "id": "integer",
        "title": "string",
        "description": "string",
        "author": {
          "id": "integer",
          "username": "string",
          "email": "string",
          "first_name": "string", 
          "last_name": "string",
          "date_joined": "datetime"
        },
        // ... 其他菜谱字段 ...
        "status": "pending",
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ]
  }
  ```

### 审核菜谱
- **URL**: `/api/v1/recipes/<int:pk>/review/`
- **方法**: `PUT`
- **权限**: 需要管理员权限
- **描述**: 审核菜谱（通过或拒绝）
- **请求体**:
  ```json
  {
    "action": "approve" // 或 "reject"
  }
  ```
- **响应**: 200 OK
  ```json
  {
    "status": "published" // 如果通过，或 "draft" 如果拒绝
  }
  ```
- **错误响应**: 400 Bad Request
  ```json
  {
    "error": "Invalid action"
  }
  ```

## 设备类型管理

### 获取设备类型列表
- **URL**: `/api/v1/device-models/`
- **方法**: `GET`
- **描述**: 普通用户只能看到已批准的设备类型
- **响应**: 200 OK
    ```json
    {
    "count": "integer",
    "results": [
      {
        "id": "integer",
        "model_identifier": "string",
        "name": "string",
        "status": "string",
        "command_template": "string"
      }
    ]
    }
    ```

### 创建设备类型
- **URL**: `/api/v1/device-models/create/`
- **方法**: `POST`
- **权限**: 需要管理员权限
- **请求体**:
        ```json
        {
    "model_identifier": "string",
    "name": "string",
    "command_template": "string"
  }
  ```
- **响应**: 201 Created

### 获取设备类型详情
- **URL**: `/api/v1/device-models/<id>/`
- **方法**: `GET`
- **响应**: 200 OK

### 更新设备类型
- **URL**: `/api/v1/device-models/<id>/update/`
- **方法**: `PUT`
- **权限**: 需要管理员权限
- **请求体**: 同创建设备类型
- **响应**: 200 OK

### 删除设备类型
- **URL**: `/api/v1/device-models/<id>/delete/`
- **方法**: `DELETE`
- **权限**: 需要管理员权限
- **响应**: 204 No Content

## 设备状态更新

### 更新设备状态
- **URL**: `/api/v1/devices/status/`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "deviceId": "string",
    "timestamp": "datetime",
    "status": "object"
        }
        ```
- **响应**: 200 OK
    ```json
    {
    "message": "Status received successfully"
    }
    ```

## 错误响应

所有API在发生错误时都会返回相应的HTTP状态码和错误信息：

    ```json
    {
  "error": "错误描述"
}
```

常见状态码：
- 400 Bad Request: 请求参数错误
- 401 Unauthorized: 未认证
- 403 Forbidden: 权限不足
- 404 Not Found: 资源不存在
- 500 Internal Server Error: 服务器内部错误 

## 使用示例

### 创建菜谱

**请求示例 (`application/json` with multiple commands including hex)**：
```bash
curl -X POST "http://localhost:8000/api/v1/recipes/create/" \
  -H "Authorization: Bearer {your_access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "香煎牛排 (多设备Hex - 单指令)",
    "description": "美味的香煎牛排配蔬菜",
    "steps": [
      {"stepNo": 1, "stepDescription": "主步骤-准备"},
      {"stepNo": 2, "stepDescription": "主步骤-烹饪"}
    ],
    "ingredients": ["牛排:300克"],
    "staple_food": ["牛排"],
    "difficulty": 2,
    "suitable_person": 2,
    "tags": "牛肉,西餐,煎,hex",
    "work_modes": "煎制",
    "temperature_value": 180,
    "temperature_unit": "C",
    "comal_position": 1,
    "cloud_commands": [
      {
        "model": "MODEL_A",
        "hex_command": "a1b2c3d4",
        "steps": [
          {"stepNo": 1, "stepDescription": "指令A: 预热并烹饪"}
            ]
      },
      {
        "model": "MODEL_B",
        "hex_command": "e5f6a7b8",
        "steps": [
          {"stepNo": 1, "stepDescription": "指令B: 保温"}
        ]
      }
    ]
  }'
```

**成功响应（201 Created）**：
    ```json
    {
  "id": 48,
  "title": "香煎牛排 (多设备Hex - 单指令)",
  // ... 其他字段 ...
  "cloud_commands": [
    {
      "model": "MODEL_A",
      "hex_command": "a1b2c3d4",
      "steps": [
        {"stepNo": 1, "stepDescription": "指令A: 预热并烹饪"}
      ]
    },
    {
      "model": "MODEL_B",
      "hex_command": "e5f6a7b8",
      "steps": [
        {"stepNo": 1, "stepDescription": "指令B: 保温"}
      ]
    }
  ]
}
```

### 更新菜谱 (替换命令 with hex)

**请求示例**：
```bash
curl -X PUT "http://localhost:8000/api/v1/recipes/47/update/" \
  -H "Authorization: Bearer {your_access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "香煎牛排 (更新设备Hex - 单指令)",
    "description": "更新命令示例",
    // ... 其他字段 ...
    "cloud_commands": [
      {
        "model": "MODEL_A", // 保留 MODEL_A，修改命令和步骤
        "hex_command": "aabbccdd",
        "steps": [
          {"stepNo": 1, "stepDescription": "指令A: 慢炖(新)"}
        ]
      },
      {
        "model": "MODEL_C", // 添加 MODEL_C，MODEL_B 将被移除
        "hex_command": "112233445566",
        "steps": [
          {"stepNo": 1, "stepDescription": "指令C: 烘烤"}
        ]
      }
    ]
  }'
```

**成功响应（200 OK）**：
    ```json
    {
  "id": 47,
  "title": "香煎牛排 (更新设备Hex - 单指令)",
  // ... 其他字段 ...
  "cloud_commands": [
    {
      "model": "MODEL_A",
      "hex_command": "aabbccdd",
      "steps": [
        {"stepNo": 1, "stepDescription": "指令A: 慢炖(新)"}
      ]
    },
    {
      "model": "MODEL_C",
      "hex_command": "112233445566",
      "steps": [
        {"stepNo": 1, "stepDescription": "指令C: 烘烤"}
      ]
    }
    // 注意 MODEL_B 的命令已被移除
  ]
    }
    ```

### 删除菜谱

**请求示例**：
```bash
curl -X DELETE "http://localhost:8000/api/v1/recipes/47/delete/" \
  -H "Authorization: Bearer {your_access_token}"
```

**成功响应（204 No Content）**：
```
(无响应内容)
```

### 提交菜谱审核

**请求示例**：
```bash
curl -X PUT "http://localhost:8000/api/v1/recipes/46/submit-review/" \
  -H "Authorization: Bearer {your_access_token}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**成功响应（200 OK）**：
    ```json
    {
  "status": "pending"
}
```

### 撤销菜谱审核

**请求示例**：
```bash
curl -X PUT "http://localhost:8000/api/v1/recipes/46/cancel-review/" \
  -H "Authorization: Bearer {your_access_token}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**成功响应（200 OK）**：
    ```json
    {
  "status": "draft"
    }
```