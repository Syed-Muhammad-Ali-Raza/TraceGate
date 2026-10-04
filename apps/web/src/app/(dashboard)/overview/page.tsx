'use client';

import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { getAnalytics } from '@/features/api-keys/api';

export default function OverviewPage() {
  const [hourly, setHourly] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void getAnalytics().then((data) => setHourly(data.hourly));
  }, []);

  const requests = hourly.reduce((sum, row) => sum + Number(row.requests ?? 0), 0);
  const cost = hourly.reduce((sum, row) => sum + Number(row.costUsd ?? 0), 0);
  const errors = hourly.reduce((sum, row) => sum + Number(row.errors ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Rollup analytics from usage_hourly (not raw llm_requests)."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests (48h buckets)" value={String(requests)} />
        <StatCard label="Cost (USD)" value={cost.toFixed(4)} />
        <StatCard label="Errors" value={String(errors)} />
        <StatCard label="Models" value={String(new Set(hourly.map((h) => h.model)).size)} />
      </div>
      {hourly.length === 0 ? (
        <EmptyState title="No rollups yet" description="Proxy traffic will populate hourly usage." />
      ) : (
        <ul className="space-y-2 text-sm">
          {hourly.slice(0, 12).map((row) => (
            <li key={String(row.id)} className="rounded-lg border border-border bg-card px-3 py-2">
              {String(row.model)} · {String(row.requests)} req · ${String(row.costUsd)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
