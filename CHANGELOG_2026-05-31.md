# ZenBazi 项目修改日志
**日期**: 2026-05-31
**项目**: 时空代码 - 八字分析应用

---

## 一、阿里云 OSS 云存储集成

### 修改文件
- `server/storage.mjs`
- `.env.local`

### 修改内容

#### 1. 添加阿里云 OSS 存储适配器
在 `server/storage.mjs` 中新增 `OssEncryptedStorage` 类，支持阿里云对象存储：

```javascript
class OssEncryptedStorage {
  constructor() {
    this.bucket = process.env.OSS_BUCKET;
    this.prefix = process.env.OSS_PREFIX || 'zenbazi-secure';
    this.client = null;
  }
  
  // 实现 exists, getBuffer, putBuffer, getText, putText 方法
}
```

#### 2. 环境变量配置
在 `.env.local` 中添加阿里云 OSS 配置：

```env
STORAGE_DRIVER=local
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=zenbazi-storage
OSS_PREFIX=zenbazi-secure
OSS_ACCESS_KEY_ID=your-alibaba-cloud-access-key-id
OSS_ACCESS_KEY_SECRET=your-alibaba-cloud-access-key-secret
```

#### 3. 增强的错误处理
- 添加配置验证
- 添加失败自动回退机制（如果OSS连接失败，自动回退到本地存储）
- 增加详细的日志输出

---

## 二、八字分析个性化优化

### 修改文件
- `src/utils/ai.js`

### 修改内容

#### 1. 多版本性格描述
为每种五行（日主）+ 状态组合创建了3个不同的描述版本：

```javascript
const PERSONALITY_VARIATIONS = {
  木: {
    旺: [
      '木气当令，心性仁厚而主动，判断快，但容易把原则顶得过硬...',
      '木得春令，直上直下，为人有风骨，但说话易太直...',
      '木旺则直，心地光明，有理想感，但易忽略现实细节...'
    ],
    衰: [...],
    休: [...],
    囚: [...],
    死: [...]
  },
  火: {...},
  土: {...},
  金: {...},
  水: {...}
}
```

#### 2. 唯一种子生成
添加 `getUniqueSeedFromBazi()` 函数，根据八字+姓名生成唯一哈希值：

```javascript
function getUniqueSeedFromBazi(pillars, name = '') {
  const pillarChars = pillars.map(getPillarChar).join('') + name;
  let hash = 0;
  for (let i = 0; i < pillarChars.length; i++) {
    const char = pillarChars.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

#### 3. 个性化文本选择
添加 `selectPersonalizedText()` 函数，使用种子值选择不同的描述版本：

```javascript
function selectPersonalizedText(element, state, seed, lang = 'zh-CN') {
  const variations = PERSONALITY_VARIATIONS[element]?.[state];
  if (!variations || !variations.length) {
    return PERSONALITY_BASE[element]?.[state];
  }
  const index = seed % variations.length;
  return variations[index];
}
```

#### 4. 增强的 AI Prompt
在 `buildPrompt()` 函数中添加个性化要求：

- 加入了强烈的个性化提示
- 加入了独特种子值确保每次生成不同
- 要求避免模板化语言
- 要求每一句话都像是专门为这个人写的

---

## 三、付款系统优化

### 修改文件
- `src/utils/translations.js`
- `src/App.jsx`

### 修改内容

#### 1. 统一价格显示
- **国内用户**: 人民币 ¥98
- **国际用户**: USD $38 / EUR €38 / GBP £28
- 删除了原有的混合价格显示

#### 2. 地区自动检测
添加基于浏览器语言和时区的地区检测逻辑：

```javascript
const detectUserRegion = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const isChinaTimezone = timezone.includes('Asia/Shanghai') || 
                            timezone.includes('Asia/Beijing') || 
                            timezone.includes('Asia/Chongqing');
    const isChineseLanguage = language.startsWith('zh');
    
    return !(isChinaTimezone || isChineseLanguage);
  } catch {
    return lang === 'en';
  }
}
```

#### 3. 虚拟二维码
添加测试用虚拟二维码显示区域：

- 使用 SVG 生成具有品牌配色的二维码图案
- 包含中文和英文提示文字
- 标注为测试用途

```jsx
<div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
  <svg viewBox="0 0 100 100">
    {/* 定位图案 */}
    <rect x="5" y="5" width="20" height="20" fill="#B22222" />
    <rect x="75" y="5" width="20" height="20" fill="#B22222" />
    <rect x="5" y="75" width="20" height="20" fill="#B22222" />
    {/* 数据块 */}
    {/* ... */}
  </svg>
</div>
```

---

## 四、存储适配器优化

### 修改文件
- `server/storage.mjs`

### 修改内容

#### 1. 智能回退机制
```javascript
export function createStorage(rootDir) {
  try {
    if (process.env.STORAGE_DRIVER === 'oss' && 
        process.env.OSS_BUCKET && 
        process.env.OSS_ACCESS_KEY_ID && 
        process.env.OSS_ACCESS_KEY_SECRET) {
      console.log('🪣 尝试使用阿里云 OSS 存储');
      return new OssEncryptedStorage();
    }
    // ... S3 配置检查
  } catch (error) {
    console.warn('⚠️  云存储配置失败，回退到本地存储:', error.message);
  }
  console.log('💾 使用本地存储');
  return new LocalEncryptedStorage(rootDir);
}
```

#### 2. 详细的日志输出
- OSS 初始化日志
- 连接状态确认
- 操作失败警告

---

## 五、配置状态

### 当前存储模式
- **开发环境**: 本地存储 (STORAGE_DRIVER=local)
- **生产环境**: 可配置为阿里云 OSS 或 S3

### 待完成
- [ ] 在阿里云控制台创建 OSS Bucket
- [ ] 验证 AccessKey 权限
- [ ] 部署到云服务器
- [ ] 配置域名 `http://yuandestiny.com/`

---

## 六、构建与测试

### 构建命令
```bash
npm run build
```

### 测试命令
```bash
# 后端服务
npm run server

# 前端开发
npm run dev

# 测试 OSS 连接
node test-oss-connection.mjs
```

### 构建结果
✅ 构建成功，无错误
- 前端资源已优化
- 所有模块正确转换
- 生成生产环境文件

---

## 七、访问地址

### 本地访问
- 前端: http://localhost:5173/
- 后端 API: http://localhost:8787

### 云端访问
- 需配置: http://yuandestiny.com/

---

**文档生成时间**: 2026-05-31
**版本**: v1.0.0
