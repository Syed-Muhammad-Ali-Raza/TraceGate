'use client';

import { useEffect, useState } from 'react';

import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ensureCsrf } from '@/features/auth/api';
import { apiFetch } from '@/lib/api-client';
import { API_PREFIX } from '@llm-gateway/shared';

export default function PromptsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('support-bot');
  const [content, setContent] = useState('You are a helpful support assistant.');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await apiFetch<{ prompts: Array<Record<string, unknown>> }>(
      `${API_PREFIX}/prompts`,
    );
    setItems(data.prompts);
  }

  useEffect(() => {
    void refresh().catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader title="Prompts" description="Versioned prompts used by experiments and proxy." />
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <div className="mb-4 space-y-2 rounded-xl border border-border bg-card p-4">
        <input
          className="w-full rounded-lg border border-border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="min-h-24 w-full rounded-lg border border-border px-3 py-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <AppButton
          type="button"
          onClick={() => {
            void (async () => {
              await ensureCsrf();
              await apiFetch(`${API_PREFIX}/prompts`, {
                method: 'POST',
                body: JSON.stringify({
                  name,
                  slug: name.toLowerCase().replace(/\s+/g, '-'),
                  content,
                }),
              });
              await refresh();
            })().catch((err: Error) => setError(err.message));
          }}
        >
          Save version 1
        </AppButton>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No prompts" description="Create a prompt to use in A/B experiments." />
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={String(item.id)} className="rounded-lg border border-border bg-card px-4 py-3">
              <strong>{String(item.name)}</strong> · {String(item.slug)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
