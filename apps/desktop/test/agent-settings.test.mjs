import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Library } from '../main/library.mjs';
import { AgentSettings } from '../main/agent-settings.mjs';
import { createAgentModel } from '../main/agent-model.mjs';

const crypto = {
  isEncryptionAvailable: () => true,
  encryptString: text => Buffer.from([...text].reverse().join('')),
  decryptString: buffer => [...buffer.toString()].reverse().join(''),
};

test('persists ciphertext and limits reuse of saved credentials to the original endpoint', () => {
  const library = new Library(':memory:');
  try {
    const settings = new AgentSettings(library, crypto);
    const config = { provider: 'compatible', modelId: 'model', baseUrl: 'https://api.example.org/v1/' };
    assert.equal(settings.status().ready, false);
    settings.save({ ...config, apiKey: 'test-secret' });
    assert.doesNotMatch(library.setting('agentSettings'), /test-secret/);
    const reopened = new AgentSettings(library, crypto);
    assert.equal(reopened.status().ready, true);
    assert.equal(reopened.status().hasKey, true);
    assert.equal(reopened.status().apiKey, undefined);
    assert.equal(reopened.resolve({ ...config, modelId: 'another' }).apiKey, 'test-secret');
    assert.equal(reopened.resolve({ ...config, baseUrl: 'https://other.example.org/v1' }).apiKey, '');
    reopened.save({ ...config, clearKey: true });
    assert.equal(reopened.status().ready, false);
    assert.equal(reopened.status().hasKey, false);
  } finally {
    library.close();
  }
});

test('permits keyless loopback profiles and rejects cleartext remote URLs', () => {
  const library = new Library(':memory:');
  try {
    const settings = new AgentSettings(library, crypto);
    const config = { provider: 'compatible', modelId: 'model', baseUrl: 'http://localhost:11434/v1' };
    assert.equal(settings.save(config).ready, true);
    assert.throws(() => settings.save({ ...config, baseUrl: 'http://api.example.org/v1' }), /HTTPS/);
    assert.throws(() => settings.save({ ...config, baseUrl: 'https://user:secret@api.example.org/v1' }), /Base URL/);
  } finally {
    library.close();
  }
});

test('loads the selected cloud API and fixed official endpoint into the embedded Pi runtime', async () => {
  const profiles = [
    { provider: 'openai', api: 'openai-responses', baseUrl: 'https://api.openai.com/v1' },
    { provider: 'anthropic', api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com' },
  ];
  for (const { provider, api, baseUrl } of profiles) {
    const { model } = await createAgentModel({
      provider, modelId: 'test-model', apiKey: 'test-secret', baseUrl: 'https://ignored.example.org',
    });
    assert.equal(model.id, 'test-model');
    assert.equal(model.api, api);
    assert.equal(model.baseUrl, baseUrl);
  }
});
