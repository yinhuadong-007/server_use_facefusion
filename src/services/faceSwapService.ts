import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { faceFusionConfig } from '../config';

const execPromise = util.promisify(exec);

/**
 * 调用 FaceFusion 进行换脸处理
 * @param sourceImagePath 源图像路径（提供脸部）
 * @param targetImagePath 目标图像路径（被换脸的图像）
 * @returns 处理后的图像路径
 */
export async function faceSwap(sourceImagePath: string, targetImagePath: string): Promise<string> {
  try {
    // 生成唯一的输出文件名，保持与目标文件相同的扩展名
    const timestamp = new Date().getTime();
    const targetExt = path.extname(targetImagePath); // 获取目标文件的扩展名
    const outputFileName = `result-${timestamp}${targetExt}`; // 使用相同的扩展名
    const outputPath = path.join(process.cwd(), 'results', outputFileName);
    
    // FaceFusion 安装路径
    const faceFusionPath = faceFusionConfig.installationPath;
    const pythonExecutable = 'python';
    
    // 先检查 FaceFusion 路径是否存在
    if (!fs.existsSync(faceFusionPath)) {
      throw new Error(`FaceFusion not found at path: ${faceFusionPath}`);
    }
    
    // 检查源图像和目标图像是否存在
    if (!fs.existsSync(sourceImagePath)) {
      throw new Error(`Source image not found: ${sourceImagePath}`);
    }
    
    if (!fs.existsSync(targetImagePath)) {
      throw new Error(`Target image not found: ${targetImagePath}`);
    }
    
    // 构建命令 - 使用正确的 FaceFusion 参数
    // 使用headless-run命令避免UI加载错误，并使用绝对路径确保文件可访问
    // 指定具体的输出文件名而不是仅指定目录
    // 指定使用 inswapper_128_fp16 模型
      const command = `${pythonExecutable} "${faceFusionConfig.scriptPath}" headless-run --source "${path.resolve(sourceImagePath)}" --target "${path.resolve(targetImagePath)}" -o "${path.resolve(outputPath)}" --output-image-quality ${faceFusionConfig.outputImageQuality} --face-swapper-model ${faceFusionConfig.defaultModel}`;
    // --face-swapper-model inswapper_128_fp16`;
    
    console.log('Executing FaceFusion command:', command);
    
    // 执行命令
    const { stdout, stderr } = await execPromise(command, { 
      cwd: faceFusionPath,
      timeout: faceFusionConfig.commandTimeout // 使用配置的超时时间
    });
    
    console.log('FaceFusion stdout:', stdout);
    
    if (stderr) {
      console.warn('FaceFusion stderr:', stderr);
    }
    
    // 等待一段时间确保文件写入完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 检查输出文件是否存在
    if (!fs.existsSync(outputPath)) {
      // 尝试其他可能的输出路径
      const altOutputPath1 = path.join(path.dirname(outputPath), path.basename(targetImagePath));
      const altOutputPath2 = path.join(faceFusionPath, 'output', outputFileName);
      
      if (fs.existsSync(altOutputPath1)) {
        // 将文件复制到我们的结果目录
        fs.copyFileSync(altOutputPath1, outputPath);
      } else if (fs.existsSync(altOutputPath2)) {
        // 将文件移动到我们的结果目录
        fs.renameSync(altOutputPath2, outputPath);
      } else {
        throw new Error(`FaceFusion processing completed but output file not found at expected locations. Stderr: ${stderr || 'None'}`);
      }
    }
    
    return outputPath;
  } catch (error: any) {
    console.error('FaceSwap service error:', error);
    
    // 如果是超时错误
    if (error.code === 'ETIMEDOUT') {
      throw new Error('FaceFusion processing timed out');
    }
    
    // 如果是缺少依赖错误
    if (error.stderr && error.stderr.includes('ModuleNotFoundError')) {
      throw new Error('FaceFusion dependencies are not installed. Please check the FaceFusion installation and ensure all Python dependencies are installed.');
    }
    
    // 如果是命令执行错误
    if (error.stderr) {
      throw new Error(`FaceFusion execution failed: ${error.stderr}`);
    }
    
    throw new Error(`FaceSwap service error: ${error.message}`);
  }
}

/**
 * 测试 FaceFusion 是否可用
 */
export async function testFaceFusion(): Promise<boolean> {
  try {
    const faceFusionPath = faceFusionConfig.installationPath;
    const pythonExecutable = 'python';
    
    // 检查 FaceFusion 路径是否存在
    if (!fs.existsSync(faceFusionPath)) {
      console.error('FaceFusion path does not exist:', faceFusionPath);
      return false;
    }
    
    // 检查 facefusion.py 文件是否存在
    const faceFusionScript = faceFusionConfig.scriptPath;
    if (!fs.existsSync(faceFusionScript)) {
      console.error('FaceFusion script not found:', faceFusionScript);
      return false;
    }
    
    const command = `${pythonExecutable} "${faceFusionScript}" run --help`;
    console.log('Executing FaceFusion test command:', command);
    
    const { stdout, stderr } = await execPromise(command, { 
      cwd: faceFusionPath,
      timeout: Math.min(faceFusionConfig.commandTimeout, 30000) // 使用配置的超时时间，但不超过30秒
    });
    
    console.log('FaceFusion test stdout:', stdout);
    console.log('FaceFusion test stderr:', stderr);
    
    // 检查stdout或stderr中是否包含任何内容，表示命令成功执行
    const isAvailable = (stdout && stdout.length > 0) || (stderr && stderr.length > 0);
    console.log('FaceFusion availability result:', isAvailable);
    return !!isAvailable;
  } catch (error: any) {
    console.error('FaceFusion test failed with error:', error);
    
    // 如果是缺少依赖错误
    if (error.stderr && error.stderr.includes('ModuleNotFoundError')) {
      console.error('FaceFusion dependencies are not installed. Please check the FaceFusion installation and ensure all Python dependencies are installed.');
    }
    
    if (error.stderr) {
      console.error('Test stderr:', error.stderr);
    }
    
    if (error.stdout) {
      console.error('Test stdout:', error.stdout);
    }
    
    return false;
  }
}