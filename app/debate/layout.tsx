import { notFound } from 'next/navigation';
import { features } from '@/lib/features';

export default function DebateLayout({ children }: { children: React.ReactNode }) {
  if (!features.debate) notFound();
  return <>{children}</>;
}
