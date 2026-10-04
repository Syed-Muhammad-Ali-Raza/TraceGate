'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { PageHeader } from '@/components/common/PageHeader';
import { apiFetch } from '@/lib/api-client';
import { API_PREFIX } from '@llm-gateway/shared';

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void apiFetch<{ request: Record<string, unknown> }>(`${API_PREFIX}/requests/${params.id}`).then(
      (data) => setRequest(data.request),
    );
  }, [params.id]);

  if (!request) {
    return <p className="text-sm text-muted-foreground">Loading trace…</p>;
  }

  return (
    <div>
      <PageHeader title="Trace" description={String(request.id)} />
      <pre className="overflow-auto rounded-xl border border-border bg-card p-4 text-xs">
        {JSON.stringify(request, null, 2)}
      </pre>
    </div>
  );
}
