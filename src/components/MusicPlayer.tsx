import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { YouTubePlayerController, QueueItem } from '../hooks/useYouTubePlayer';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M6 5h2v14H6V5zm12.5 0v14L9 12l9.5-7z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M16 5h2v14h-2V5zM5.5 5v14L15 12 5.5 5z" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h10v2H3v-2zm14-1l5 3-5 3v-6z" />
    </svg>
  );
}

function NowPlayingIcon() {
  return (
    <div className="flex h-3 items-end gap-[2px]">
      <span className="eq-bar w-[3px] rounded-sm bg-emerald-300" style={{ animationDelay: '0s' }} />
      <span className="eq-bar w-[3px] rounded-sm bg-emerald-300" style={{ animationDelay: '0.2s' }} />
      <span className="eq-bar w-[3px] rounded-sm bg-emerald-300" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}

const buttonClass =
  'flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9';

interface QueueRowProps {
  item: QueueItem;
  position: number;
  isCurrent: boolean;
  playing: boolean;
  onPlay: () => void;
  currentRowRef: (node: HTMLButtonElement | null) => void;
}

function QueueRow({ item, position, isCurrent, playing, onPlay, currentRowRef }: QueueRowProps) {
  const thumbnail = `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`;
  return (
    <li>
      <button
        type="button"
        ref={isCurrent ? currentRowRef : undefined}
        onClick={onPlay}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
          isCurrent ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <span
          className={`w-5 shrink-0 text-center text-[11px] tabular-nums ${
            isCurrent ? 'text-emerald-300' : 'text-white/40'
          }`}
        >
          {isCurrent && playing ? <NowPlayingIcon /> : position}
        </span>
        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <img src={thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`truncate text-sm ${isCurrent ? 'text-white' : 'text-white/85'}`}>
            {item.title || '…'}
          </div>
          <div className="truncate text-xs text-white/45">{item.author || ''}</div>
        </div>
      </button>
    </li>
  );
}

export default function MusicPlayer({ player }: { player: YouTubePlayerController }) {
  const { state, toggle, next, prev, seekTo, playAt, resolveQueueTitles } = player;
  const { ready, playing, currentTime, duration, video, error, playlistIndex, queue, failed } =
    state;

  const visibleQueue = queue.filter((item) => !failed.includes(item.videoId));

  const [queueOpen, setQueueOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState<number | null>(null);
  const scrubbingRef = useRef(false);
  const currentRowRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!queueOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setQueueOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [queueOpen]);

  const activeTime = scrubbing ?? currentTime;
  const progress = duration > 0 ? Math.min(1, Math.max(0, activeTime / duration)) : 0;
  const percent = progress * 100;
  const max = Math.max(duration, 1);

  const thumbnail = video.videoId
    ? `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
    : null;

  const startScrub = () => {
    scrubbingRef.current = true;
  };

  const updateScrub = (value: number) => {
    setScrubbing(value);
  };

  const endScrub = () => {
    scrubbingRef.current = false;
    if (scrubbing !== null) {
      seekTo(scrubbing);
    }
    setScrubbing(null);
  };

  const setCurrentRowRef = (node: HTMLButtonElement | null) => {
    currentRowRef.current = node;
  };

  const toggleQueue = () => {
    setQueueOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        void resolveQueueTitles();
      }
      return nextOpen;
    });
  };

  useEffect(() => {
    if (queueOpen && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [queueOpen, playlistIndex]);

  return (
    <div className="relative" ref={containerRef}>
      {queueOpen && (
        <div className="queue-scroll pointer-events-auto absolute bottom-full left-0 right-0 z-30 mb-3 max-h-[42vh] overflow-y-auto rounded-2xl border border-white/15 bg-black/55 p-2 shadow-[0_12px_44px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center justify-between px-2 pb-1 pt-0.5">
            <span className="text-xs font-medium text-white/70">பாடல் வரிசை</span>
            <span className="text-[11px] text-white/40">
              {visibleQueue.length > 0 ? `${visibleQueue.length} பாடல்கள்` : ''}
            </span>
          </div>
          {visibleQueue.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-white/40">சுமையேற்றுகிறது…</div>
          ) : (
            <ul>
              {visibleQueue.map((item, listIndex) => (
                <QueueRow
                  key={item.videoId}
                  item={item}
                  position={listIndex + 1}
                  isCurrent={item.index === playlistIndex}
                  playing={playing}
                  onPlay={() => playAt(item.index)}
                  currentRowRef={setCurrentRowRef}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="pointer-events-auto flex w-[min(94vw,640px)] flex-col gap-y-2.5 rounded-2xl border border-white/15 bg-black/45 px-3 py-2.5 shadow-[0_12px_44px_rgba(0,0,0,0.5)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-x-4 sm:rounded-3xl sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1 sm:flex sm:flex-col sm:justify-center">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:h-16 sm:w-16">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg text-white/40">
                  ♪
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white sm:text-[15px]">
                {error ? 'வீடியோ கிடைக்கவில்லை' : video.title || 'டவுன் பஸ் ஜன்னல் ஓரம்'}
              </div>
              <div className="truncate text-xs text-white/60">
                {error ? 'YouTube' : video.author || 'YouTube'}
              </div>
            </div>

            <button
              type="button"
              className={`${buttonClass} sm:hidden ${queueOpen ? 'bg-white/15 text-white' : ''}`}
              onClick={toggleQueue}
              disabled={!ready}
              aria-label="பாடல் வரிசை"
              aria-pressed={queueOpen}
            >
              <QueueIcon />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 sm:mt-1.5">
            <span className="w-10 shrink-0 text-[11px] tabular-nums text-white/60">
              {formatTime(activeTime)}
            </span>
            <input
              type="range"
              className="player-range min-w-0 flex-1"
              min={0}
              max={max}
              step={0.1}
              value={Math.min(activeTime, max)}
              disabled={!ready || duration === 0}
              aria-label="முன்னேற்றம்"
              style={{ '--progress': `${percent}%` } as CSSProperties}
              onPointerDown={startScrub}
              onPointerUp={endScrub}
              onPointerCancel={endScrub}
              onKeyUp={endScrub}
              onBlur={endScrub}
              onChange={(event) => updateScrub(Number(event.target.value))}
            />
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-white/60">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={prev}
            disabled={!ready}
            aria-label="முந்தைய பாடல்"
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={!ready}
            aria-label={playing ? 'இடைநிறுத்து' : 'இயக்கு'}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={next}
            disabled={!ready}
            aria-label="அடுத்த பாடல்"
          >
            <NextIcon />
          </button>
          <button
            type="button"
            className={`${buttonClass} hidden sm:flex ${queueOpen ? 'bg-white/15 text-white' : ''}`}
            onClick={toggleQueue}
            disabled={!ready}
            aria-label="பாடல் வரிசை"
            aria-pressed={queueOpen}
          >
            <QueueIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
