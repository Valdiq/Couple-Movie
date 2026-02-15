
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, Clock, Calendar, Play, Users, Award, Film, Tv, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserFavorite } from "@/entities/UserFavorite";
import { User as UserEntity } from "@/entities/User";

export default function MovieDetails({ movie, isOpen, onClose }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!movie || !isOpen) return;
      
      // Reset state for new movie
      setIsFavorite(false);
      setIsLoading(true);

      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
        if (currentUser && movie.id) {
          const userFavorites = await UserFavorite.filter({ user_email: currentUser.email, movie_id: movie.id });
          setIsFavorite(userFavorites.length > 0);
        }
      } catch (error) {
        // Not logged in or error fetching user
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkFavoriteStatus();
  }, [movie, isOpen]);

  const handleFavorite = async () => {
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

  if (!movie) return null;

  const formatGenres = (genreString) => {
    if (!genreString) return [];
    return genreString.split(',').map(g => g.trim());
  };

  const formatCast = (castString) => {
    if (!castString) return [];
    return castString.split(',').map(c => c.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 text-slate-300 rounded-3xl border border-slate-700/50 max-w-5xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-1/2">
                {movie.poster && movie.poster !== 'N/A' && (
                  <img src={movie.poster} alt="" className="w-full h-full object-cover opacity-10 blur-lg" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900 to-slate-900" />
              </div>
              
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-slate-300 hover:text-white rounded-full z-10"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="relative flex flex-col lg:flex-row gap-8 p-8">
                <div className="lg:w-72 flex-shrink-0 mt-8 lg:mt-0">
                  {movie.poster && movie.poster !== 'N/A' ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full rounded-2xl shadow-2xl shadow-black/40"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                      {movie.type === 'series' ? (
                        <Tv className="w-24 h-24 text-slate-600" />
                      ) : (
                        <Film className="w-24 h-24 text-slate-600" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-6 pt-4">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-100 pr-12">
                      {movie.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-slate-400">
                      {movie.year && movie.year !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {movie.year}
                        </div>
                      )}
                      {movie.runtime && movie.runtime !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {movie.runtime}
                        </div>
                      )}
                      {movie.rated && movie.rated !== 'N/A' && (
                        <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                          {movie.rated}
                        </Badge>
                      )}
                      {movie.type && (
                        <div className="flex items-center gap-2 capitalize">
                          {movie.type === 'series' ? <Tv className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {movie.type}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                      {movie.imdb_rating && movie.imdb_rating !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-slate-200 font-semibold text-lg">{movie.imdb_rating}</span>
                          {movie.imdb_votes && movie.imdb_votes !== 'N/A' && (
                            <span className="text-slate-400 text-sm">({movie.imdb_votes})</span>
                          )}
                        </div>
                      )}
                      {movie.metascore && movie.metascore !== 'N/A' && (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700/50">
                          Metascore: {movie.metascore}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 space-y-8 -mt-4">
               {movie.plot && movie.plot !== 'N/A' && (
                  <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
                    {movie.plot}
                  </p>
                )}

              <div className="flex gap-4">
                 <Button
                  onClick={handleFavorite}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700"
                >
                  <Heart className={`w-4 h-4 mr-2 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </Button>
              </div>

              {movie.ai_emotions && movie.ai_emotions.length > 0 && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI-Analyzed Emotions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.ai_emotions.map(emotion => (
                      <Badge
                        key={emotion}
                        className="bg-slate-800 text-slate-300 border-slate-700 capitalize"
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {movie.genre && movie.genre !== 'N/A' && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatGenres(movie.genre).map(genre => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="bg-slate-800 text-slate-300 border-slate-700"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {movie.actors && movie.actors !== 'N/A' && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cast
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formatCast(movie.actors).slice(0, 10).map(actor => (
                      <Badge
                        key={actor}
                        variant="outline"
                        className="bg-indigo-900/50 text-indigo-300 border-indigo-700/50"
                      >
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-800">
                {movie.director && movie.director !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Director</h3>
                    <p className="text-slate-300">{movie.director}</p>
                  </div>
                )}
                {movie.writer && movie.writer !== 'N/A' && (
                   <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Writer(s)</h3>
                    <p className="text-slate-300">{movie.writer}</p>
                  </div>
                )}
                {movie.language && movie.language !== 'N/A' && (
                   <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Languages</h3>
                    <p className="text-slate-300">{movie.language}</p>
                  </div>
                )}
                {movie.country && movie.country !== 'N/A' && (
                   <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Country</h3>
                    <p className="text-slate-300">{movie.country}</p>

                  </div>
                )}
              </div>

              {movie.awards && movie.awards !== 'N/A' && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Awards
                  </h3>
                  <p className="text-slate-400 text-sm">{movie.awards}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
