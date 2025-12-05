// 服务器配置
export const serverConfig = {
  // 服务器主机地址
  host: process.env.HOST || '0.0.0.0',
  
  // 服务器端口
  port: parseInt(process.env.PORT || '9001', 10),
  
  // 服务器协议
  protocol: process.env.PROTOCOL || 'http',
  
  // 上传文件大小限制 (字节)
  uploadFileSizeLimit: 100 * 1024 * 1024, // 100MB
  
  // 最大同时上传文件数
  maxUploadFiles: 2,
};

// FaceFusion 配置
export const faceFusionConfig = {
  // FaceFusion 安装路径
  installationPath: process.env.FACEFUSION_PATH || 'D:\\A_FaceFusion\\facefusion',
  
  // FaceFusion Python 脚本路径
  scriptPath: process.env.FACEFUSION_SCRIPT_PATH || 'D:\\A_FaceFusion\\facefusion\\facefusion.py',
  
  // 模型路径
//   modelPath: process.env.FACEFUSION_MODEL_PATH || 'D:\\A_FaceFusion\\facefusion\\models\\inswapper_128_fp16.onnx',
  
  // 默认模型
  defaultModel: process.env.FACEFUSION_DEFAULT_MODEL || 'inswapper_128_fp16',
  
  // 输出图像质量
  outputImageQuality: parseInt(process.env.FACEFUSION_OUTPUT_QUALITY || '80', 10),
  
  // 命令执行超时时间 (毫秒)
  commandTimeout: parseInt(process.env.FACEFUSION_COMMAND_TIMEOUT || '300000', 10), // 5分钟
};

// 目录配置
export const directoryConfig = {
  // 上传目录
  uploadsDir: 'uploads',
  
  // 结果目录
  resultsDir: 'results',
  
  // 静态资源目录
  assetDir: 'src/asset',
  
  // 公共目录
  publicDir: 'public',
};

// 日志配置
export const logConfig = {
  // 是否启用详细日志
  verbose: process.env.LOG_VERBOSE === 'true' || false,
};