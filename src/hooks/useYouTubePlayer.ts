import { useCallback, useEffect, useRef, useState } from 'react';

export const PLAYLIST_ID = 'PLA-8U9tOtMXuKC73hzrSdrMIvSj0ilb11';

export const PLAYLIST_URL = `https://youtube.com/playlist?list=${PLAYLIST_ID}`;

interface PlayerApi {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideoAt: (index: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaylist: () => string[] | undefined;
  getPlaylistIndex: () => number;
  getVideoData: () => { title?: string; author?: string; video_id?: string } | undefined;
  destroy: () => void;
}

interface YTType {
  Player: new (
    elementId: string,
    options: {
      width: string;
      height: string;
      playerVars: Record<string, unknown>;
      events: Record<string, (event: unknown) => void>;
    },
  ) => PlayerApi;
  PlayerState: Record<string, number>;
}

declare global {
  interface Window {
    YT?: YTType;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface VideoInfo {
  videoId: string | null;
  title: string;
  author: string;
}

export interface QueueItem {
  videoId: string;
  index: number;
  title?: string;
  author?: string;
}

export interface PlayerState {
  ready: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  video: VideoInfo;
  playlistIndex: number | null;
  queue: QueueItem[];
  failed: string[];
  error: boolean;
}

const INITIAL_STATE: PlayerState = {
  ready: false,
  playing: false,
  currentTime: 0,
  duration: 0,
  video: { videoId: null, title: '', author: '' },
  playlistIndex: null,
  queue: [],
  failed: [],
  error: false,
};

interface TitleCacheEntry {
  title: string;
  author: string;
}

async function fetchTitle(videoId: string): Promise<TitleCacheEntry | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { title?: string; author_name?: string };
    if (typeof json.title !== 'string' || !json.title) return null;
    return {
      title: json.title,
      author: typeof json.author_name === 'string' ? json.author_name : '',
    };
  } catch {
    return null;
  }
}

export function useYouTubePlayer() {
  const playerRef = useRef<PlayerApi | null>(null);
  const titleCache = useRef<Map<string, TitleCacheEntry>>(new Map());
  const failedVideoIds = useRef<Set<string>>(new Set());
  const skipPending = useRef(false);
  const consecutiveSkips = useRef(0);
  const backgroundResolveStarted = useRef(false);
  const stateRef = useRef<PlayerState>(INITIAL_STATE);
  const [state, setState] = useState<PlayerState>(INITIAL_STATE);

  const update = useCallback((patch: Partial<PlayerState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
  }, []);

  const syncFromPlayer = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const prev = stateRef.current;

    const currentTime = p.getCurrentTime?.() ?? 0;
    const duration = p.getDuration?.() ?? 0;
    const data = p.getVideoData?.();
    const video = {
      videoId: data?.video_id ?? prev.video.videoId,
      title: data?.title ?? prev.video.title,
      author: data?.author ?? prev.video.author,
    };

    let playlistIndex: number | null = p.getPlaylistIndex?.() ?? prev.playlistIndex;
    if (playlistIndex === -1) playlistIndex = prev.playlistIndex;

    let queue = prev.queue;
    const ids = p.getPlaylist?.() ?? [];
    const idsChanged =
      queue.length !== ids.length || queue.some((item, i) => item.videoId !== ids[i]);
    if (idsChanged) {
      queue = ids.map((id, i) => ({
        videoId: id,
        index: i,
        ...(titleCache.current.get(id) ?? {}),
      }));
    }

    let queueMerged = false;
    const mergedQueue = queue.map((item) => {
      const meta = titleCache.current.get(item.videoId);
      if (meta && (item.title !== meta.title || item.author !== meta.author)) {
        queueMerged = true;
        return { ...item, ...meta };
      }
      return item;
    });
    if (queueMerged) queue = mergedQueue;

    if (video.videoId && video.title) {
      titleCache.current.set(video.videoId, { title: video.title, author: video.author });
      const hit = queue.findIndex((item) => item.videoId === video.videoId);
      if (hit >= 0 && (queue[hit].title !== video.title || queue[hit].author !== video.author)) {
        queue = queue.map((item) =>
          item.videoId === video.videoId
            ? { ...item, title: video.title, author: video.author }
            : item,
        );
      }
    }

    if (
      currentTime !== prev.currentTime ||
      duration !== prev.duration ||
      video.videoId !== prev.video.videoId ||
      video.title !== prev.video.title ||
      video.author !== prev.video.author ||
      playlistIndex !== prev.playlistIndex ||
      queue !== prev.queue ||
      prev.error
    ) {
      update({ currentTime, duration, video, playlistIndex, queue, error: false });
    }
  }, [update]);

  const handlePlayerError = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (skipPending.current) return;

    const vid = p.getVideoData?.()?.video_id;
    if (vid) {
      if (failedVideoIds.current.has(vid)) {
        update({ error: true });
        return;
      }
      failedVideoIds.current.add(vid);
      update({ failed: [...failedVideoIds.current] });
      consecutiveSkips.current = 0;
    } else {
      consecutiveSkips.current += 1;
      if (consecutiveSkips.current > 3) {
        update({ error: true });
        return;
      }
    }

    const wasPlaying = stateRef.current.playing;
    skipPending.current = true;
    window.setTimeout(() => {
      skipPending.current = false;
      const current = playerRef.current;
      if (!current) return;
      current.nextVideo();
      if (wasPlaying) {
        window.setTimeout(() => playerRef.current?.playVideo(), 300);
      }
    }, 300);
  }, [update]);

  useEffect(() => {
    const loadApi = () => {
      window.onYouTubeIframeAPIReady = () => {
        if (playerRef.current || !window.YT) return;
        playerRef.current = new window.YT.Player('youtube-player', {
          width: '200',
          height: '113',
          playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              update({ ready: true });
              syncFromPlayer();
            },
            onStateChange: (event: unknown) => {
              const data = (event as { data: number }).data;
              const stateMap = window.YT?.PlayerState;
              const playing = stateMap ? data === stateMap.PLAYING : false;
              consecutiveSkips.current = 0;
              update({ playing, error: false });
              if (playing || (stateMap && data === stateMap.CUED)) {
                syncFromPlayer();
              }
            },
            onError: handlePlayerError,
          },
        });
      };

      if (window.YT?.Player) {
        window.onYouTubeIframeAPIReady();
        return;
      }

      if (!document.getElementById('youtube-iframe-api-script')) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api-script';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    };

    loadApi();

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [update, syncFromPlayer, handlePlayerError]);

  useEffect(() => {
    if (!state.ready) return;
    const id = window.setInterval(() => {
      if (playerRef.current) syncFromPlayer();
    }, 500);
    return () => window.clearInterval(id);
  }, [state.ready, syncFromPlayer]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (stateRef.current.playing) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, []);
  const next = useCallback(() => playerRef.current?.nextVideo(), []);
  const prev = useCallback(() => playerRef.current?.previousVideo(), []);
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);
  const playAt = useCallback((index: number) => {
    playerRef.current?.playVideoAt(index);
  }, []);

  const resolveQueueTitles = useCallback(async () => {
    const queue = stateRef.current.queue;
    const pending = queue.filter(
      (item) =>
        !titleCache.current.has(item.videoId) && !failedVideoIds.current.has(item.videoId),
    );
    let cursor = 0;
    while (cursor < pending.length) {
      const batch = pending.slice(cursor, cursor + 4);
      cursor += 4;
      await Promise.all(
        batch.map(async (item) => {
          const meta = await fetchTitle(item.videoId);
          if (meta) titleCache.current.set(item.videoId, meta);
        }),
      );
      syncFromPlayer();
    }
  }, [syncFromPlayer]);

  useEffect(() => {
    if (state.ready && state.queue.length > 0 && !backgroundResolveStarted.current) {
      backgroundResolveStarted.current = true;
      void resolveQueueTitles();
    }
  }, [state.ready, state.queue.length, resolveQueueTitles]);

  return {
    state,
    play,
    pause,
    toggle,
    next,
    prev,
    seekTo,
    playAt,
    resolveQueueTitles,
  };
}

export type YouTubePlayerController = ReturnType<typeof useYouTubePlayer>;
