const storageKey = 'agentSettings';
const providers = new Set(['openai', 'anthropic', 'compatible']);
const loopbacks = new Set(['localhost', '127.0.0.1', '[::1]']);

function isLoopback(baseUrl) {
  return loopbacks.has(URL.parse(baseUrl)?.hostname);
}

function normalize(input) {
  const { provider, modelId, baseUrl } = input ?? {};
  if (!providers.has(provider)) throw new Error('请选择模型提供商');
  if (typeof modelId !== 'string' || !modelId.trim() || modelId.length > 200) {
    throw new Error('请输入有效的模型 ID');
  }
  let endpoint = '';
  if (provider === 'compatible') {
    const url = typeof baseUrl === 'string' && URL.parse(baseUrl.trim());
    if (!url || url.username || url.password || url.search || url.hash) {
      throw new Error('请输入不含凭据、查询参数和片段的有效 Base URL');
    }
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback(url.href))) {
      throw new Error('远程 Base URL 必须使用 HTTPS，本机服务可以使用 HTTP');
    }
    endpoint = url.href.replace(/\/+$/, '');
  }
  return { provider, modelId: modelId.trim(), baseUrl: endpoint };
}

function sameEndpoint(current, next) {
  return current?.provider === next.provider && current?.baseUrl === next.baseUrl;
}

export class AgentSettings {
  constructor(library, storage) {
    this.library = library;
    this.storage = storage;
  }

  read() {
    const saved = this.library.setting(storageKey);
    return saved ? JSON.parse(saved) : null;
  }

  status() {
    const saved = this.read();
    if (!saved) return { provider: 'openai', modelId: '', baseUrl: '', hasKey: false, ready: false };
    const { encryptedKey, ...profile } = saved;
    return { ...profile, hasKey: Boolean(encryptedKey), ready: Boolean(encryptedKey) || isLoopback(profile.baseUrl) };
  }

  resolve(input) {
    const saved = this.read();
    const profile = normalize(input ?? saved);
    const { apiKey, clearKey } = input ?? {};
    if (apiKey !== undefined && (typeof apiKey !== 'string' || apiKey.length > 8192 || /[\r\n]/.test(apiKey))) {
      throw new Error('请输入有效的 API Key');
    }
    const replacement = apiKey?.trim();
    const encryptedKey = !clearKey && !replacement && sameEndpoint(saved, profile) ? saved.encryptedKey : '';
    let key = clearKey ? '' : replacement ?? '';
    if (encryptedKey) {
      try {
        key = this.storage.decryptString(Buffer.from(encryptedKey, 'base64'));
      } catch {
        throw new Error('无法读取已保存的 API Key，请重新输入');
      }
    }
    return { ...profile, apiKey: key };
  }

  save(input) {
    const next = this.resolve(input);
    const { apiKey, ...profile } = next;
    if (!apiKey && !isLoopback(profile.baseUrl) && !input.clearKey) {
      throw new Error('请输入 API Key');
    }
    if (apiKey && !this.storage.isEncryptionAvailable()) {
      throw new Error('Windows 凭据加密当前不可用');
    }
    const encryptedKey = apiKey ? this.storage.encryptString(apiKey).toString('base64') : '';
    this.library.setSetting(storageKey, JSON.stringify({ ...profile, encryptedKey }));
    return this.status();
  }
}
