const API_ROOT = '';

const DEFAULT_JOB_ERRORS = {
  chart: 'Chart request failed.',
  report: 'Report request failed.',
  translate: 'Translation request failed.',
  feedback: 'Feedback request failed.',
  payment: 'Payment request failed.'
};

async function parseResponseBody(response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const preview = raw.slice(0, 160).trim();
    throw new Error(preview || 'Server returned an invalid response.');
  }
}

async function fetchJob(jobId) {
  const response = await fetch(`${API_ROOT}/api/jobs/${jobId}`);
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Job lookup failed');
  }
  if (!data) {
    throw new Error('Job lookup returned an empty response.');
  }
  return data;
}

export async function createJob(type, payload) {
  let response;
  try {
    response = await fetch(`${API_ROOT}/api/jobs/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('云端排盘服务未启动，请先运行 npm run server。');
  }
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data?.error || DEFAULT_JOB_ERRORS[type] || 'Request failed.');
  }
  if (!data) {
    throw new Error('云端排盘服务返回了空响应，请检查服务端日志。');
  }
  return data;
}

export function waitForJob(jobId) {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    let settled = false;
    let pollStarted = false;

    const startPollFallback = () => {
      if (settled || pollStarted) return;
      pollStarted = true;
      pollFallback();
    };

    const pollFallback = async () => {
      try {
        while (!settled) {
          const data = await fetchJob(jobId);
          if (data.status === 'completed') {
            settled = true;
            resolve(data.result);
            return;
          }
          if (data.status === 'failed') {
            settled = true;
            reject(new Error(data.error || 'Job failed'));
            return;
          }
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 800));
        }
      } catch (error) {
        if (!settled) {
          settled = true;
          reject(error);
        }
      }
    };

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'subscribe', jobId }));
    });

    socket.addEventListener('message', (event) => {
      if (settled) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.jobId !== jobId) return;
      if (data.status === 'completed') {
        settled = true;
        socket.close();
        resolve(data.result);
      }
      if (data.status === 'failed') {
        settled = true;
        socket.close();
        reject(new Error(data.error || 'Job failed'));
      }
    });

    socket.addEventListener('error', () => {
      socket.close();
      startPollFallback();
    });

    socket.addEventListener('close', () => {
      startPollFallback();
    });
  });
}

export async function runOptionalJob(type, payload, options = {}) {
  const { logLabel = `${type} job` } = options;
  try {
    const job = await createJob(type, payload);
    return await waitForJob(job.jobId);
  } catch (error) {
    console.warn(`${logLabel} failed. Falling back to local content.`, error);
    return null;
  }
}
