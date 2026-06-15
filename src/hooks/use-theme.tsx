"use client";

import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
      if (saved === 'dark' || saved === 'light') return saved;
      return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    } catch { return 'light'; }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  return { theme, setTheme };
}

export default useTheme;
