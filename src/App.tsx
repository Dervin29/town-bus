import Background from './components/Background';
import Header from './components/Header';
import Title from './components/Title';
import MusicPlayer from './components/MusicPlayer';
import YouTubePlayer from './components/YouTubePlayer';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';

export default function App() {
  const player = useYouTubePlayer();

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Background />
      <YouTubePlayer />

      <div className="pointer-events-none app-shell relative z-10 flex flex-col">
        <Header />

        <main className="flex min-h-0 flex-1 items-center justify-center px-4">
          <Title />
        </main>

        <div className="flex justify-center px-4 pb-4 sm:pb-6">
          <MusicPlayer player={player} />
        </div>
      </div>
    </div>
  );
}
