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

// 需要上传的文件列表
const filesToUpload = [
  {
    localPath: 'CHANGELOG_2026-05-31.md',
    ossPath: 'documents/CHANGELOG_2026-05-31.md'
  },
  {
    localPath: 'DEPLOYMENT.md',
    ossPath: 'documents/DEPLOYMENT.md'
  },
  {
    localPath: 'DEPLOYMENT_CHECKLIST.md',
    ossPath: 'documents/DEPLOYMENT_CHECKLIST.md'
  },
  {
    localPath: 'README.md',
    ossPath: 'documents/README.md'
  }
];

async function uploadAllFiles() {
  console.log('=== 开始批量上传文件到阿里云 OSS ===\n');
  console.log('🔧 环境变量配置:');
  console.log('   OSS_REGION:', process.env.OSS_REGION);
  console.log('   OSS_BUCKET:', process.env.OSS_BUCKET);
  console.log('   OSS_ACCESS_KEY_ID:', process.env.OSS_ACCESS_KEY_ID?.substring(0, 10) + '...');
  console.log('\n📋 需要上传的文件:');
  
  // 检查本地文件
  const validFiles = [];
  for (const file of filesToUpload) {
    const fullLocalPath = path.join(process.cwd(), file.localPath);
    if (fs.existsSync(fullLocalPath)) {
      const stats = fs.statSync(fullLocalPath);
      console.log(`   ✓ ${file.localPath} (${(stats.size / 1024).toFixed(2)} KB)`);
      validFiles.push({ ...file, fullPath: fullLocalPath, size: stats.size });
    } else {
      console.log(`   ✗ ${file.localPath} (不存在)`);
    }
  }
  
  console.log(`\n📊 总计: ${validFiles.length} 个文件\n`);

  if (validFiles.length === 0) {
    console.log('❌ 没有可以上传的文件');
    return false;
  }

  try {
    console.log('🔧 初始化 OSS 客户端...');
    const client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET || 'zenbazi-storage'
    });
    console.log('✅ OSS 客户端初始化成功\n');

    // 逐个上传文件
    let successCount = 0;
    const uploadedFiles = [];

    for (const file of validFiles) {
      try {
        console.log(`⬆️  正在上传: ${file.localPath}...`);
        
        const fileContent = fs.readFileSync(file.fullPath);
        const result = await client.put(file.ossPath, fileContent);
        
        console.log(`   ✅ 上传成功! OSS URL: ${result.url}`);
        uploadedFiles.push({
          local: file.localPath,
          oss: file.ossPath,
          url: result.url,
          size: file.size
        });
        successCount++;
        
      } catch (uploadError) {
        console.log(`   ❌ 上传失败: ${uploadError.message}`);
      }
    }

    console.log(`\n=== 🎉 上传完成 ===`);
    console.log(`✅ 成功: ${successCount}/${validFiles.length} 个文件\n`);
    
    if (uploadedFiles.length > 0) {
      console.log('📋 上传文件列表:');
      console.log('┌' + '─'.repeat(60) + '┐');
      console.log('│ 文件 │ 大小 │ OSS URL │');
      console.log('├' + '─'.repeat(60) + '┤');
      
      for (const file of uploadedFiles) {
        const sizeKB = (file.size / 1024).toFixed(2);
        console.log(`│ ${file.local.padEnd(25)} │ ${sizeKB.padStart(7)} KB │ ${file.url} │`);
      }
      
      console.log('└' + '─'.repeat(60) + '┘\n');
    }

    return successCount === validFiles.length;
    
  } catch (error) {
    console.error('\n❌ 上传失败!');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误名称:', error.name);
    
    return false;
  }
}

uploadAllFiles()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('未预期的错误:', err);
    process.exit(1);
  });
