import path from 'node:path';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';

let s3SdkPromise = null;
let ossClient = null;

async function loadS3Sdk() {
  if (!s3SdkPromise) {
    s3SdkPromise = import('@aws-sdk/client-s3');
  }
  return s3SdkPromise;
}

async function loadOssSdk() {
  if (!ossClient) {
    const OSS = (await import('ali-oss')).default;
    ossClient = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET
    });
  }
  return ossClient;
}

function toBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

class LocalEncryptedStorage {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  async ensure() {
    await mkdir(this.rootDir, { recursive: true });
  }

  resolveKey(key) {
    return path.join(this.rootDir, key);
  }

  async exists(key) {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async getBuffer(key) {
    return readFile(this.resolveKey(key));
  }

  async putBuffer(key, buffer) {
    const filePath = this.resolveKey(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async getText(key) {
    const buffer = await this.getBuffer(key);
    return buffer.toString('utf8');
  }

  async putText(key, value) {
    await this.putBuffer(key, Buffer.from(value, 'utf8'));
  }
}

class S3EncryptedStorage {
  constructor() {
    this.bucket = process.env.S3_BUCKET;
    this.prefix = process.env.S3_PREFIX || 'zenbazi-secure';
    this.client = null;
  }

  makeKey(key) {
    return `${this.prefix}/${key}`.replace(/\/+/g, '/');
  }

  async getClient() {
    if (this.client) {
      return this.client;
    }

    const { S3Client } = await loadS3Sdk();
    this.client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
          }
        : undefined
    });
    return this.client;
  }

  async ensure() {}

  async exists(key) {
    try {
      const client = await this.getClient();
      const { HeadObjectCommand } = await loadS3Sdk();
      await client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.makeKey(key)
      }));
      return true;
    } catch {
      return false;
    }
  }

  async getBuffer(key) {
    const client = await this.getClient();
    const { GetObjectCommand } = await loadS3Sdk();
    const result = await client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.makeKey(key)
    }));
    return toBuffer(result.Body);
  }

  async putBuffer(key, buffer) {
    const client = await this.getClient();
    const { PutObjectCommand } = await loadS3Sdk();
    await client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.makeKey(key),
      Body: buffer
    }));
  }

  async getText(key) {
    const buffer = await this.getBuffer(key);
    return buffer.toString('utf8');
  }

  async putText(key, value) {
    await this.putBuffer(key, Buffer.from(value, 'utf8'));
  }
}

class OssEncryptedStorage {
  constructor() {
    this.bucket = process.env.OSS_BUCKET;
    this.prefix = process.env.OSS_PREFIX || 'zenbazi-secure';
    this.client = null;
    this.initialized = false;
  }

  makeKey(key) {
    return `${this.prefix}/${key}`.replace(/\/+/g, '/');
  }

  async getClient() {
    if (this.client) {
      return this.client;
    }
    if (!this.initialized) {
      this.initialized = true;
      console.log('🔧 初始化阿里云 OSS 客户端...');
      console.log(`  Bucket: ${this.bucket}`);
      console.log(`  Region: ${process.env.OSS_REGION || 'oss-cn-hangzhou'}`);
    }
    try {
      this.client = await loadOssSdk();
      console.log('✅ 阿里云 OSS 客户端初始化成功');
      return this.client;
    } catch (error) {
      console.error('❌ 阿里云 OSS 初始化失败:', error.message);
      throw new Error(`OSS 初始化失败: ${error.message}`);
    }
  }

  async ensure() {}

  async exists(key) {
    try {
      const client = await this.getClient();
      await client.head(this.makeKey(key));
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey' || error.name === 'NoSuchKey') {
        return false;
      }
      console.warn('⚠️  OSS exists 操作失败:', error.message);
      return false;
    }
  }

  async getBuffer(key) {
    try {
      const client = await this.getClient();
      const result = await client.get(this.makeKey(key));
      return result.content;
    } catch (error) {
      console.error('❌ OSS 获取失败:', error.message);
      throw error;
    }
  }

  async putBuffer(key, buffer) {
    try {
      const client = await this.getClient();
      await client.put(this.makeKey(key), buffer);
    } catch (error) {
      console.error('❌ OSS 上传失败:', error.message);
      throw error;
    }
  }

  async getText(key) {
    const buffer = await this.getBuffer(key);
    return buffer.toString('utf8');
  }

  async putText(key, value) {
    await this.putBuffer(key, Buffer.from(value, 'utf8'));
  }

  async getSignedUrl(key, expiresIn = 604800) {
    try {
      const client = await this.getClient();
      const actualKey = this.makeKey(key);
      const url = client.signatureUrl(actualKey, {
        expires: expiresIn,
        method: 'GET'
      });
      console.log(`🔗 生成签名URL (${Math.round(expiresIn / 3600)}小时有效):`, key);
      return url;
    } catch (error) {
      console.error('❌ 生成签名URL失败:', error.message);
      throw error;
    }
  }
}

export function createStorage(rootDir) {
  try {
    const bucket = process.env.OSS_BUCKET || 'shikong-mima';
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    const region = process.env.OSS_REGION || 'oss-cn-hangzhou';
    
    if (bucket && accessKeyId && accessKeySecret) {
      console.log('🪣 尝试使用阿里云 OSS 存储');
      process.env.OSS_BUCKET = bucket;
      process.env.OSS_ACCESS_KEY_ID = accessKeyId;
      process.env.OSS_ACCESS_KEY_SECRET = accessKeySecret;
      process.env.OSS_REGION = region;
      return new OssEncryptedStorage();
    }
    if (process.env.STORAGE_DRIVER === 's3' && process.env.S3_BUCKET) {
      console.log('☁️  尝试使用 S3 存储');
      return new S3EncryptedStorage();
    }
  } catch (error) {
    console.warn('⚠️  云存储配置失败，回退到本地存储:', error.message);
  }
  console.log('💾 使用本地存储');
  return new LocalEncryptedStorage(rootDir);
}
