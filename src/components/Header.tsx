import { useEffect, useState } from 'react';
import { PLAYLIST_URL } from '../hooks/useYouTubePlayer';

export default function Header() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(now)
    .toLowerCase();

  return (
    <header className="flex items-start justify-between px-5 pt-6 sm:px-6">
      <div className="text-sm tracking-wide text-white/85 animate-pulse" aria-live="off">
        {time}
      </div>
      <a
        href={PLAYLIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto text-sm text-white/85 transition hover:text-white"
      >
        YouTube&nbsp;↗
      </a>
    </header>
  );
}
