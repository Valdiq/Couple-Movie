import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserEntity } from '@/entities/User';
import { Couple } from '@/entities/Couple';
import { coupleMovieService } from '@/services/coupleMovieService';
import { useAuth } from '@/lib/AuthContext';
import { Heart, Users, Send, UserPlus, Film, X, Check, Loader2, Star, Eye, BookmarkCheck, Trash2, Plus, Unlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MovieDetails from '../components/movie/MovieDetails';

function StarRating({ rating, onChange, disabled, size = 'md', label }) {
  const [hover, setHover] = useState(null);
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div>
      {label && <p className="text-slate-500 text-[10px] mb-0.5">{label}</p>}
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
                onClick={(e) => { e.stopPropagation(); !disabled && onChange && onChange(halfVal); }}>
                <Star className={`${starSize} transition-colors ${(isHalfFilled || isFullFilled) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
              </div>
              <div className="absolute inset-0 z-10" style={{ clipPath: 'inset(0 0 0 50%)' }}
                onMouseEnter={() => !disabled && setHover(fullVal)}
                onMouseLeave={() => !disabled && setHover(null)}
                onClick={(e) => { e.stopPropagation(); !disabled && onChange && onChange(fullVal); }}>
                <Star className={`${starSize} transition-colors ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
              </div>
              <Star className={`${starSize} ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : isHalfFilled ? 'text-slate-600' : 'text-slate-600'}`} />
            </div>
          );
        })}
        {(rating || 0) > 0 && <span className="text-xs text-yellow-400 ml-1 font-semibold">{rating}</span>}
      </div>
    </div>
  );
}

export default function CouplePage() {
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [invites, setInvites] = useState([]);
  const [partnerUsername, setPartnerUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [inviteSending, setInviteSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [sharedMovies, setSharedMovies] = useState([]);
  const [stats, setStats] = useState({ matches: 0, watchlist: 0, watched: 0 });
  const [activeTab, setActiveTab] = useState('watchlist');
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => { loadData(); }, [authUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await UserEntity.me();
      if (currentUser) {
        setUser(currentUser);
        const partnerData = await Couple.getPartner();
        setPartner(partnerData);
        if (partnerData) loadSharedMovies();
        const inviteData = await Couple.getInvites();
        setInvites(inviteData || []);
      }
    } catch (error) { console.error('Error loading couple data:', error); }
    setIsLoading(false);
  };

  const loadSharedMovies = async () => {
    setIsLoadingMovies(true);
    try {
      const movies = await coupleMovieService.list();
      setSharedMovies(Array.isArray(movies) ? movies : []);
      const statsData = await coupleMovieService.stats();
      setStats(statsData);
    } catch (e) { console.error('Error loading shared movies', e); }
    setIsLoadingMovies(false);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!partnerUsername.trim()) return;
    setInviteSending(true); setMessage(null);
    try {
      await Couple.invite(partnerUsername.trim());
      setMessage({ type: 'success', text: `Invitation sent to @${partnerUsername}!` });
      setPartnerUsername('');
    } catch (error) {
      const errMsg = error.response?.data || error.message || 'Failed to send invitation';
      setMessage({ type: 'error', text: typeof errMsg === 'string' ? errMsg : 'Failed to send invitation' });
    }
    setInviteSending(false);
  };

  const handleAcceptInvite = async (requestId) => {
    try { await Couple.acceptInvite(requestId); setMessage({ type: 'success', text: 'Invitation accepted!' }); loadData(); }
    catch (error) { setMessage({ type: 'error', text: 'Failed to accept invitation' }); }
  };

  const handleRejectInvite = async (requestId) => {
    try { await Couple.rejectInvite(requestId); setInvites(invites.filter(inv => inv.id !== requestId)); }
    catch (error) { setMessage({ type: 'error', text: 'Failed to decline invitation' }); }
  };

  const handleRemoveFromShared = async (imdbId) => {
    try { await coupleMovieService.remove(imdbId); setSharedMovies(prev => prev.filter(m => m.imdb_id !== imdbId)); loadSharedMovies(); }
    catch (e) { console.error('Error removing movie:', e); }
  };

  const handleUpdateWatchStatus = async (imdbId, newStatus) => {
    try {
      await coupleMovieService.updateStatus(imdbId, { watch_status: newStatus });
      setSharedMovies(prev => prev.map(m => m.imdb_id === imdbId ? { ...m, watch_status: newStatus } : m));
      loadSharedMovies();
    } catch (e) { console.error('Error updating status:', e); }
  };

  const handleCoupleRate = async (imdbId, rating) => {
    try {
      await coupleMovieService.rate(imdbId, rating);
      setSharedMovies(prev => prev.map(m => m.imdb_id === imdbId ? { ...m, your_rating: rating, watch_status: 'WATCHED' } : m));
      loadSharedMovies();
    } catch (e) { console.error('Error rating movie:', e); }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie({ imdbID: movie.imdb_id, id: movie.imdb_id, title: movie.title, poster: movie.poster, year: movie.year, genre: movie.genre });
    setIsDetailsOpen(true);
  };

  if (isLoadingAuth || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Join the fun!</h2>
          <a href="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold">Login</a>
        </div>
      </div>
    );
  }

  // PAIRED VIEW
  if (partner) {
    const filteredMovies = activeTab === 'matches' ? sharedMovies.filter(m => m.is_match)
      : activeTab === 'watched' ? sharedMovies.filter(m => m.watch_status === 'WATCHED')
        : sharedMovies.filter(m => m.watch_status !== 'WATCHED');

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold"><span className="text-purple-400">Couple</span> <span className="text-pink-400">Space</span></h1>
        </motion.div>

        {/* Partner Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">{(user.firstname || user.full_name || 'U')[0].toUpperCase()}</div>
                <div><p className="text-slate-200 font-medium text-sm">{user.firstname || user.full_name || 'You'}</p><p className="text-slate-500 text-xs">You</p></div>
              </div>
              <div className="flex items-center gap-1 text-slate-600"><span className="w-4 h-px bg-slate-600"></span><Heart className="w-4 h-4 text-pink-400 fill-pink-400" /><span className="w-4 h-px bg-slate-600"></span></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg">{(partner.firstName || partner.username || 'P')[0].toUpperCase()}</div>
                <div>
                  <p className="text-slate-200 font-medium text-sm">{partner.firstName} {partner.lastName}</p>
                  <Badge variant="outline" className="bg-green-900/40 text-green-400 border-green-600/30 text-[10px]">Connected</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center"><p className="text-xl font-bold text-slate-100">{stats.matches}</p><p className="text-slate-500 text-xs">Matches</p></div>
              <div className="text-center"><p className="text-xl font-bold text-slate-100">{stats.watchlist}</p><p className="text-slate-500 text-xs">Watchlist</p></div>
              <div className="text-center"><p className="text-xl font-bold text-slate-100">{stats.watched}</p><p className="text-slate-500 text-xs">Watched</p></div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/30 rounded-2xl p-1.5 border border-slate-700/50 flex gap-1">
          {[{ key: 'matches', label: 'Mutual Picks', icon: Heart, count: stats.matches },
          { key: 'watchlist', label: 'Watchlist', icon: BookmarkCheck, count: stats.watchlist },
          { key: 'watched', label: 'Watched', icon: Eye, count: stats.watched }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}<span className="text-xs opacity-70">{tab.count}</span>
            </button>
          ))}
        </motion.div>

        {/* Movies Grid */}
        {isLoadingMovies ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
        ) : filteredMovies.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie, index) => (
              <motion.div key={movie.id || movie.imdb_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="relative group">
                <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all cursor-pointer" onClick={() => handleMovieSelect(movie)}>
                  <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                    {movie.poster && movie.poster !== 'N/A' ? (
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-700"><Film className="w-12 h-12 text-slate-500" /></div>
                    )}
                    {movie.is_match && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="default" className="bg-pink-600/90 text-white border-none text-[10px] font-semibold shadow-lg"><Heart className="w-3 h-3 fill-white mr-1" />Match</Badge>
                      </div>
                    )}
                    <button className="absolute top-3 right-3 w-7 h-7 bg-black/60 backdrop-blur-sm hover:bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFromShared(movie.imdb_id); }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="text-slate-200 font-semibold text-sm line-clamp-2">{movie.title}</h3>
                    <p className="text-slate-500 text-xs">{movie.year}</p>

                    {/* You / Partner badges */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-[10px] py-0 ${movie.user_you_added ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' : 'bg-slate-700/30 text-slate-500 border-slate-600/50'}`}>
                        {movie.user_you_added ? <Check className="w-2.5 h-2.5 mr-0.5" /> : <Plus className="w-2.5 h-2.5 mr-0.5" />}You
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] py-0 ${movie.partner_added ? 'bg-pink-600/20 text-pink-300 border-pink-500/30' : 'bg-slate-700/30 text-slate-500 border-slate-600/50'}`}>
                        {movie.partner_added ? <Check className="w-2.5 h-2.5 mr-0.5" /> : <Plus className="w-2.5 h-2.5 mr-0.5" />}Partner
                      </Badge>
                    </div>

                    {/* PROMINENT STATUS BUTTON */}
                    <button
                      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${movie.watch_status === 'WATCHED'
                        ? 'bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30'
                        : 'bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30'
                        }`}
                      onClick={(e) => { e.stopPropagation(); handleUpdateWatchStatus(movie.imdb_id, movie.watch_status === 'WATCHED' ? 'WATCHLIST' : 'WATCHED'); }}
                    >
                      {movie.watch_status === 'WATCHED' ? <><Eye className="w-3.5 h-3.5" /> ✓ Watched</> : <><Eye className="w-3.5 h-3.5" /> Mark as Watched</>}
                    </button>

                    {/* DUAL-USER RATINGS for watched movies */}
                    {movie.watch_status === 'WATCHED' && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-700/50" onClick={(e) => e.stopPropagation()}>
                        <StarRating rating={movie.your_rating} onChange={(r) => handleCoupleRate(movie.imdb_id, r)} disabled={false} size="sm" label="Your Rating:" />
                        <StarRating rating={movie.partner_rating} disabled={true} size="sm" label="Partner's Rating:" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Film className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">{activeTab === 'matches' ? 'No mutual picks yet' : activeTab === 'watched' ? 'No watched movies' : 'Watchlist is empty'}</h3>
            <p className="text-slate-500 text-sm">Search for movies and add them to your couple list from the movie details.</p>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-xl text-center ${message.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-300' : 'bg-red-900/30 border border-red-500/30 text-red-300'}`}>
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <MovieDetails movie={selectedMovie} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      </div>
    );
  }

  // NOT PAIRED VIEW
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Create Your Couple Space</h1>
        <p className="text-slate-400">Invite your partner by their username to start watching together</p>
      </motion.div>

      {invites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-400" />Pending Invitations ({invites.length})</h3>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between bg-slate-800/60 rounded-xl p-4">
                <div><p className="text-slate-200 font-medium">{invite.sender?.firstName} {invite.sender?.lastName}</p><p className="text-sm text-slate-400">wants to create a couple space</p></div>
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptInvite(invite.id)} className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg text-green-400 transition-colors"><Check className="w-5 h-5" /></button>
                  <button onClick={() => handleRejectInvite(invite.id)} className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-purple-400" />Send Invitation</h3>
        <form onSubmit={handleSendInvite} className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
            <input type="text" placeholder="partner_username" value={partnerUsername} onChange={(e) => setPartnerUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors" required />
          </div>
          <button type="submit" disabled={inviteSending || !partnerUsername.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {inviteSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}Send
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-xl text-center ${message.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-300' : 'bg-red-900/30 border border-red-500/30 text-red-300'}`}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
