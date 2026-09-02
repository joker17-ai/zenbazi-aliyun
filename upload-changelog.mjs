import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';

// 手动加载 OSS 环境变量
const envPath = path.join(process.cwd(), '.env.oss');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

async function uploadToOSS() {
  console.log('=== 开始上传文档到阿里云 OSS ===\n');
  console.log('🔧 环境变量配置:');
  console.log('   OSS_REGION:', process.env.OSS_REGION);
  console.log('   OSS_BUCKET:', process.env.OSS_BUCKET);
  console.log('   OSS_ACCESS_KEY_ID:', process.env.OSS_ACCESS_KEY_ID?.substring(0, 10) + '...');
  console.log();
  
  const localFile = path.join(process.cwd(), 'CHANGELOG_2026-05-31.md');
  const ossKey = `${process.env.OSS_PREFIX || 'documents'}/CHANGELOG_2026-05-31.md`;
  
  console.log('📁 本地文件:', localFile);
  console.log('☁️  OSS 路径:', ossKey);
  console.log();
  
  // 检查本地文件是否存在
  if (!fs.existsSync(localFile)) {
    console.error('❌ 本地文件不存在!');
    process.exit(1);
  }
  
  console.log('✅ 本地文件存在');
  console.log('📊 文件大小:', fs.statSync(localFile).size, 'bytes');
  console.log();
  
  try {
    console.log('🔧 初始化 OSS 客户端...');
    const client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET || 'zenbazi-storage'
    });
    console.log('✅ OSS 客户端初始化成功\n');
    
    // 读取文件内容
    const fileContent = fs.readFileSync(localFile);
    console.log('📖 读取文件内容完成');
    console.log('📝 文件内容长度:', fileContent.length, 'bytes\n');
    
    // 上传文件
    console.log('⬆️  开始上传到 OSS...');
    const result = await client.put(ossKey, fileContent);
    console.log('✅ 上传成功!');
    console.log('📍 OSS URL:', result.url);
    console.log();
    
    // 验证上传
    console.log('🔍 验证上传结果...');
    const headResult = await client.head(ossKey);
    console.log('✅ 验证成功!');
    console.log('📊 文件大小:', headResult.contentLength, 'bytes');
    console.log('📅 最后修改:', headResult.lastModified);
    console.log();
    
    console.log('=== 🎉 文档上传完成！ ===');
    console.log('\n📋 文档信息:');
    console.log('  - 本地路径:', localFile);
    console.log('  - OSS 路径:', ossKey);
    console.log('  - OSS URL:', result.url);
    console.log('\n💡 您可以通过浏览器访问 OSS URL 查看文档');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ 上传失败!');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误名称:', error.name);
    console.error();
    
    if (error.code === 'NoSuchBucket') {
      console.error('💡 提示: Bucket 不存在，请先在阿里云控制台创建');
      console.error('   1. 登录阿里云 OSS 控制台: https://oss.console.aliyun.com/');
      console.error('   2. 创建一个新的 Bucket');
      console.error('   3. Bucket 名称设置为: zenbazi-storage');
      console.error('   4. 选择地域: 华东1（杭州）');
      console.error('   5. 重试此脚本');
    } else if (error.code === 'AccessDenied') {
      console.error('💡 提示: AccessKey 权限不足');
      console.error('   请检查 AccessKey 是否有该 Bucket 的读写权限');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.error('💡 提示: AccessKey ID 无效');
      console.error('   请检查环境变量 OSS_ACCESS_KEY_ID 是否正确');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('💡 提示: AccessKey Secret 无效');
      console.error('   请检查环境变量 OSS_ACCESS_KEY_SECRET 是否正确');
    }
    
    console.error('\n⚠️  文档已保存在本地，您可以稍后手动上传到 OSS');
    
    return false;
  }
}

uploadToOSS()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('未预期的错误:', err);
    process.exit(1);
  });
