import { notFound } from 'next/navigation';
import { features } from '@/lib/features';

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  if (!features.portfolio) notFound();
  return <>{children}</>;
}
