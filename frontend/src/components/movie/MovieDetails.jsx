import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, Clock, Calendar, Play, Users, Award, Tv, Sparkles, Loader2, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserFavorite } from "@/entities/UserFavorite";
import { useAuth } from "@/lib/AuthContext";
import { Movie } from "@/entities/Movie";
import { coupleMovieService } from "@/services/coupleMovieService";
import AppleEmoji from "@/components/ui/AppleEmoji";

export default function MovieDetails({ movie, isOpen, onClose }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, userFavorites, addFavoriteId, removeFavoriteId, myCoupleMovieIds, addCoupleMovieId } = useAuth();
  const [fullMovie, setFullMovie] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [coupleMessage, setCoupleMessage] = useState(null);
  const [isInCoupleList, setIsInCoupleList] = useState(false);
  const [imgError, setImgError] = useState(false);
  // Track whether the user has already clicked a couple-list action for this open session
  // so background API checks don't overwrite optimistic updates
  const coupleActionTakenRef = useRef(false);

  const displayMovie = fullMovie || movie;
  // Derive the IMDB ID from the stable movie prop, NOT displayMovie.
  // This prevents re-triggering the effect when fullMovie loads.
  const movieImdbId = movie?.id || movie?.imdbID || movie?.imdb_id || '';

  useEffect(() => {
    if (!movie || !isOpen) {
      setFullMovie(null);
      return;
    }

    // Reset action flag for this new open session
    coupleActionTakenRef.current = false;

    // Fast init from the passed down movie object (especially useful in lists)
    setIsFavorite(movie.is_favorite === true);
    setIsInCoupleList(movie.in_couple_list === true);
    setCoupleMessage(null);
    setImgError(false);

    const imdbId = movie?.id || movie?.imdbID || movie?.imdb_id || '';
    let cancelled = false;

    if (user && imdbId) {
      setIsFavorite(userFavorites.includes(imdbId));
      if (!coupleActionTakenRef.current) {
        const inCoupleStr = myCoupleMovieIds.includes(imdbId);
        setIsInCoupleList(inCoupleStr);
        if (movie) movie.in_couple_list = inCoupleStr;
      }
    } else {
      setIsFavorite(false);
      setIsInCoupleList(false);
    }

    const fetchDetails = async () => {
      if (imdbId) {
        setIsLoadingDetails(true);
        try {
          const fullDetails = await Movie.getDetails(imdbId);
          if (!cancelled && fullDetails) setFullMovie(fullDetails);
        } catch (e) { }
        if (!cancelled) setIsLoadingDetails(false);
      }
    };

    fetchDetails();

    return () => { cancelled = true; };
  }, [movie, isOpen]);

  const handleFavorite = async () => {
    if (!user) { window.location.href = '/login'; return; }
    if (!movieImdbId) return;

    const previousState = isFavorite;
    // Optimistic UI update
    setIsFavorite(!isFavorite);

    try {
      if (previousState) {
        await UserFavorite.remove(movieImdbId);
        removeFavoriteId(movieImdbId);
      } else {
        await UserFavorite.add({
          imdb_id: movieImdbId,
          title: displayMovie.title || '',
          poster: displayMovie.poster || '',
          year: displayMovie.year || '',
          genre: displayMovie.genre || ''
        });
        addFavoriteId(movieImdbId);
      }
      // Update the local movie object to cache the value so closing and reopening keeps it
      if (movie) {
        movie.is_favorite = !previousState;
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(previousState);
    }
  };

  const handleAddToCouple = async () => {
    if (!user) return;

    // Mark that the user has taken an action so background checks don't revert us
    coupleActionTakenRef.current = true;
    // Optimistic UI update
    setIsInCoupleList(true);
    setCoupleMessage(null);

    try {
      await coupleMovieService.add({
        imdb_id: movieImdbId
      });
      addCoupleMovieId(movieImdbId);
      setCoupleMessage({ type: 'success', text: 'Added to Couple Watchlist!' });

      // Update local movie object so reopening the modal keeps the correct status
      if (movie) {
        movie.in_couple_list = true;
      }
    } catch (error) {
      coupleActionTakenRef.current = false;
      setIsInCoupleList(false);
      const msg = error.response?.status === 400 ? 'Create a Couple Space first!' : 'Failed to add to couple list';
      setCoupleMessage({ type: 'error', text: msg });
    }
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
            className="bg-card text-foreground rounded-2xl border border-border max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-card">
              <div className="absolute top-0 left-0 w-full h-[80%] overflow-hidden rounded-t-2xl">
                {!imgError && displayMovie.poster && displayMovie.poster !== 'N/A' && (
                  <img src={displayMovie.poster} alt="" loading="lazy" className="w-full h-full object-cover opacity-10 blur-xl scale-110" onError={() => setImgError(true)} />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-card/80 to-card" />
              </div>

              <button
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center glass hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full z-10"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative flex flex-col lg:flex-row gap-8 p-8">
                <div className="lg:w-72 flex-shrink-0 mt-8 lg:mt-0">
                  {!imgError && displayMovie.poster && displayMovie.poster !== 'N/A' ? (
                    <img
                      src={displayMovie.poster}
                      alt={displayMovie.title}
                      loading="lazy"
                      className="w-full rounded-xl shadow-2xl shadow-black/40"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-secondary rounded-xl flex flex-col items-center justify-center border border-border gap-4 p-4 text-center">
                      <div className="text-7xl">
                        <AppleEmoji emoji="🍿" />
                      </div>
                      <span className="text-lg font-medium text-muted-foreground">
                        {displayMovie.title || "Movie"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-6 pt-4">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-foreground pr-12">
                      {displayMovie.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-muted-foreground">
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

                      {displayMovie.type && (
                        <div className="flex items-center gap-2 capitalize">
                          {displayMovie.type === 'series' ? <Tv className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {displayMovie.type}
                        </div>
                      )}
                      {isLoadingDetails && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                      {displayMovie.imdb_rating && displayMovie.imdb_rating !== 'N/A' && displayMovie.imdb_rating > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-foreground font-semibold text-lg">{displayMovie.imdb_rating}</span>
                          {displayMovie.imdb_votes && displayMovie.imdb_votes !== 'N/A' && (
                            <span className="text-muted-foreground text-sm">({displayMovie.imdb_votes})</span>
                          )}
                        </div>
                      )}

                      {displayMovie.awards && displayMovie.awards !== 'N/A' && (
                        <div className="flex items-center gap-2 border-l border-border pl-6">
                          {/\b(win|wins|won)\b/i.test(displayMovie.awards) ? (
                            <Award className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                          ) : /\b(nomination|nominated|nominations)\b/i.test(displayMovie.awards) ? (
                            <Award className="w-5 h-5 text-slate-300 fill-slate-300/20" />
                          ) : <Award className="w-5 h-5 text-muted-foreground" />}
                          <span className="text-muted-foreground text-sm">{displayMovie.awards}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative px-8 pb-8 space-y-8 mt-4 bg-card">
              {displayMovie.plot && displayMovie.plot !== 'N/A' && (
                <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
                  {displayMovie.plot}
                </p>
              )}

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handleFavorite}
                  disabled={isLoading}
                  className="flex-1 min-w-[200px] flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium hover:bg-secondary text-foreground"
                >
                  <Heart className={`w-4 h-4 mr-2 transition-colors ${isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
                {user && (
                  <button
                    onClick={handleAddToCouple}
                    disabled={isInCoupleList}
                    className="flex-1 min-w-[200px] flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:border-primary/50 text-foreground disabled:opacity-50"
                  >
                    {isInCoupleList ? (
                      <Users className="w-4 h-4 mr-2 text-primary" />
                    ) : (
                      <PlusCircle className="w-4 h-4 mr-2 text-primary" />
                    )}
                    {isInCoupleList ? 'In Couple List' : 'Add to Couple List'}
                  </button>
                )}
              </div>

              {coupleMessage && (
                <div className={`p-3 rounded-xl text-center text-sm border ${coupleMessage.type === 'success'
                  ? 'bg-green-900/20 border-green-500/30 text-green-400'
                  : 'bg-red-900/20 border-red-500/30 text-red-400'
                  }`}>
                  {coupleMessage.text}
                </div>
              )}

              {displayMovie.ai_emotions && displayMovie.ai_emotions.length > 0 && (
                <div>
                  <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI-Analyzed Emotions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {displayMovie.ai_emotions.map(emotion => (
                      <Badge key={emotion} variant="secondary" className="text-muted-foreground capitalize">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {displayMovie.genre && displayMovie.genre !== 'N/A' && (
                <div>
                  <h3 className="text-foreground font-semibold mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatGenres(displayMovie.genre).map(genre => (
                      <Badge key={genre} variant="secondary" className="text-muted-foreground">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {displayMovie.actors && displayMovie.actors !== 'N/A' && (
                <div>
                  <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cast
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formatCast(displayMovie.actors).slice(0, 10).map(actor => (
                      <Badge key={actor} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-border">
                {displayMovie.director && displayMovie.director !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-muted-foreground font-semibold mb-1">Director</h3>
                    <p className="text-foreground">{displayMovie.director}</p>
                  </div>
                )}
                {displayMovie.writer && displayMovie.writer !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-muted-foreground font-semibold mb-1">Writer(s)</h3>
                    <p className="text-foreground">{displayMovie.writer}</p>
                  </div>
                )}
                {displayMovie.language && displayMovie.language !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-muted-foreground font-semibold mb-1">Languages</h3>
                    <p className="text-foreground">{displayMovie.language}</p>
                  </div>
                )}
                {displayMovie.country && displayMovie.country !== 'N/A' && (
                  <div className="text-sm">
                    <h3 className="text-muted-foreground font-semibold mb-1">Country</h3>
                    <p className="text-foreground">{displayMovie.country}</p>
                  </div>
                )}
              </div>

              {displayMovie.awards && displayMovie.awards !== 'N/A' && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Awards
                  </h3>
                  <p className="text-muted-foreground text-sm">{displayMovie.awards}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
