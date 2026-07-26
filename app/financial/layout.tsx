import { notFound } from 'next/navigation';
import { features } from '@/lib/features';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  if (!features.financial) notFound();
  return <>{children}</>;
}
