import { notFound } from 'next/navigation';
import { features } from '@/lib/features';

export default function CsAiLayout({ children }: { children: React.ReactNode }) {
  if (!features.csAi) notFound();
  return <>{children}</>;
}
