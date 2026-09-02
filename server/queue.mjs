import crypto from 'node:crypto';

let redisModulePromise = null;

async function loadRedisModule() {
  if (!redisModulePromise) {
    redisModulePromise = import('ioredis');
  }
  return redisModulePromise;
}

class LocalQueueDriver {
  constructor() {
    this.jobs = new Map();
    this.queue = [];
    this.running = false;
  }

  async enqueue(job) {
    const record = { ...job, status: 'queued', createdAt: Date.now() };
    this.jobs.set(job.id, record);
    this.queue.push(job.id);
    return record;
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async updateJob(jobId, patch) {
    const current = this.jobs.get(jobId);
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: Date.now() };
    this.jobs.set(jobId, next);
    return next;
  }

  async start(processor, onUpdate) {
    if (this.running) return;
    this.running = true;

    const loop = async () => {
      while (this.queue.length) {
        const jobId = this.queue.shift();
        let job = await this.updateJob(jobId, { status: 'processing' });
        onUpdate(jobId, { status: 'processing', bufferZone: job?.bufferZone });
        try {
          const result = await processor(job);
          job = await this.updateJob(jobId, { status: 'completed', result });
          onUpdate(jobId, { status: 'completed', result, bufferZone: job?.bufferZone });
        } catch (error) {
          job = await this.updateJob(jobId, { status: 'failed', error: error.message });
          onUpdate(jobId, { status: 'failed', error: error.message, bufferZone: job?.bufferZone });
        }
      }
      this.running = false;
    };

    loop().catch(() => {
      this.running = false;
    });
  }
}

class RedisQueueDriver {
  constructor(url, queueName = 'zenbazi') {
    this.queueName = queueName;
    this.url = url;
    this.redis = null;
    this.worker = null;
    this.running = false;
  }

  jobKey(jobId) {
    return `${this.queueName}:job:${jobId}`;
  }

  queueKey() {
    return `${this.queueName}:fifo`;
  }

  async connect() {
    if (!this.redis || !this.worker) {
      const module = await loadRedisModule();
      const Redis = module.default;
      this.redis = new Redis(this.url, { lazyConnect: true, maxRetriesPerRequest: null });
      this.worker = new Redis(this.url, { lazyConnect: true, maxRetriesPerRequest: null });
    }
    if (this.redis.status !== 'ready') await this.redis.connect();
    if (this.worker.status !== 'ready') await this.worker.connect();
  }

  async enqueue(job) {
    await this.connect();
    const record = { ...job, status: 'queued', createdAt: Date.now() };
    await this.redis.set(this.jobKey(job.id), JSON.stringify(record));
    await this.redis.rpush(this.queueKey(), job.id);
    return record;
  }

  async getJob(jobId) {
    await this.connect();
    const raw = await this.redis.get(this.jobKey(jobId));
    return raw ? JSON.parse(raw) : null;
  }

  async updateJob(jobId, patch) {
    const current = await this.getJob(jobId);
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: Date.now() };
    await this.redis.set(this.jobKey(jobId), JSON.stringify(next));
    return next;
  }

  async start(processor, onUpdate) {
    if (this.running) return;
    this.running = true;
    await this.connect();

    const loop = async () => {
      while (true) {
        const result = await this.worker.blpop(this.queueKey(), 0);
        const jobId = result?.[1];
        if (!jobId) continue;
        let job = await this.updateJob(jobId, { status: 'processing' });
        onUpdate(jobId, { status: 'processing', bufferZone: job?.bufferZone });
        try {
          const payload = await this.getJob(jobId);
          const outcome = await processor(payload);
          job = await this.updateJob(jobId, { status: 'completed', result: outcome });
          onUpdate(jobId, { status: 'completed', result: outcome, bufferZone: job?.bufferZone });
        } catch (error) {
          job = await this.updateJob(jobId, { status: 'failed', error: error.message });
          onUpdate(jobId, { status: 'failed', error: error.message, bufferZone: job?.bufferZone });
        }
      }
    };

    loop().catch(() => {
      this.running = false;
    });
  }
}

export function createQueueDriver() {
  if (process.env.REDIS_URL) {
    return new RedisQueueDriver(process.env.REDIS_URL, process.env.REDIS_QUEUE_NAME || 'zenbazi');
  }
  return new LocalQueueDriver();
}

export function createJobRecord(type, payload, meta = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    ...meta
  };
}
