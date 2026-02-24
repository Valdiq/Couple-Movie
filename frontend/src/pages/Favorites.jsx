
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Star, Loader2, Eye, BookmarkCheck, Film } from "lucide-react";
import { UserFavorite } from "@/entities/UserFavorite";
import { User } from "@/entities/User";
import MovieDetails from "../components/movie/MovieDetails";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatWidget from "../components/chat/ChatWidget";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/AuthContext';
import Pagination from "../components/ui/Pagination";

const ITEMS_PER_PAGE = 15;

function StarRating({ rating, onChange, disabled, size = 'md' }) {
  const [hover, setHover] = useState(null);
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(starNum => {
        const halfVal = starNum - 0.5;
        const fullVal = starNum;
        const currentRating = hover !== null ? hover : (rating || 0);
        const isHalfFilled = currentRating >= halfVal && currentRating < fullVal;
        const isFullFilled = currentRating >= fullVal;

        return (
          <div key={starNum} className={`relative ${starSize}`} style={{ cursor: disabled ? 'default' : 'pointer' }}>
            <div
              className="absolute inset-0 w-1/2 overflow-hidden z-10"
              onMouseEnter={() => !disabled && setHover(halfVal)}
              onMouseLeave={() => !disabled && setHover(null)}
              onClick={(e) => { e.stopPropagation(); !disabled && onChange(halfVal); }}
            >
              <Star className={`${starSize} transition-colors ${(isHalfFilled || isFullFilled) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
            </div>
            <div
              className="absolute inset-0 z-10"
              style={{ clipPath: 'inset(0 0 0 50%)' }}
              onMouseEnter={() => !disabled && setHover(fullVal)}
              onMouseLeave={() => !disabled && setHover(null)}
              onClick={(e) => { e.stopPropagation(); !disabled && onChange(fullVal); }}
            >
              <Star className={`${starSize} transition-colors ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
            </div>
            <Star className={`${starSize} ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : isHalfFilled ? 'text-slate-600' : 'text-slate-600'}`} />
          </div>
        );
      })}
      {(rating || 0) > 0 && (
        <span className="text-xs text-yellow-400 ml-1 font-semibold">{rating}</span>
      )}
    </div>
  );
}

export default function Favorites() {
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { loadFavorites(); }, [authUser]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        const favs = await UserFavorite.list();
        setFavorites(Array.isArray(favs) ? favs : []);
      }
    } catch (error) { console.error("Error loading favorites:", error); }
    setIsLoading(false);
  };

  const removeFavorite = async (imdbId) => {
    try {
      await UserFavorite.remove(imdbId);
      setFavorites(prev => prev.filter(fav => fav.imdb_id !== imdbId));
    } catch (error) { console.error("Error removing favorite:", error); }
  };

  const toggleWatchStatus = async (fav) => {
    const newStatus = fav.watch_status === 'WATCHED' ? 'PLAN_TO_WATCH' : 'WATCHED';
    try {
      await UserFavorite.updateStatus(fav.imdb_id, { watch_status: newStatus });
      setFavorites(prev => prev.map(f =>
        f.imdb_id === fav.imdb_id ? { ...f, watch_status: newStatus, user_rating: newStatus === 'PLAN_TO_WATCH' ? null : f.user_rating } : f
      ));
    } catch (error) { console.error("Error updating status:", error); }
  };

  const handleRating = async (fav, rating) => {
    try {
      await UserFavorite.updateStatus(fav.imdb_id, { user_rating: rating, watch_status: 'WATCHED' });
      setFavorites(prev => prev.map(f =>
        f.imdb_id === fav.imdb_id ? { ...f, user_rating: rating, watch_status: 'WATCHED' } : f
      ));
    } catch (error) { console.error("Error setting rating:", error); }
  };

  const handleMovieSelect = (fav) => {
    setSelectedMovie({ imdbID: fav.imdb_id, id: fav.imdb_id, title: fav.title, poster: fav.poster, year: fav.year, genre: fav.genre });
    setIsDetailsOpen(true);
  };

  if (isLoadingAuth || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Please log in to view your favorites</h2>
          <a href="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold">Log In</a>
        </div>
      </div>
    );
  }

  const filteredFavorites = activeTab === 'all' ? favorites
    : activeTab === 'watched' ? favorites.filter(f => f.watch_status === 'WATCHED')
      : favorites.filter(f => f.watch_status !== 'WATCHED');

  const watchedCount = favorites.filter(f => f.watch_status === 'WATCHED').length;
  const planCount = favorites.filter(f => f.watch_status !== 'WATCHED').length;
  const totalPages = Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE);
  const paginatedFavorites = filteredFavorites.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen py-8 pb-20 md:pb-8 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-block bg-slate-800/50 p-3 rounded-full mb-4 border border-slate-700"><Heart className="w-8 h-8 text-rose-500 fill-current" /></div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100">Your Favorites</h1>
        </motion.div>

        {/* Stats + Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/80">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center"><h3 className="text-2xl font-bold text-slate-100">{favorites.length}</h3><p className="text-slate-400 text-xs">Total</p></div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div className="text-center"><h3 className="text-2xl font-bold text-green-400">{watchedCount}</h3><p className="text-slate-400 text-xs">Watched</p></div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div className="text-center"><h3 className="text-2xl font-bold text-blue-400">{planCount}</h3><p className="text-slate-400 text-xs">Plan to Watch</p></div>
            </div>
            <div className="flex gap-2 justify-center">
              {[{ key: 'all', label: 'All', count: favorites.length }, { key: 'plan', label: 'Plan to Watch', count: planCount }, { key: 'watched', label: 'Watched', count: watchedCount }].map(tab => (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {filteredFavorites.length > 0 && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {paginatedFavorites.map((fav, index) => (
                <motion.div key={fav.id || fav.imdb_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="relative group">
                  <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all cursor-pointer" onClick={() => handleMovieSelect(fav)}>
                    <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                      {fav.poster && fav.poster !== 'N/A' && fav.poster !== '' ? (
                        <img src={fav.poster} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700"><Film className="w-16 h-16 text-slate-500" /></div>
                      )}
                      {/* Remove */}
                      <button className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm hover:bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); removeFavorite(fav.imdb_id); }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      <h3 className="text-slate-200 font-semibold text-sm line-clamp-2">{fav.title || 'Untitled'}</h3>
                      {fav.year && <p className="text-slate-500 text-xs">{fav.year}</p>}

                      {/* PROMINENT STATUS BUTTON */}
                      <button
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${fav.watch_status === 'WATCHED'
                          ? 'bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30'
                          : 'bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30'
                          }`}
                        onClick={(e) => { e.stopPropagation(); toggleWatchStatus(fav); }}
                        title={fav.watch_status === 'WATCHED' ? 'Click to move back to Plan to Watch' : 'Click to mark as Watched'}
                      >
                        {fav.watch_status === 'WATCHED' ? <><Eye className="w-3.5 h-3.5" /> ✓ Watched</> : <><Eye className="w-3.5 h-3.5" /> Mark as Watched</>}
                      </button>

                      {/* STAR RATING for watched */}
                      {fav.watch_status === 'WATCHED' && (
                        <div onClick={(e) => e.stopPropagation()} className="pt-1">
                          <p className="text-slate-500 text-[10px] mb-1">Your Rating:</p>
                          <StarRating rating={fav.user_rating} onChange={(r) => handleRating(fav, r)} disabled={false} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {filteredFavorites.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

        {filteredFavorites.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              {activeTab === 'all' ? 'No favorites yet' : activeTab === 'watched' ? 'No watched movies' : 'Plan to Watch is empty'}
            </h3>
            {activeTab === 'all' && (
              <Link to={createPageUrl("Search")}><span className="inline-block px-6 py-3 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold">Discover Movies</span></Link>
            )}
          </motion.div>
        )}
      </div>
      <MovieDetails movie={selectedMovie} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      <ChatWidget />
    </div>
  );
}
