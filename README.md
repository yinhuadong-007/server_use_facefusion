# FaceSwap Server

一个基于 Node.js 和 TypeScript 的人脸交换服务器，使用 FaceFusion 作为核心处理引擎。

## 功能特性

- 提供 RESTful API 接口进行人脸交换操作
- 支持双图换脸（上传源图和目标图）
- 支持单图换脸（使用固定源图）
- 支持拖拽上传和点击选择文件
- 提供测试页面便于调试和演示
- 支持大文件上传（默认100MB限制）
- 支持跨域请求（CORS）

## 技术栈

- **后端**: Node.js, TypeScript, Express.js
- **文件处理**: Multer（文件上传）
- **图像处理**: FaceFusion（AI换脸引擎）
- **前端**: HTML5, CSS3, JavaScript ES6+

## 快速开始

### 环境要求

- Node.js >= 14.x
- npm >= 6.x
- Python >= 3.10 (用于 FaceFusion)
- FaceFusion 已正确安装和配置

有关 FaceFusion 的详细安装说明，请参考官方文档：[https://docs.facefusion.io/installation](https://docs.facefusion.io/installation)

### 安装依赖

```bash
npm install
```

### 启动服务器

开发模式：
```bash
npm run dev
```

生产模式：
```bash
# 编译代码
npm run build

# 启动服务器
npm start
```

服务器默认运行在 `http://localhost:9001`

## API 接口

### 双图换脸

```
POST /api/swap-face
Content-Type: multipart/form-data

字段:
- sourceImage: 源图片文件（包含要替换的人脸）
- targetImage: 目标图片文件（要被替换人脸的图片）
```

**响应格式**:
```json
{
  "success": true,
  "message": "换脸成功",
  "resultUrl": "http://localhost:9001/results/result-1700000000000.png"
}
```

### 单图换脸（使用固定源图）

```
POST /api/swap-face-target
Content-Type: multipart/form-data

字段:
- targetImage: 目标图片文件（要被替换人脸的图片）
```

**响应格式**:
```json
{
  "success": true,
  "message": "换脸成功",
  "resultUrl": "http://localhost:9001/results/result-1700000000000.png"
}
```

### 健康检查接口

```
GET /api/health
```

**响应格式**:
```json
{
  "success": true,
  "faceFusionAvailable": true,
  "message": "FaceFusion is ready"
}
```

## 测试页面

- `test-faceswap.html` - 双图换脸测试页面
  - 支持同时上传源图片和目标图片
  - 提供拖拽上传功能
  - 实时预览上传的图片
  
- `test-faceswap-target.html` - 单图换脸测试页面
  - 使用预设的源图片（`src/asset/face.png`）
  - 只需上传目标图片
  - 提供拖拽上传功能

## 项目结构

```
ai_server_faceswap/
├── dist/                  # 编译后的 JavaScript 文件
├── public/                # 静态资源目录
│   ├── index.html         # 主页
│   ├── test-faceswap.html # 双图换脸测试页面
│   └── test-faceswap-target.html # 单图换脸测试页面
├── results/               # 处理结果存储目录
├── src/                   # 源代码目录
│   ├── asset/             # 固定资源目录（包含 face.png）
│   ├── config.ts          # 配置文件
│   ├── server.ts          # 服务器主文件
│   └── services/          # 服务层
│       └── faceSwapService.ts # 人脸交换服务
├── uploads/               # 上传文件存储目录
├── package.json           # 项目配置文件
└── tsconfig.json          # TypeScript 配置文件
```

## 配置说明

### 服务器配置

配置文件位于 `src/config.ts`，主要配置项包括：

- **服务器设置**:
  - `host`: 服务器主机地址（默认: '0.0.0.0'）
  - `port`: 服务器端口（默认: 9001）
  - `uploadFileSizeLimit`: 上传文件大小限制（默认: 100MB）
  - `maxUploadFiles`: 最大同时上传文件数（默认: 2）

- **FaceFusion 设置**:
  - `installationPath`: FaceFusion 安装路径
  - `scriptPath`: FaceFusion Python 脚本路径
  - `defaultModel`: 默认模型
  - `outputImageQuality`: 输出图像质量（默认: 80）
  - `commandTimeout`: 命令执行超时时间（默认: 5分钟）

### 启动脚本

提供了多种启动脚本以适应不同场景：

```bash
# 开发模式
npm run dev          # 默认开发模式
npm run dev-local    # 仅本地访问
npm run dev-network  # 允许网络访问
npm run dev-https    # HTTPS 模式

# 生产模式
npm start            # 默认生产模式
npm run start-local  # 仅本地访问
npm run start-network # 允许网络访问
npm run start-https  # HTTPS 模式
```

## 错误处理

服务器实现了全面的错误处理机制：

1. **文件上传错误**:
   - 文件大小超出限制
   - 文件格式不支持
   - 上传字段名称不匹配

2. **处理错误**:
   - FaceFusion 执行失败
   - 源文件不存在
   - 系统资源不足

3. **网络错误**:
   - 连接被拒绝
   - 请求超时
   - 跨域问题

## 常见问题与解决方案

### 1. ERR_CONNECTION_REFUSED 错误

**原因**: 服务器未启动或端口被占用

**解决方案**:
1. 确认服务器是否已启动
2. 检查端口是否被占用：`netstat -ano | findstr :9001`
3. 更改端口启动：`set PORT=9002&& npm run dev`

### 2. "源图像文件不存在" 错误

**原因**: 固定源图像文件缺失或路径配置错误

**解决方案**:
1. 确认 `src/asset/face.png` 文件存在
2. 检查服务器代码中路径配置是否正确

### 3. MulterError: Unexpected field 错误

**原因**: 前端发送的字段名称与后端配置不匹配

**解决方案**:
1. 确认字段名称：
   - 双图模式：`sourceImage` 和 `targetImage`
   - 单图模式：`targetImage`
2. 检查 HTML 表单中的 `name` 属性

## 性能优化建议

1. **硬件要求**:
   - 推荐使用支持 CUDA 的 NVIDIA GPU 以加速处理
   - 至少 16GB 内存以处理高分辨率图片

2. **配置优化**:
   - 根据硬件性能调整 `commandTimeout` 参数
   - 合理设置 `uploadFileSizeLimit` 以平衡用户体验和系统负载

3. **并发处理**:
   - 当前版本为单线程处理，如需并发处理可考虑队列机制

## 安全注意事项

1. **文件上传安全**:
   - 限制上传文件类型和大小
   - 对上传文件进行病毒扫描
   - 定期清理上传目录

2. **访问控制**:
   - 生产环境建议添加身份验证机制
   - 限制 API 访问频率防止滥用

3. **数据保护**:
   - 处理完的图片应及时清理
   - 不在服务器存储用户隐私图片

## 详细文档

请查看 [SERVER_USAGE_GUIDE.md](SERVER_USAGE_GUIDE.md) 获取完整的使用说明和故障排除指南。

## 许可证

MIT