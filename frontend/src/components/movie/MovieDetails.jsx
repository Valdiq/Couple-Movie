
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, Clock, Calendar, Play, Users, Award, Film, Tv, Sparkles, Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserFavorite } from "@/entities/UserFavorite";
import { User as UserEntity } from "@/entities/User";
import { Movie } from "@/entities/Movie";
import { coupleMovieService } from "@/services/coupleMovieService";

export default function MovieDetails({ movie, isOpen, onClose }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [fullMovie, setFullMovie] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [addingToCouple, setAddingToCouple] = useState(false);
  const [coupleMessage, setCoupleMessage] = useState(null);

  const displayMovie = fullMovie || movie;
  const movieImdbId = displayMovie?.id || displayMovie?.imdbID || displayMovie?.imdb_id || '';

  useEffect(() => {
    if (!movie || !isOpen) {
      setFullMovie(null);
      return;
    }

    // Start fetching full details immediately in background
    const fetchAll = async () => {
      setIsLoadingDetails(true);
      setIsFavorite(false);
      setCoupleMessage(null);

      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
        if (currentUser && movieImdbId) {
          const fav = await UserFavorite.check(movieImdbId);
          setIsFavorite(!!fav);
        }
      } catch (error) {
        setUser(null);
      }

      // Fetch full details from backend
      if (movieImdbId) {
        try {
          const fullDetails = await Movie.getDetails(movieImdbId);
          if (fullDetails) {
            setFullMovie(fullDetails);
          }
        } catch (e) {
          console.error("Failed to load full details", e);
        }
      }
      setIsLoadingDetails(false);
    };

    fetchAll();
  }, [movie, isOpen]);

  const handleFavorite = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!movieImdbId) {
      console.error("No imdb_id available for this movie");
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await UserFavorite.remove(movieImdbId);
        setIsFavorite(false);
      } else {
        await UserFavorite.add({
          imdb_id: movieImdbId,
          title: displayMovie.title || '',
          poster: displayMovie.poster || '',
          year: displayMovie.year || '',
          genre: displayMovie.genre || ''
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error handling favorite:", error);
    }
    setIsLoading(false);
  };

  const handleAddToCouple = async () => {
    if (!user) return;
    setAddingToCouple(true);
    setCoupleMessage(null);
    try {
      await coupleMovieService.add({
        imdb_id: movieImdbId,
        title: displayMovie.title || '',
        poster: displayMovie.poster || '',
        year: displayMovie.year || '',
        genre: displayMovie.genre || ''
      });
      setCoupleMessage({ type: 'success', text: 'Added to Couple Watchlist!' });
    } catch (error) {
      setCoupleMessage({ type: 'error', text: 'Failed to add to couple list' });
    }
    setAddingToCouple(false);
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
                {displayMovie.poster && displayMovie.poster !== 'N/A' && (
                  <img src={displayMovie.poster} alt="" className="w-full h-full object-cover opacity-10 blur-lg" />
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
                  {displayMovie.poster && displayMovie.poster !== 'N/A' ? (
                    <img
                      src={displayMovie.poster}
                      alt={displayMovie.title}
                      className="w-full rounded-2xl shadow-2xl shadow-black/40"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                      {displayMovie.type === 'series' ? (
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
                      {displayMovie.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-slate-400">
                      {displayMovie.year && displayMovie.year !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {displayMovie.year}
                        </div>
                      )}
                      {displayMovie.runtime && displayMovie.runtime !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {displayMovie.runtime}
                        </div>
                      )}
                      {displayMovie.rated && displayMovie.rated !== 'N/A' && (
                        <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                          {displayMovie.rated}
                        </Badge>
                      )}
                      {displayMovie.type && (
                        <div className="flex items-center gap-2 capitalize">
                          {displayMovie.type === 'series' ? <Tv className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {displayMovie.type}
                        </div>
                      )}
                      {isLoadingDetails && (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                      {displayMovie.imdb_rating && displayMovie.imdb_rating !== 'N/A' && displayMovie.imdb_rating > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-slate-200 font-semibold text-lg">{displayMovie.imdb_rating}</span>
                          {displayMovie.imdb_votes && displayMovie.imdb_votes !== 'N/A' && (
                            <span className="text-slate-400 text-sm">({displayMovie.imdb_votes})</span>
                          )}
                        </div>
                      )}
                      {displayMovie.metascore && displayMovie.metascore !== 'N/A' && (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700/50">
                          Metascore: {displayMovie.metascore}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 space-y-8 -mt-4">
              {displayMovie.plot && displayMovie.plot !== 'N/A' && (
                <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
                  {displayMovie.plot}
                </p>
              )}

              <div className="flex gap-4 flex-wrap">
                <Button
                  onClick={handleFavorite}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 min-w-[200px] bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700"
                >
                  <Heart className={`w-4 h-4 mr-2 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </Button>
                {user && (
                  <Button
                    onClick={handleAddToCouple}
                    disabled={addingToCouple}
                    variant="outline"
                    className="flex-1 min-w-[200px] bg-slate-800/50 hover:bg-purple-900/30 text-slate-200 border-slate-700 hover:border-purple-500/50"
                  >
                    {addingToCouple ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4 mr-2 text-purple-400" />
                    )}
                    Add to Couple List
                  </Button>
                )}
              </div>

              {coupleMessage && (
                <div className={`p-3 rounded-xl text-center text-sm ${coupleMessage.type === 'success'
                  ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                  : 'bg-red-900/30 border border-red-500/30 text-red-300'
                  }`}>
                  {coupleMessage.text}
                </div>
              )}

              {displayMovie.ai_emotions && displayMovie.ai_emotions.length > 0 && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI-Analyzed Emotions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {displayMovie.ai_emotions.map(emotion => (
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

              {displayMovie.genre && displayMovie.genre !== 'N/A' && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatGenres(displayMovie.genre).map(genre => (
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

              {displayMovie.actors && displayMovie.actors !== 'N/A' && (
                <div>
                  <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cast
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formatCast(displayMovie.actors).slice(0, 10).map(actor => (
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
                {displayMovie.director && displayMovie.director !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Director</h3>
                    <p className="text-slate-300">{displayMovie.director}</p>
                  </div>
                )}
                {displayMovie.writer && displayMovie.writer !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Writer(s)</h3>
                    <p className="text-slate-300">{displayMovie.writer}</p>
                  </div>
                )}
                {displayMovie.language && displayMovie.language !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Languages</h3>
                    <p className="text-slate-300">{displayMovie.language}</p>
                  </div>
                )}
                {displayMovie.country && displayMovie.country !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-slate-500 font-semibold mb-1">Country</h3>
                    <p className="text-slate-300">{displayMovie.country}</p>

                  </div>
                )}
              </div>

              {displayMovie.awards && displayMovie.awards !== 'N/A' && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Awards
                  </h3>
                  <p className="text-slate-400 text-sm">{displayMovie.awards}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
