
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Heart, Clock, Calendar, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserFavorite } from "@/entities/UserFavorite";

export default function MovieCard({ movie, onSelect }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Support both OMDB (Title, Poster, etc.) and lowercase (title, poster) field names
  const movieTitle = movie?.Title || movie?.title || '';
  const moviePoster = movie?.Poster || movie?.poster || '';
  const movieYear = movie?.Year || movie?.year || '';
  const movieGenre = movie?.Genre || movie?.genre || '';
  const movieImdbId = movie?.imdbID || movie?.imdb_id || '';
  const movieType = movie?.Type || movie?.type || 'movie';
  const movieRating = movie?.imdbRating || '';
  const movieRuntime = movie?.Runtime || movie?.runtime || '';

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (movieImdbId) {
        const fav = await UserFavorite.check(movieImdbId);
        setIsFavorite(fav);
      }
    };
    checkFavoriteStatus();
  }, [movieImdbId]);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isFavorite) {
        await UserFavorite.remove(movieImdbId);
        setIsFavorite(false);
      } else {
        await UserFavorite.add({
          imdb_id: movieImdbId,
          title: movieTitle,
          poster: moviePoster,
          year: movieYear,
          genre: movieGenre
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error handling favorite:", error);
    }
    setIsLoading(false);
  };

  const formatGenres = (genreString) => {
    if (!genreString) return [];
    return genreString.split(',').map(g => g.trim()).slice(0, 2);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }}
      className="group relative bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 transition-all duration-300 cursor-pointer shadow-md"
      onClick={() => onSelect(movie)}
    >
      <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
        {moviePoster && moviePoster !== 'N/A' ? (
          <img
            src={moviePoster}
            alt={movieTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}

        <div className="w-full h-full flex items-center justify-center" style={{ display: moviePoster && moviePoster !== 'N/A' ? 'none' : 'flex' }}>
          <Play className="w-16 h-16 text-slate-500" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <div className="absolute top-3 right-3">
            <button
              className="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={handleFavorite}
              disabled={isLoading}
            >
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white/80'}`} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge variant="outline" className="bg-black/40 text-white/80 border-white/20 text-[10px]">
              {movieType}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm text-slate-200 line-clamp-1 mb-1">{movieTitle}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Calendar className="w-3 h-3" />
          <span>{movieYear}</span>
          {movieRuntime && movieRuntime !== 'N/A' && (
            <>
              <Clock className="w-3 h-3 ml-1" />
              <span>{movieRuntime}</span>
            </>
          )}
        </div>

        {movieRating && movieRating !== 'N/A' && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-slate-300">{movieRating}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {formatGenres(movieGenre).map(genre => (
            <Badge
              key={genre}
              variant="outline"
              className="text-[10px] border-slate-600 text-slate-400"
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
