import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState title={`${title} coming soon`} description={description} />
    </div>
  );
}
