import { useState, useEffect } from "react";
import { DeezerService, Artist } from "@/services/deezerService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPreferencesProps {
  onComplete: (selectedArtists: Artist[]) => void;
}

const SUGGESTED_ARTISTS = [
  { id: "13449138", name: "BoyWithUke", picture_medium: "" },
  { id: "12246", name: "Taylor Swift", picture_medium: "" },
  { id: "847", name: "Coldplay", picture_medium: "" },
  { id: "246791", name: "Drake", picture_medium: "" },
  { id: "160", name: "Shakira", picture_medium: "" },
  { id: "75491", name: "The Weeknd", picture_medium: "" },
  { id: "1424", name: "Ed Sheeran", picture_medium: "" },
  { id: "542", name: "Eminem", picture_medium: "" },
];

export const MusicPreferences = ({ onComplete }: MusicPreferencesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const deezerService = DeezerService.getInstance();

  // Load suggested artists with their images
  useEffect(() => {
    const loadSuggestedArtists = async () => {
      const loaded: Artist[] = [];
      for (const artist of SUGGESTED_ARTISTS) {
        try {
          const results = await deezerService.searchArtists(artist.name, 1);
          if (results.length > 0) {
            loaded.push(results[0]);
          }
        } catch (error) {
          console.error(`Error loading artist ${artist.name}:`, error);
        }
      }
      setSuggestedArtists(loaded);
    };
    loadSuggestedArtists();
  }, []);

  // Search artists
  useEffect(() => {
    const searchArtists = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await deezerService.searchArtists(searchQuery, 8);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching artists:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchArtists, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleArtist = (artist: Artist) => {
    setSelectedArtists((prev) => {
      const isSelected = prev.some((a) => a.id === artist.id);
      if (isSelected) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  };

  const isArtistSelected = (artistId: string) => {
    return selectedArtists.some((a) => a.id === artistId);
  };

  const removeArtist = (artistId: string) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== artistId));
  };

  const handleContinue = () => {
    if (selectedArtists.length > 0) {
      onComplete(selectedArtists);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-music-text-primary mb-2">
            Elige tus gustos musicales 🎶
          </h1>
          <p className="text-music-text-secondary">
            Selecciona tus artistas favoritos para recibir mejores recomendaciones
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-music-text-muted" size={20} />
            <Input
              type="text"
              placeholder="Busca tu artista favorito..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-music-bg-card border-border text-music-text-primary placeholder:text-music-text-muted"
            />
          </div>

          {/* Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-music-bg-card rounded-lg shadow-card border border-border max-h-64 overflow-y-auto z-10">
              {isSearching ? (
                <div className="p-4 text-center text-music-text-secondary">
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      isSelected={isArtistSelected(artist.id)}
                      onClick={() => toggleArtist(artist)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-music-text-secondary">
                  No se encontraron artistas
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Artists */}
        {selectedArtists.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-music-text-primary mb-3">
              Tus gustos ({selectedArtists.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center gap-2 bg-music-accent/20 border border-music-accent rounded-full px-3 py-1"
                >
                  <img
                    src={artist.picture_medium}
                    alt={artist.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-music-text-primary text-sm font-medium">
                    {artist.name}
                  </span>
                  <button
                    onClick={() => removeArtist(artist.id)}
                    className="text-music-text-secondary hover:text-music-text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Artists */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-music-text-primary mb-4">
            Artistas sugeridos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {suggestedArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isSelected={isArtistSelected(artist.id)}
                onClick={() => toggleArtist(artist)}
                large
              />
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={selectedArtists.length === 0}
            size="lg"
            className="bg-gradient-primary text-music-text-primary font-bold px-12 py-6 text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-button"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ArtistCardProps {
  artist: Artist;
  isSelected: boolean;
  onClick: () => void;
  large?: boolean;
}

const ArtistCard = ({ artist, isSelected, onClick, large }: ArtistCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300",
        "bg-music-bg-card border-2 hover:scale-105",
        isSelected
          ? "border-music-accent shadow-glow"
          : "border-transparent hover:border-border",
        large ? "p-3" : "p-2"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-music-accent rounded-full p-1">
          <Check size={16} className="text-music-text-primary" />
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <img
          src={artist.picture_medium || artist.picture}
          alt={artist.name}
          className={cn(
            "rounded-full object-cover",
            large ? "w-20 h-20" : "w-12 h-12"
          )}
        />
        <span className={cn(
          "text-center font-medium text-music-text-primary line-clamp-2",
          large ? "text-sm" : "text-xs"
        )}>
          {artist.name}
        </span>
      </div>
    </div>
  );
};
