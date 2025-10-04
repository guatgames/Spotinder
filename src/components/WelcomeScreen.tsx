import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onSpotifyLogin: () => void;
  onContinueWithoutSpotify: () => void;
}

export const WelcomeScreen = ({ onSpotifyLogin, onContinueWithoutSpotify }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse-glow">
            <Music className="w-12 h-12 text-music-text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-music-text-primary">
            Music Discovery
          </h1>
          <p className="text-music-text-secondary text-lg">
            Descubre nueva música personalizada para ti
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 pt-8">
          <Button
            onClick={onSpotifyLogin}
            className="w-full h-14 bg-music-accent hover:bg-music-accent/90 text-music-text-primary font-semibold text-lg rounded-full transition-all"
          >
            <Music className="w-5 h-5 mr-2" />
            Continuar con Spotify
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-music-text-muted/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-bg text-music-text-muted">o</span>
            </div>
          </div>

          <Button
            onClick={onContinueWithoutSpotify}
            variant="outline"
            className="w-full h-14 border-music-text-muted/30 text-music-text-secondary hover:bg-music-text-muted/10 font-semibold text-lg rounded-full transition-all"
          >
            Continuar sin Spotify
          </Button>
        </div>

        {/* Info text */}
        <p className="text-music-text-muted text-sm pt-4">
          Conecta con Spotify para recomendaciones más personalizadas basadas en tus gustos
        </p>
      </div>
    </div>
  );
};
