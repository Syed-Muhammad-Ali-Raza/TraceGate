'use client';

import { useEffect, useState } from 'react';

import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ensureCsrf } from '@/features/auth/api';
import { apiFetch } from '@/lib/api-client';
import { API_PREFIX } from '@llm-gateway/shared';

export default function EvalsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('Helpfulness judge');
  const [criteria, setCriteria] = useState('helpful accurate concise');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await apiFetch<{ evals: Array<Record<string, unknown>> }>(`${API_PREFIX}/evals`);
    setItems(data.evals);
  }

  useEffect(() => {
    void refresh().catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Evals"
        description="Queue LLM-as-judge jobs; worker writes scores to eval_results."
      />
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <div className="mb-4 space-y-2 rounded-xl border border-border bg-card p-4">
        <input
          className="w-full rounded-lg border border-border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eval name"
        />
        <input
          className="w-full rounded-lg border border-border px-3 py-2"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="Criteria keywords"
        />
        <AppButton
          type="button"
          onClick={() => {
            void (async () => {
              await ensureCsrf();
              await apiFetch(`${API_PREFIX}/evals`, {
                method: 'POST',
                body: JSON.stringify({
                  name,
                  judgeModel: 'local-heuristic',
                  criteria,
                  sampleRate: 10,
                }),
              });
              await refresh();
            })().catch((err: Error) => setError(err.message));
          }}
        >
          Create eval
        </AppButton>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No evals" description="Create an eval, then run it against a request." />
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={String(item.id)} className="rounded-lg border border-border bg-card px-4 py-3">
              <strong>{String(item.name)}</strong> · {String(item.judgeModel)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
