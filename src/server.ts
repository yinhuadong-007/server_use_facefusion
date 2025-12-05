import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { faceSwap, testFaceFusion } from './services/faceSwapService';
import { serverConfig, directoryConfig } from './config';

// 创建上传中间件，用于处理文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 使用时间戳生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fieldNameSize: 255, // 字段名称最大长度
    fieldSize: 1024 * 1024, // 字段值最大大小 (1MB)
    fileSize: serverConfig.uploadFileSizeLimit, // 文件最大大小
    files: serverConfig.maxUploadFiles // 最大文件数量
  }
});

// 创建 Express 应用
const app = express();
const HOST = serverConfig.host;
const PORT = serverConfig.port;
const PROTOCOL = serverConfig.protocol;

// 生成结果URL的辅助函数
function generateResultUrl(resultPath: string): string {
  const protocol = serverConfig.protocol;
  // 如果host配置为0.0.0.0，则使用服务器实际IP地址，否则使用配置的host
  const host = serverConfig.host === '0.0.0.0' ? getServerIpAddress() : serverConfig.host;
  const port = serverConfig.port;
  const fileName = path.basename(resultPath);
  return `${protocol}://${host}:${port}/results/${fileName}`;
}

// 获取服务器实际IP地址的辅助函数
function getServerIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    // 检查网络接口是否存在
    if (!networkInterface) {
      continue;
    }
    
    for (const iface of networkInterface) {
      // 跳过内部地址和IPv6地址
      if (iface.internal || iface.family !== 'IPv4') {
        continue;
      }
      
      // 返回第一个有效的IPv4地址
      // 优先选择192.168.x.x或10.x.x.x范围内的地址
      if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
        return iface.address;
      }
    }
  }
  
  // 如果没有找到合适的地址，返回localhost作为后备
  return 'localhost';
}

// 中间件
app.use(cors({
  origin: '*', // 允许任何来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// 使用绝对路径确保静态文件服务正常工作
const publicPath = path.join(__dirname, '../', directoryConfig.publicDir);
const resultsPath = path.join(__dirname, '../', directoryConfig.resultsDir);
console.log('Public path:', publicPath);
console.log('Results path:', resultsPath);
app.use(express.static(publicPath));
app.use('/results', express.static(resultsPath));

// 确保上传和结果目录存在
import fs from 'fs';
if (!fs.existsSync(directoryConfig.uploadsDir)) {
  fs.mkdirSync(directoryConfig.uploadsDir);
}
if (!fs.existsSync(directoryConfig.resultsDir)) {
  fs.mkdirSync(directoryConfig.resultsDir);
}

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ message: 'FaceSwap Server is running!' });
});

// 测试端点，用于验证服务器IP地址获取功能
app.get('/api/test-ip', (req, res) => {
  try {
    const ipAddress = getServerIpAddress();
    res.json({ 
      success: true,
      ipAddress: ipAddress,
      message: `服务器IP地址: ${ipAddress}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: '获取服务器IP地址失败',
      message: (error as Error).message 
    });
  }
});

// FaceFusion 可用性检查端点
app.get('/api/health', async (req, res) => {
  try {
    const isAvailable = await testFaceFusion();
    res.json({ 
      success: true,
      faceFusionAvailable: isAvailable,
      message: isAvailable ? 'FaceFusion is ready' : 'FaceFusion is not available'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      faceFusionAvailable: false,
      error: 'Health check failed',
      message: (error as Error).message 
    });
  }
});

// 换脸 API 端点（使用上传的图片）
app.post('/api/swap-face', upload.fields([
  { name: 'sourceImage', maxCount: 1 },
  { name: 'targetImage', maxCount: 1 }
]), async (req, res) => {
  try {
    // 检查是否收到两个图片文件
    if (!req.files || 
        !('sourceImage' in req.files) || 
        !('targetImage' in req.files) ||
        (req.files as { [fieldname: string]: Express.Multer.File[] })['sourceImage'].length === 0 ||
        (req.files as { [fieldname: string]: Express.Multer.File[] })['targetImage'].length === 0) {
      return res.status(400).json({ 
        error: '请提供源图像和目标图像两个文件' 
      });
    }

    const sourceImagePath = (req.files as { [fieldname: string]: Express.Multer.File[] })['sourceImage'][0].path;
    const targetImagePath = (req.files as { [fieldname: string]: Express.Multer.File[] })['targetImage'][0].path;

    console.log(`Processing face swap: source=${sourceImagePath}, target=${targetImagePath}`);

    // 调用 FaceFusion 进行换脸处理
    const resultPath = await faceSwap(sourceImagePath, targetImagePath);

    // 返回结果
    res.json({
      success: true,
      message: '换脸成功',
      resultUrl: generateResultUrl(resultPath),
    });
  } catch (error) {
    console.error('Face swap error:', error);
    res.status(500).json({ 
      success: false,
      error: '换脸处理失败',
      message: (error as Error).message 
    });
  }
});

// 换脸 API 端点（使用固定的源图片）
app.post('/api/swap-face-target', upload.single('targetImage'), async (req, res) => {
  try {
    // 检查是否收到目标图片文件
    if (!req.file) {
      return res.status(400).json({ 
        error: '请提供目标图像文件' 
      });
    }

    // 使用固定的源图片路径
    const sourceImagePath = path.join(__dirname, './asset/face.png');
    const targetImagePath = req.file.path;

    console.log(`Processing face swap with fixed source: target=${targetImagePath}`);

    // 检查源图片是否存在
    if (!fs.existsSync(sourceImagePath)) {
      return res.status(500).json({ 
        success: false,
        error: '系统错误',
        message: '源图像文件不存在，请联系管理员' 
      });
    }

    // 调用 FaceFusion 进行换脸处理
    const resultPath = await faceSwap(sourceImagePath, targetImagePath);

    // 返回结果
    res.json({
      success: true,
      message: '换脸成功',
      resultUrl: generateResultUrl(resultPath),
    });
  } catch (error) {
    console.error('Face swap error:', error);
    res.status(500).json({ 
      success: false,
      error: '换脸处理失败',
      message: (error as Error).message 
    });
  }
});



// 启动服务器
app.listen(Number(PORT), HOST, async () => {
  console.log(`==================================================`);
  console.log(`🚀 人脸交换服务启动成功!`);
  console.log(`📡 服务器地址: ${PROTOCOL}://${HOST}:${PORT}`);
  console.log(`📁 上传目录: ${path.resolve(directoryConfig.uploadsDir)}`);
  console.log(`📊 结果目录: ${path.resolve(directoryConfig.resultsDir)}`);
  console.log(`⏱️  当前时间: ${new Date().toLocaleString()}`);
  console.log(`==================================================`);
  
  // 启动时检查 FaceFusion 可用性
  try {
    const isAvailable = await testFaceFusion();
    if (isAvailable) {
      console.log('✓ FaceFusion is available and ready to use');
    } else {
      console.warn('⚠ FaceFusion is not available. Please check the installation.');
    }
  } catch (error) {
    console.error('Error testing FaceFusion availability:', error);
  }
});

function readFileAsBase64(resultPath: string) {
    const fileBuffer = fs.readFileSync(resultPath);
    return fileBuffer.toString('base64');
}