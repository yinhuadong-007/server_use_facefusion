import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { faceSwap, testFaceFusion } from './services/faceSwapService';

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
    fileSize: 100 * 1024 * 1024, // 文件最大大小 (100MB)
    files: 2 // 最大文件数量
  }
});

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 9001;

// 中间件
app.use(cors());
app.use(express.json());
// 使用绝对路径确保静态文件服务正常工作
const publicPath = path.join(__dirname, '../public');
const resultsPath = path.join(__dirname, '../results');
console.log('Public path:', publicPath);
console.log('Results path:', resultsPath);
app.use(express.static(publicPath));
app.use('/results', express.static(resultsPath));

// 确保上传和结果目录存在
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('results')) {
  fs.mkdirSync('results');
}

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ message: 'FaceSwap Server is running!' });
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
      resultUrl: `results/${path.basename(resultPath)}`,
      base64: await readFileAsBase64(resultPath)
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

// 换脸 API 端点（使用上传的图片）
app.post('/api/swap-face-target', upload.fields([
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        // 检查是否收到两个图片文件
        if (!req.files ||
            !('image' in req.files) ||
            (req.files as { [fieldname: string]: Express.Multer.File[] })['image'].length === 0) {
            return res.status(400).json({
                error: '请提供目标图像文件'
            });
        }

        const sourceImagePath = path.join(__dirname, 'src/asset/face.png');
        const targetImagePath = (req.files as { [fieldname: string]: Express.Multer.File[] })['targetImage'][0].path;

        console.log(`Processing face swap: source=${sourceImagePath}, target=${targetImagePath}`);

        // 调用 FaceFusion 进行换脸处理
        const resultPath = await faceSwap(sourceImagePath, targetImagePath);

        // 返回结果
        res.json({
            success: true,
            message: '换脸成功',
            resultUrl: `results/${path.basename(resultPath)}`,
            base64: await readFileAsBase64(resultPath)
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
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
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
