import { ModelRuntime } from '@earendil-works/pi-coding-agent';

const providerId = 'smart-bookmark';
const endpoints = {
  openai: { api: 'openai-responses', baseUrl: 'https://api.openai.com/v1' },
  anthropic: { api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com' },
};

export async function createAgentModel(profile) {
  const { api, baseUrl } = endpoints[profile.provider] ?? {
    api: 'openai-completions', baseUrl: profile.baseUrl,
  };
  // Loopback servers may ignore the Authorization header. Use a literal
  // placeholder so the SDK never searches the environment for credentials.
  const credential = { type: 'api_key', key: profile.apiKey || 'smart-bookmark-local' };
  const modelRuntime = await ModelRuntime.create({
    modelsPath: null,
    refreshOnCreate: false,
    credentials: {
      read: async id => id === providerId ? credential : undefined,
      list: async () => [{ providerId, type: 'api_key' }],
      modify: async () => { throw new Error('请在 Smart Bookmark 设置中管理凭据'); },
      delete: async () => { throw new Error('请在 Smart Bookmark 设置中管理凭据'); },
    },
  });
  modelRuntime.registerProvider(providerId, {
    api, baseUrl,
    models: [{
      id: profile.modelId, name: profile.modelId, reasoning: false, input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 32000, maxTokens: 4096,
    }],
  });
  const model = modelRuntime.getModel(providerId, profile.modelId);
  if (!model) throw new Error('无法加载所选模型，请检查模型 ID');
  return { modelRuntime, model };
}

export async function testAgentModel(profile) {
  if (!profile.apiKey && !['localhost', '127.0.0.1', '[::1]'].includes(URL.parse(profile.baseUrl)?.hostname)) {
    throw new Error('请输入 API Key');
  }
  const { modelRuntime, model } = await createAgentModel(profile);
  const signal = AbortSignal.timeout(20000);
  let response;
  try {
    response = await modelRuntime.streamSimple(model, {
      systemPrompt: 'This is a connection test. Follow the user instruction exactly.',
      messages: [{
        role: 'user', content: 'Call the bash tool with command "bookmark find {}" and no other command.',
        timestamp: Date.now(),
      }],
      tools: [{
        name: 'bash', description: 'Synthetic bookmark command. This tool is evaluated, not executed.',
        parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
      }],
    }, { signal, maxTokens: 256 }).result();
  } catch (error) {
    throw new Error(connectionError(error, signal));
  }
  if (response.stopReason === 'error' || response.stopReason === 'aborted') {
    throw new Error(connectionError(response.errorMessage, signal));
  }
  if (!response.content.some(part => part.type === 'toolCall' && part.name === 'bash' &&
      /^bookmark find\s+\{\s*\}$/.test(part.arguments?.command?.trim?.() ?? ''))) {
    throw new Error('模型已响应，但未能完成工具调用测试。请选择支持工具调用的模型。');
  }
}

function connectionError(error, signal) {
  const message = String(error ?? '');
  if (signal.aborted || /timeout|timed out/i.test(message)) return '连接超时，请检查网络或 Base URL';
  if (/\b(401|403)\b|unauthori[sz]ed|invalid.*api.?key|authentication/i.test(message)) {
    return '认证失败，请检查 API Key 和模型访问权限';
  }
  if (/\b404\b|model.*not found/i.test(message)) return '找不到模型或接口，请检查模型 ID 和服务地址';
  if (/\b429\b|rate.limit/i.test(message)) return '服务限流或额度不足，请检查提供商配额';
  if (/tool.*(support|invalid)|function.call/i.test(message)) return '该模型或服务不支持所需的工具调用';
  return '模型连接失败，请检查网络、模型 ID 或 Base URL';
}
