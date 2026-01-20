'use client';

import { MainLayout } from '@/components/MainNav';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
