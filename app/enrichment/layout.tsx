import { notFound } from 'next/navigation';
import { features } from '@/lib/features';

export default function EnrichmentLayout({ children }: { children: React.ReactNode }) {
  if (!features.enrichment) notFound();
  return <>{children}</>;
}
