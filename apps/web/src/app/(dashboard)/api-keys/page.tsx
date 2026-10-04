'use client';

import { useEffect, useState } from 'react';

import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { createApiKey, listApiKeys, upsertProviderKey } from '@/features/api-keys/api';
import { ensureCsrf } from '@/features/auth/api';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Array<Record<string, unknown>>>([]);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [providerKey, setProviderKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await listApiKeys();
    setKeys(data.keys);
  }

  useEffect(() => {
    void refresh().catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Gateway keys for clients and encrypted provider keys."
        actions={
          <AppButton
            type="button"
            onClick={() => {
              void (async () => {
                await ensureCsrf();
                const created = await createApiKey(`Key ${keys.length + 1}`);
                setRawKey(created.rawKey);
                await refresh();
              })().catch((err: Error) => setError(err.message));
            }}
          >
            Create key
          </AppButton>
        }
      />
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      {rawKey ? (
        <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm">
          Copy now (shown once): <code className="break-all">{rawKey}</code>
        </div>
      ) : null}
      {keys.length === 0 ? (
        <EmptyState title="No keys" description="Create a gateway API key to call the proxy." />
      ) : (
        <ul className="space-y-2">
          {keys.map((key) => (
            <li key={String(key.id)} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <strong>{String(key.name)}</strong> · {String(key.keyPrefix)}…
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 font-medium">OpenAI-compatible provider key</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Works with OpenAI, OpenRouter, xAI/Grok, Groq, Ollama, etc. Set{' '}
          <code>OPENAI_API_BASE</code> in <code>.env</code> to that provider&apos;s base URL, turn{' '}
          <code>MOCK_LLM=false</code>, then paste the API key here.
        </p>
        <input
          className="mb-2 w-full rounded-lg border border-border px-3 py-2"
          type="password"
          value={providerKey}
          onChange={(e) => setProviderKey(e.target.value)}
          placeholder="sk-or-… / xai-… / gsk_…"
        />
        <AppButton
          type="button"
          variant="secondary"
          onClick={() => {
            void (async () => {
              await ensureCsrf();
              await upsertProviderKey('openai', providerKey);
              setProviderKey('');
            })().catch((err: Error) => setError(err.message));
          }}
        >
          Save encrypted key
        </AppButton>
      </div>
    </div>
  );
}
