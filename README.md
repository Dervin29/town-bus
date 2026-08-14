# Town Bus — டவுன் பஸ் | ஜன்னல் ஓரம்

A nostalgic 90s/2000s Tamil Nadu town-bus music experience. The site is a single page that fills the viewport with bus artwork and floats a working YouTube playlist player over it — nothing more.

**Live:** https://town-bus-music.vercel.app/

## Features

- Full-screen Tamil town-bus background artwork
- Tamil title with nostalgic typography (Anek Tamil, Mukta Malar)
- Plays a real YouTube playlist through the official IFrame Player API
- Custom glass player with play/pause, previous/next, seekable progress bar, and time/duration
- Real per-track metadata: thumbnail, song title, and channel
- Queue panel listing every track in the playlist, with click-to-jump and a now-playing indicator
- Unavailable videos are auto-skipped and hidden from the queue view
- Live local clock and a direct link to the YouTube playlist
- Responsive layout for mobile and desktop

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Styling | Tailwind CSS v4 |
| Build tool | Vite |
| Media | YouTube IFrame Player API, YouTube oEmbed |
| Typography | Google Fonts (Anek Tamil, Mukta Malar, Noto Sans Tamil) |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
cd town-bus
npm install
```

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

## Project Structure

```text
town-bus/
├── assets/images/        # Background artwork used full-screen
├── src/
│   ├── components/       # Background, Header, Title, MusicPlayer, YouTubePlayer
│   ├── hooks/            # useYouTubePlayer: IFrame API + playlist/queue logic
│   ├── App.tsx           # Page layout
│   ├── index.css         # Tailwind theme and custom styles
│   └── main.tsx          # Entry point
├── index.html            # HTML shell, fonts, meta tags
└── vite.config.ts        # Vite + React + Tailwind configuration
```

## How It Works

1. The visitor opens the page and sees the bus artwork with the title, local time, and playlist link.
2. A hidden YouTube iframe loads the playlist (`listType=playlist`) via the IFrame Player API.
3. The player UI mirrors real playback state: video id, title, channel, current time, and duration.
4. Play, pause, previous, next, and seek call the corresponding YouTube API methods.
5. The queue is built from `player.getPlaylist()`; titles and channels are resolved from YouTube's oEmbed endpoint and cached.
6. Clicking a queue row jumps to that track via `player.playVideoAt(index)`.
7. If a video cannot be embedded, it is auto-skipped and hidden from the queue.

## Security

- The app is entirely client-side; there is no backend, database, or account system.
- No user data is collected or stored.
- All media content is streamed from YouTube via its official embed player.

## Known Limitations

- Song titles in the queue are resolved via YouTube's oEmbed endpoint and may appear as "…" until the request completes or the track plays.
- The IFrame Player API cannot modify the playlist, so skipped/unavailable videos stay in the underlying YouTube playlist (they are only hidden from the queue view).
- Playback depends on YouTube embed availability; region or embed-restricted videos are skipped.
- The app has no backend, so features such as live visitor presence are not implemented.

## Future Improvements

- Live visitor presence using a backend (e.g., Supabase Realtime)
- Playlist metadata from the YouTube Data API (requires an API key) instead of oEmbed

## Author

**Alan Derwin A**

- [GitHub](https://github.com/Dervin29)
