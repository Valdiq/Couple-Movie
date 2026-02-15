
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Heart, Clock, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserFavorite } from "@/entities/UserFavorite";
import { User as UserEntity } from "@/entities/User";

export default function MovieCard({ movie, onSelect }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
        if (currentUser && movie?.id) {
          const userFavorites = await UserFavorite.filter({ user_email: currentUser.email, movie_id: movie.id });
          setIsFavorite(userFavorites.length > 0);
        }
      } catch (error) {
        setUser(null);
      }
    };
    checkFavoriteStatus();
  }, [movie.id]);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      await UserEntity.login();
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        const userFavorites = await UserFavorite.filter({ user_email: user.email, movie_id: movie.id });
        if (userFavorites.length > 0) {
          await UserFavorite.delete(userFavorites[0].id);
        }
        setIsFavorite(false);
      } else {
        await UserFavorite.create({ user_email: user.email, movie_id: movie.id });
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
        {movie.poster && movie.poster !== 'N/A' ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        <div className="w-full h-full flex items-center justify-center" style={{ display: movie.poster && movie.poster !== 'N/A' ? 'none' : 'flex' }}>
          <Play className="w-16 h-16 text-slate-500" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <div className="absolute top-3 right-3">
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleFavorite}
              disabled={isLoading}
            >
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white/80'}`} />
            </Button>
          </div>
          
          {movie.imdb_rating && movie.imdb_rating !== 'N/A' && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-black/50 backdrop-blur-sm text-slate-100 border-none">
                <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                {movie.imdb_rating}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-slate-200 font-bold text-base mb-2 line-clamp-1">
          {movie.title}
        </h3>
        
        <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
          {movie.year && movie.year !== 'N/A' && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {movie.year}
            </div>
          )}
          {movie.runtime && movie.runtime !== 'N/A' && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {movie.runtime}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {movie.ai_emotions && movie.ai_emotions.slice(0, 2).map(emotion => (
            <Badge
              key={emotion}
              variant="outline"
              className="text-xs bg-slate-700/50 text-slate-300 border-slate-600 capitalize"
            >
              {emotion}
            </Badge>
          ))}
          {formatGenres(movie.genre).slice(0, 1).map(genre => (
             <Badge
              key={genre}
              variant="outline"
              className="text-xs bg-slate-700/50 text-slate-300 border-slate-600"
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
