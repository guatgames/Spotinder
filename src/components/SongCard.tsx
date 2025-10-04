import { useState, useRef, useEffect } from "react";
import { Heart, X, Play, Pause } from "lucide-react";
import { Song } from "@/pages/Index";

interface SongCardProps {
  song: Song;
  onLike: (song: Song) => void;
  onDislike: (song: Song) => void;
}

export const SongCard = ({ song, onLike, onDislike }: SongCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [animating, setAnimating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Reset state when song changes
    setDragOffset({ x: 0, y: 0 });
    setIsPlaying(false);
    setAnimating(false);
  }, [song]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (animating) return;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animating) return;
    setIsDragging(true);
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || animating) return;
    const x = e.clientX - startPosRef.current.x;
    const y = e.clientY - startPosRef.current.y;
    setDragOffset({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || animating) return;
    const touch = e.touches[0];
    const x = touch.clientX - startPosRef.current.x;
    const y = touch.clientY - startPosRef.current.y;
    setDragOffset({ x, y });
  };

  const handleRelease = () => {
    if (!isDragging || animating) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      performAction(dragOffset.x > 0 ? "like" : "dislike");
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const performAction = (action: "like" | "dislike") => {
    setAnimating(true);
    
    if (cardRef.current) {
      cardRef.current.style.animation = action === "like" 
        ? "swipe-right 0.5s ease-out forwards"
        : "swipe-left 0.5s ease-out forwards";
    }

    setTimeout(() => {
      if (action === "like") {
        onLike(song);
      } else {
        onDislike(song);
      }
    }, 500);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const rotation = isDragging ? dragOffset.x * 0.1 : 0;
  const opacity = isDragging ? Math.max(0.5, 1 - Math.abs(dragOffset.x) * 0.002) : 1;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Action Indicators */}
      {isDragging && (
        <>
          <div 
            className={`absolute top-1/2 left-4 transform -translate-y-1/2 z-10 transition-opacity duration-200 ${
              dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="bg-music-accent text-music-bg-primary p-4 rounded-full">
              <Heart size={32} fill="currentColor" />
            </div>
          </div>
          <div 
            className={`absolute top-1/2 right-4 transform -translate-y-1/2 z-10 transition-opacity duration-200 ${
              dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="bg-destructive text-music-text-primary p-4 rounded-full">
              <X size={32} />
            </div>
          </div>
        </>
      )}

      {/* Song Card */}
      <div
        ref={cardRef}
        className="bg-gradient-card border border-music-bg-secondary rounded-2xl p-6 shadow-card cursor-grab active:cursor-grabbing select-none animate-card-enter"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleRelease}
      >
        {/* Album Cover */}
        <div className="relative mb-6">
          <img
            src={song.image || "/placeholder.svg"}
            alt={`${song.album} cover`}
            className="w-full aspect-square object-cover rounded-xl"
            draggable={false}
          />
          <button
            onClick={togglePlay}
            className="absolute bottom-4 right-4 bg-music-accent hover:bg-music-accent-hover text-music-bg-primary p-3 rounded-full shadow-button transition-all duration-200 hover:scale-105"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>

        {/* Song Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-music-text-primary mb-2 line-clamp-2">
            {song.name}
          </h2>
          <p className="text-lg text-music-text-secondary mb-1">
            {song.artist}
          </p>
          <p className="text-music-text-muted">
            {song.album}
          </p>
        </div>

        {/* Audio Element */}
        {song.preview_url && (
          <audio
            ref={audioRef}
            src={song.preview_url}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-8 mt-8">
        <button
          onClick={() => performAction("dislike")}
          disabled={animating}
          className="bg-music-bg-secondary hover:bg-destructive/20 border-2 border-destructive text-destructive p-4 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X size={24} />
        </button>
        <button
          onClick={() => performAction("like")}
          disabled={animating}
          className="bg-music-bg-secondary hover:bg-music-accent/20 border-2 border-music-accent text-music-accent p-4 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart size={24} />
        </button>
      </div>
    </div>
  );
};