'use client';

import { useEffect, useState } from 'react';

interface Props {
  timestamp?: string;
}

export default function LastChecked({ timestamp }: Props) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    if (!timestamp) return setTime(null);
    try {
      const d = new Date(timestamp);
      setTime(d.toLocaleTimeString());
    } catch (e) {
      setTime(null);
    }
  }, [timestamp]);

  if (!time) return <span>—</span>;
  return <span>{time}</span>;
}
