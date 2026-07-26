import { notFound } from 'next/navigation';
import { features } from '@/lib/features';

export default function ArtLayout({ children }: { children: React.ReactNode }) {
  if (!features.art) notFound();
  return <>{children}</>;
}
