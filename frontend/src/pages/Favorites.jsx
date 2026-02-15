
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Star, Eye, CheckCircle } from "lucide-react"; // Added Eye, CheckCircle import
import { Button } from "@/components/ui/button";
import { UserFavorite } from "@/entities/UserFavorite";
import { Movie } from "@/entities/Movie";
import { User } from "@/entities/User";
// Still needed for MovieDetails, but not for the grid items themselves
import MovieDetails from "../components/movie/MovieDetails";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatWidget from "../components/chat/ChatWidget";
import StarRating from "../components/movie/StarRating";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // New Import

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const userFavorites = await UserFavorite.filter({ user_email: currentUser.email });
      setFavorites(userFavorites);
      
      // Load the actual movie data for each favorite
      // Filter out any null/undefined from movieResults, as filter might return empty array if no match
      const moviePromises = userFavorites.map(fav => Movie.filter({ id: fav.movie_id }));
      const movieResults = await Promise.all(moviePromises);
      const favoriteMovies = movieResults.flat().filter(movie => movie); // Ensure actual movie objects are loaded
      
      setMovies(favoriteMovies);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
    setIsLoading(false);
  };

  const removeFavorite = async (movieId) => {
    try {
      const favoriteToRemove = favorites.find(fav => fav.movie_id === movieId);
      if (favoriteToRemove) {
        await UserFavorite.delete(favoriteToRemove.id);
        setFavorites(prev => prev.filter(fav => fav.movie_id !== movieId));
        setMovies(prev => prev.filter(movie => movie.id !== movieId));
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const updateFavoriteRating = async (favoriteId, rating) => {
    try {
      await UserFavorite.update(favoriteId, { rating });
      // Reload favorites to get updated data
      await loadFavorites();
    } catch (error) {
      console.error("Error updating favorite rating:", error);
    }
  };

  const updateFavoriteStatus = async (favoriteId, status) => {
    if (!status) return; // Do nothing if the value is cleared
    try {
      const updateData = { status };
      if (status === 'watched') {
        updateData.date_watched = new Date().toISOString();
      } else {
        updateData.date_watched = null; // Clear date if status changes from watched
      }
      await UserFavorite.update(favoriteId, updateData);
      await loadFavorites();
    } catch (error) {
      console.error("Error updating favorite status:", error);
    }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Please log in to view your favorites</h2>
          <Button onClick={() => User.login()} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-20 md:pb-8 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-slate-800/50 p-3 rounded-full mb-4 border border-slate-700 shadow-sm">
            <Heart className="w-8 h-8 text-rose-500 fill-current" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100">
            Your Favorites
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-4">
            Your personal collection of movies and shows. Rate and track your progress.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/80">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <h3 className="text-3xl font-bold text-slate-100">{favorites.length}</h3>
                <p className="text-slate-400">Total Favorites</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-100">
                  {favorites.filter(fav => fav.status === 'watched').length}
                </h3>
                <p className="text-slate-400">Watched</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-100">
                  {favorites.filter(fav => fav.status === 'want_to_watch').length}
                </h3>
                <p className="text-slate-400">Want to Watch</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-100">
                  {favorites.filter(fav => fav.rating > 0).length > 0 
                    ? (favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) / favorites.filter(fav => fav.rating > 0).length).toFixed(1)
                    : '—'
                  }
                </h3>
                <p className="text-slate-400">Avg Rating</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl aspect-[2/3] animate-pulse" />
            ))}
          </div>
        )}

        {/* Favorites Grid */}
        {!isLoading && movies.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {movies.map((movie, index) => {
                const favorite = favorites.find(fav => fav.movie_id === movie.id);
                
                return (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all flex flex-col h-full">
                      {/* Movie Card */}
                      <div 
                        onClick={() => handleMovieSelect(movie)}
                        className="cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                          {movie.poster && movie.poster !== 'N/A' ? (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-700">
                              <Star className="w-16 h-16 text-slate-500" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className={`text-xs pointer-events-none ${
                              favorite?.status === 'watched' 
                                ? 'bg-green-900/80 text-green-300 border-green-700/50' 
                                : 'bg-blue-900/80 text-blue-300 border-blue-700/50'
                            }`}>
                              {favorite?.status === 'watched' ? 'Watched' : 'Want to Watch'}
                            </Badge>
                          </div>

                          {/* Remove Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm hover:bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite(movie.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="p-4">
                          <h3 className="text-slate-200 font-bold text-sm mb-2 line-clamp-2 h-10">
                            {movie.title}
                          </h3>
                          
                          {movie.year && (
                            <p className="text-slate-400 text-xs">{movie.year}</p>
                          )}
                        </div>
                      </div>

                      {/* Interactive Controls */}
                      <div className="px-4 pb-4 mt-auto space-y-4 border-t border-slate-700/50 pt-4">
                        {/* Rating */}
                        <div>
                          <label className="text-slate-400 text-xs font-medium mb-1.5 block">Your Rating</label>
                          <StarRating
                            rating={favorite?.rating || 0}
                            onRatingChange={(rating) => updateFavoriteRating(favorite.id, rating)}
                            size="sm"
                          />
                        </div>

                        {/* Status Toggle */}
                        <div>
                          <label className="text-slate-400 text-xs font-medium mb-1.5 block">Status</label>
                          <ToggleGroup
                            type="single"
                            value={favorite?.status}
                            onValueChange={(value) => updateFavoriteStatus(favorite.id, value)}
                            className="w-full"
                            aria-label="Movie status"
                          >
                            <ToggleGroupItem value="want_to_watch" aria-label="Want to watch" className="flex-1 data-[state=on]:bg-blue-900/50 data-[state=on]:text-blue-300">
                              <Eye className="w-4 h-4 mr-2" />
                              Want to
                            </ToggleGroupItem>
                            <ToggleGroupItem value="watched" aria-label="Watched" className="flex-1 data-[state=on]:bg-green-900/50 data-[state=on]:text-green-300">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Watched
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>

                        {favorite?.status === 'watched' && favorite?.date_watched && (
                          <p className="text-slate-500 text-xs pt-2 text-center">
                            Watched on {new Date(favorite.date_watched).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!isLoading && movies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">No favorites yet</h3>
            <p className="text-slate-400 mb-6">
              Start exploring and add movies to your favorites by clicking the heart icon.
            </p>
            <Link to={createPageUrl("Home")}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                Discover Movies
                </Button>
            </Link>
          </motion.div>
        )}
      </div>

      <MovieDetails
        movie={selectedMovie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <ChatWidget />
    </div>
  );
}
