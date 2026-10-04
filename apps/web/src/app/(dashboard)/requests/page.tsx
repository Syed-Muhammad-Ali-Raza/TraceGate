'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { listRequests } from '@/features/api-keys/api';

export default function RequestsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listRequests()
      .then((data) => setItems(data.items))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader title="Requests" description="Cursor-paginated LLM request log." />
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      {items.length === 0 ? (
        <EmptyState title="No requests yet" description="Send traffic through /v1/chat/completions." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-card">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={String(item.id)} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="underline" href={`/requests/${String(item.id)}`}>
                      {new Date(String(item.createdAt)).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{String(item.model)}</td>
                  <td className="px-3 py-2">{String(item.statusCode)}</td>
                  <td className="px-3 py-2">{String(item.latencyMs ?? '—')} ms</td>
                  <td className="px-3 py-2">${String(item.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
