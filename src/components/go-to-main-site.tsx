'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function GoToMainSite() {
  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || '/';

  return (
    <Link
      href={mainSiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
      title="Go to Main Site"
    >
      <ArrowUpRight className="w-4 h-4" />
      Go to Site
    </Link>
  );
}
