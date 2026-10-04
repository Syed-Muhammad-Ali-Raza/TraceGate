'use client';

import { useEffect, useState } from 'react';

import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ensureCsrf } from '@/features/auth/api';
import { apiFetch } from '@/lib/api-client';
import { API_PREFIX } from '@llm-gateway/shared';

export default function ExperimentsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('Prompt A/B');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await apiFetch<{ experiments: Array<Record<string, unknown>> }>(
      `${API_PREFIX}/experiments`,
    );
    setItems(data.experiments);
  }

  useEffect(() => {
    void refresh().catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Experiments"
        description="Create A/B experiments; activate to inject prompt variants in the proxy."
      />
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AppButton
          type="button"
          onClick={() => {
            void (async () => {
              await ensureCsrf();
              await apiFetch(`${API_PREFIX}/experiments`, {
                method: 'POST',
                body: JSON.stringify({ name }),
              });
              await refresh();
            })().catch((err: Error) => setError(err.message));
          }}
        >
          Create
        </AppButton>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No experiments" description="Create one, add variants, then activate." />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={String(item.id)}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span>
                <strong>{String(item.name)}</strong> · {String(item.status)}
              </span>
              <AppButton
                type="button"
                variant="secondary"
                onClick={() => {
                  void (async () => {
                    await ensureCsrf();
                    await apiFetch(`${API_PREFIX}/experiments/${String(item.id)}/activate`, {
                      method: 'POST',
                      body: '{}',
                    });
                    await refresh();
                  })().catch((err: Error) => setError(err.message));
                }}
              >
                Activate
              </AppButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
