
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Star, Loader2 } from "lucide-react";
import { UserFavorite } from "@/entities/UserFavorite";
import { User } from "@/entities/User";
import MovieDetails from "../components/movie/MovieDetails";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatWidget from "../components/chat/ChatWidget";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/AuthContext';

export default function Favorites() {
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, [authUser]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        const favs = await UserFavorite.list();
        setFavorites(Array.isArray(favs) ? favs : []);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
    setIsLoading(false);
  };

  const removeFavorite = async (imdbId) => {
    try {
      await UserFavorite.remove(imdbId);
      setFavorites(prev => prev.filter(fav => fav.imdb_id !== imdbId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handleMovieSelect = (fav) => {
    setSelectedMovie({
      imdbID: fav.imdb_id,
      title: fav.title,
      poster: fav.poster,
      year: fav.year,
      genre: fav.genre
    });
    setIsDetailsOpen(true);
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Please log in to view your favorites</h2>
          <a href="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity">
            Log In
          </a>
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
            Your personal collection of movies and shows.
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
            <div className="text-center">
              <h3 className="text-3xl font-bold text-slate-100">{favorites.length}</h3>
              <p className="text-slate-400">Total Favorites</p>
            </div>
          </div>
        </motion.div>

        {/* Favorites Grid */}
        {favorites.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {favorites.map((fav, index) => (
                <motion.div
                  key={fav.id || fav.imdb_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative group"
                >
                  <div
                    className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => handleMovieSelect(fav)}
                  >
                    <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                      {fav.poster && fav.poster !== 'N/A' && fav.poster !== '' ? (
                        <img
                          src={fav.poster}
                          alt={fav.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700">
                          <Star className="w-16 h-16 text-slate-500" />
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm hover:bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(fav.imdb_id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3">
                      <h3 className="text-slate-200 font-semibold text-sm line-clamp-2 mb-1">
                        {fav.title || 'Untitled'}
                      </h3>
                      {fav.year && (
                        <p className="text-slate-400 text-xs">{fav.year}</p>
                      )}
                      {fav.genre && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {fav.genre.split(',').slice(0, 2).map(g => (
                            <Badge key={g.trim()} variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                              {g.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {favorites.length === 0 && (
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
            <Link to={createPageUrl("Search")}>
              <span className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity">
                Discover Movies
              </span>
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
