import './server/loadEnv.mjs';
import OSS from 'ali-oss';

async function testOssConnection() {
  console.log('=== 开始测试阿里云 OSS 连接 ===');
  console.log('Region:', process.env.OSS_REGION);
  console.log('Bucket:', process.env.OSS_BUCKET);
  console.log('AccessKey ID:', process.env.OSS_ACCESS_KEY_ID?.substring(0, 10) + '...');
  console.log();

  try {
    const client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET
    });

    console.log('✓ OSS 客户端初始化成功');
    console.log();

    console.log('1. 测试列出 Bucket 中的对象...');
    const result = await client.list({ 'max-keys': 5 });
    console.log('✓ 连接成功！');
    if (result.objects && result.objects.length > 0) {
      console.log('  找到', result.objects.length, '个对象:');
      result.objects.forEach(obj => {
        console.log('  -', obj.name, `(${obj.size} bytes)`);
      });
    } else {
      console.log('  Bucket 为空或没有权限列出对象');
    }
    console.log();

    console.log('2. 测试写入测试文件...');
    const testContent = `测试内容 - ${new Date().toISOString()}`;
    const testKey = 'test/connection-test.txt';
    await client.put(testKey, Buffer.from(testContent));
    console.log('✓ 写入成功:', testKey);
    console.log();

    console.log('3. 测试读取测试文件...');
    const getResult = await client.get(testKey);
    console.log('✓ 读取成功，内容:', getResult.content.toString().trim());
    console.log();

    console.log('4. 测试删除测试文件...');
    await client.delete(testKey);
    console.log('✓ 删除成功');
    console.log();

    console.log('=== 阿里云 OSS 连接测试全部通过！ ===');
    return true;

  } catch (error) {
    console.error('✗ 错误:', error.message);
    if (error.name === 'AccessDenied') {
      console.error('  提示: 请检查 AccessKey 是否有 Bucket 的读写权限');
    } else if (error.name === 'NoSuchBucket') {
      console.error('  提示: Bucket 不存在，请先在阿里云控制台创建');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('  提示: AccessKey ID 无效，请检查是否正确');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('  提示: AccessKey Secret 无效，请检查是否正确');
    }
    console.error('完整错误:', error);
    return false;
  }
}

testOssConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('未预期的错误:', err);
    process.exit(1);
  });
