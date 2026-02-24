import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Star, Loader2, Eye, Film } from "lucide-react";
import { UserFavorite } from "@/entities/UserFavorite";
import { User } from "@/entities/User";
import MovieDetails from "../components/movie/MovieDetails";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatWidget from "../components/chat/ChatWidget";
import { useAuth } from '@/lib/AuthContext';
import Pagination from "../components/ui/Pagination";
import { Button } from "@/components/ui/button";

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
            <div className="absolute inset-0 w-1/2 overflow-hidden z-10"
              onMouseEnter={() => !disabled && setHover(halfVal)}
              onMouseLeave={() => !disabled && setHover(null)}
              onClick={(e) => { e.stopPropagation(); !disabled && onChange(halfVal); }}>
              <Star className={`${starSize} transition-colors ${(isHalfFilled || isFullFilled) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
            </div>
            <div className="absolute inset-0 z-10" style={{ clipPath: 'inset(0 0 0 50%)' }}
              onMouseEnter={() => !disabled && setHover(fullVal)}
              onMouseLeave={() => !disabled && setHover(null)}
              onClick={(e) => { e.stopPropagation(); !disabled && onChange(fullVal); }}>
              <Star className={`${starSize} transition-colors ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
            </div>
            <Star className={`${starSize} ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
          </div>
        );
      })}
      {(rating || 0) > 0 && <span className="text-xs text-yellow-400 ml-1 font-semibold">{rating}</span>}
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
    } catch (error) { }
    setIsLoading(false);
  };

  const removeFavorite = async (imdbId) => {
    try { await UserFavorite.remove(imdbId); setFavorites(prev => prev.filter(fav => fav.imdb_id !== imdbId)); }
    catch (error) { }
  };

  const toggleWatchStatus = async (fav) => {
    const newStatus = fav.watch_status === 'WATCHED' ? 'PLAN_TO_WATCH' : 'WATCHED';
    try {
      await UserFavorite.updateStatus(fav.imdb_id, { watch_status: newStatus });
      setFavorites(prev => prev.map(f =>
        f.imdb_id === fav.imdb_id ? { ...f, watch_status: newStatus, user_rating: newStatus === 'PLAN_TO_WATCH' ? null : f.user_rating } : f
      ));
    } catch (error) { }
  };

  const handleRating = async (fav, rating) => {
    try {
      await UserFavorite.updateStatus(fav.imdb_id, { user_rating: rating, watch_status: 'WATCHED' });
      setFavorites(prev => prev.map(f =>
        f.imdb_id === fav.imdb_id ? { ...f, user_rating: rating, watch_status: 'WATCHED' } : f
      ));
    } catch (error) { }
  };

  const handleMovieSelect = (fav) => {
    setSelectedMovie({ imdbID: fav.imdb_id, id: fav.imdb_id, title: fav.title, poster: fav.poster, year: fav.year, genre: fav.genre });
    setIsDetailsOpen(true);
  };

  if (isLoadingAuth || isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-accent" />
          <h2 className="mb-4 text-2xl font-bold text-foreground">Please log in to view your favorites</h2>
          <a href="/login" className="inline-block rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground">Log In</a>
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
    <div className="min-h-screen bg-background pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Heart className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            My <span className="gradient-text">Favorites</span>
          </h1>
        </motion.div>

        {/* Stats + Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-center gap-6">
              <div className="text-center"><h3 className="text-2xl font-bold text-foreground">{favorites.length}</h3><p className="text-xs text-muted-foreground">Total</p></div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center"><h3 className="text-2xl font-bold text-green-400">{watchedCount}</h3><p className="text-xs text-muted-foreground">Watched</p></div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center"><h3 className="text-2xl font-bold text-primary">{planCount}</h3><p className="text-xs text-muted-foreground">Plan to Watch</p></div>
            </div>
            <div className="flex justify-center gap-2">
              {[
                { key: 'all', label: 'All', count: favorites.length },
                { key: 'plan', label: 'Plan to Watch', count: planCount },
                { key: 'watched', label: 'Watched', count: watchedCount }
              ].map(tab => (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {filteredFavorites.length > 0 && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {paginatedFavorites.map((fav, index) => (
                <motion.div key={fav.id || fav.imdb_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group relative">
                  <div className="cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30" onClick={() => handleMovieSelect(fav)}>
                    <div className="relative aspect-[2/3] overflow-hidden">
                      {fav.poster && fav.poster !== 'N/A' && fav.poster !== '' ? (
                        <img src={fav.poster} alt={fav.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary"><Film className="h-16 w-16 text-muted-foreground" /></div>
                      )}
                      <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-destructive/80 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); removeFavorite(fav.imdb_id); }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 p-3">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{fav.title || 'Untitled'}</h3>
                      {fav.year && <p className="text-xs text-muted-foreground">{fav.year}</p>}

                      <button
                        className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all ${fav.watch_status === 'WATCHED'
                            ? 'border-green-500/30 bg-green-600/20 text-green-400 hover:bg-green-600/30'
                            : 'border-primary/30 bg-primary/20 text-primary hover:bg-primary/30'
                          }`}
                        onClick={(e) => { e.stopPropagation(); toggleWatchStatus(fav); }}
                        title={fav.watch_status === 'WATCHED' ? 'Click to move back to Plan to Watch' : 'Click to mark as Watched'}
                      >
                        {fav.watch_status === 'WATCHED' ? <><Eye className="h-3.5 w-3.5" /> ✓ Watched</> : <><Eye className="h-3.5 w-3.5" /> Mark as Watched</>}
                      </button>

                      {fav.watch_status === 'WATCHED' && (
                        <div onClick={(e) => e.stopPropagation()} className="pt-1">
                          <p className="mb-1 text-[10px] text-muted-foreground">Your Rating:</p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <div className="mb-4 text-5xl">💔</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {activeTab === 'all' ? 'No favorites yet' : activeTab === 'watched' ? 'No watched movies' : 'Plan to Watch is empty'}
            </h3>
            {activeTab === 'all' && (
              <Link to={createPageUrl("Search")}>
                <Button className="mt-4 bg-gradient-to-r from-primary to-accent text-primary-foreground">Discover Movies</Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
      <MovieDetails movie={selectedMovie} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      <ChatWidget />
    </div>
  );
}
