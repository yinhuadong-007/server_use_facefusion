# FaceSwap Server

基于 Node.js 和 FaceFusion 的换脸服务后端应用。

## 功能特性

- 通过 RESTful API 接收两张图片
- 调用 FaceFusion 进行换脸处理
- 返回处理后的图片给客户端
- 提供简单的 Web 界面进行测试

## 技术栈

- Node.js
- TypeScript
- Express.js
- Multer (文件上传)
- FaceFusion (换脸引擎)

## 安装和设置

### 环境要求

- Node.js >= 14.x
- Python >= 3.10
- FaceFusion 已安装在 `D:\A_FaceFusion\facefusion`

### 安装步骤

1. 克隆项目代码：
```bash
git clone <repository-url>
cd ai_server_faceswap
```

2. 安装依赖：
```bash
npm install
```

3. 编译 TypeScript 代码：
```bash
npm run build
```

4. 启动服务器：
```bash
npm start
```

或者在开发模式下运行：
```bash
npm run dev
```

## API 接口

### 1. 换脸接口

**URL**: `POST /api/swap-face`

**参数**:
- `sourceImage`: 源图像文件 (提供脸部)
- `targetImage`: 目标图像文件 (被换脸的图像)

**响应**:
```json
{
  "success": true,
  "message": "换脸成功",
  "resultUrl": "/results/result-123456789.png"
}
```

### 2. 健康检查接口

**URL**: `GET /api/health`

**响应**:
```json
{
  "success": true,
  "faceFusionAvailable": true,
  "message": "FaceFusion is ready"
}
```

## 使用方法

1. 启动服务器后，打开浏览器访问 `http://localhost:3000`
2. 选择源图像和目标图像
3. 点击"开始换脸"按钮
4. 等待处理完成后查看和下载结果

## 项目结构

```
ai_server_faceswap/
├── src/
│   ├── server.ts          # 主服务器文件
│   └── services/
│       └── faceSwapService.ts  # FaceFusion 集成服务
├── uploads/               # 上传文件临时存储目录
├── results/               # 处理结果存储目录
├── public/                # 静态文件目录
├── package.json           # 项目配置文件
└── tsconfig.json          # TypeScript 配置文件
```

## 注意事项

1. FaceFusion 必须已经安装在 `D:\A_FaceFusion\facefusion` 路径下
2. 确保 Python 环境已正确配置并且可以在命令行中执行
3. 处理大图片或高分辨率图片时可能需要较长时间
4. 请遵守相关法律法规，不要用于非法用途

## 故障排除

如果遇到问题，请检查：

1. FaceFusion 是否正确安装在指定路径
2. Python 环境是否可用
3. 依赖包是否完整安装
4. 查看服务器控制台输出的错误信息

## 许可证

MIT License