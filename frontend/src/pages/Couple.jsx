import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserEntity } from '@/entities/User';
import { Couple } from '@/entities/Couple';
import { coupleMovieService } from '@/services/coupleMovieService';
import { useAuth } from '@/lib/AuthContext';
import { Heart, Users, Send, UserPlus, Film, X, Check, Loader2, Star, Eye, BookmarkCheck, Trash2, Plus, Unlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MovieDetails from '../components/movie/MovieDetails';
import { cn } from '@/lib/utils';

function StarRating({ rating, onChange, disabled, size = 'md', label }) {
  const [hover, setHover] = useState(null);
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div>
      {label && <p className="text-muted-foreground text-[10px] mb-0.5">{label}</p>}
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
                <Star className={`${starSize} transition-colors ${(isHalfFilled || isFullFilled) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
              </div>
              <div className="absolute inset-0 z-10" style={{ clipPath: 'inset(0 0 0 50%)' }}
                onMouseEnter={() => !disabled && setHover(fullVal)}
                onMouseLeave={() => !disabled && setHover(null)}
                onClick={(e) => { e.stopPropagation(); !disabled && onChange && onChange(fullVal); }}>
                <Star className={`${starSize} transition-colors ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
              </div>
              <Star className={`${starSize} ${isFullFilled ? 'fill-yellow-400 text-yellow-400' : isHalfFilled ? 'text-muted-foreground/30' : 'text-muted-foreground/30'}`} />
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
    } catch (error) { }
    setIsLoading(false);
  };

  const loadSharedMovies = async () => {
    setIsLoadingMovies(true);
    try {
      const movies = await coupleMovieService.list();
      setSharedMovies(Array.isArray(movies) ? movies : []);
      const statsData = await coupleMovieService.stats();
      setStats(statsData);
    } catch (e) { }
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
    catch (e) { }
  };

  const handleUpdateWatchStatus = async (imdbId, newStatus) => {
    try {
      await coupleMovieService.updateStatus(imdbId, { watch_status: newStatus });
      setSharedMovies(prev => prev.map(m => m.imdb_id === imdbId ? { ...m, watch_status: newStatus } : m));
      loadSharedMovies();
    } catch (e) { }
  };

  const handleCoupleRate = async (imdbId, rating) => {
    try {
      await coupleMovieService.rate(imdbId, rating);
      setSharedMovies(prev => prev.map(m => m.imdb_id === imdbId ? { ...m, your_rating: rating, watch_status: 'WATCHED' } : m));
      loadSharedMovies();
    } catch (e) { }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie({ imdbID: movie.imdb_id, id: movie.imdb_id, title: movie.title, poster: movie.poster, year: movie.year, genre: movie.genre });
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
          <h2 className="mb-2 text-2xl font-bold text-foreground">Join the fun!</h2>
          <a href="/login" className="inline-block rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground">Login</a>
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
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold"><span className="gradient-text">Couple Space</span></h1>
        </motion.div>

        {/* Partner Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
                  {(user.firstname || user.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.firstname || user.full_name || 'You'}</p>
                  <p className="text-xs text-muted-foreground">You</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-px w-4 bg-border" />
                <Heart className="h-4 w-4 fill-accent text-accent" />
                <span className="h-px w-4 bg-border" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-destructive text-lg font-bold text-primary-foreground">
                  {(partner.firstName || partner.username || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{partner.firstName} {partner.lastName}</p>
                  <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-600/30 text-[10px]">Connected</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center"><p className="text-xl font-bold text-foreground">{stats.matches}</p><p className="text-xs text-muted-foreground">Matches</p></div>
              <div className="text-center"><p className="text-xl font-bold text-foreground">{stats.watchlist}</p><p className="text-xs text-muted-foreground">Watchlist</p></div>
              <div className="text-center"><p className="text-xl font-bold text-foreground">{stats.watched}</p><p className="text-xs text-muted-foreground">Watched</p></div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-1 rounded-xl border border-border bg-card/50 p-1.5"
        >
          {[
            { key: 'matches', label: 'Mutual Picks', icon: Heart, count: stats.matches },
            { key: 'watchlist', label: 'Watchlist', icon: BookmarkCheck, count: stats.watchlist },
            { key: 'watched', label: 'Watched', icon: Eye, count: stats.watched }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === tab.key
                ? 'bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <tab.icon className="h-4 w-4" />{tab.label}<span className="text-xs opacity-70">{tab.count}</span>
            </button>
          ))}
        </motion.div>

        {/* Movies Grid */}
        {isLoadingMovies ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredMovies.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {filteredMovies.map((movie, index) => (
              <motion.div key={movie.id || movie.imdb_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group relative">
                <div className={cn("cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30", movie.is_match && "ring-2 ring-pink-500/80 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] glow-pink")} onClick={() => handleMovieSelect(movie)}>
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {movie.poster && movie.poster !== 'N/A' ? (
                      <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary"><Film className="h-12 w-12 text-muted-foreground" /></div>
                    )}
                    {movie.is_match && (
                      <div className="absolute left-3 top-3">
                        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 text-[10px] font-semibold shadow-lg gap-1">
                          <Heart className="h-3 w-3 fill-current" />Match
                        </Badge>
                      </div>
                    )}
                    <button className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-destructive/80 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFromShared(movie.imdb_id); }}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-2 p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{movie.title}</h3>
                    <p className="text-xs text-muted-foreground">{movie.year}</p>

                    {/* You / Partner badges */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-[10px] py-0 ${movie.user_you_added ? 'bg-primary/20 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border'}`}>
                        {movie.user_you_added ? <Check className="mr-0.5 h-2.5 w-2.5" /> : <Plus className="mr-0.5 h-2.5 w-2.5" />}You
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] py-0 ${movie.partner_added ? 'bg-accent/20 text-accent border-accent/30' : 'bg-secondary text-muted-foreground border-border'}`}>
                        {movie.partner_added ? <Check className="mr-0.5 h-2.5 w-2.5" /> : <Plus className="mr-0.5 h-2.5 w-2.5" />}Partner
                      </Badge>
                    </div>

                    {/* Status button */}
                    <button
                      className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all ${movie.watch_status === 'WATCHED'
                        ? 'border-green-500/30 bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'border-primary/30 bg-primary/20 text-primary hover:bg-primary/30'
                        }`}
                      onClick={(e) => { e.stopPropagation(); handleUpdateWatchStatus(movie.imdb_id, movie.watch_status === 'WATCHED' ? 'WATCHLIST' : 'WATCHED'); }}
                    >
                      {movie.watch_status === 'WATCHED' ? <><Eye className="h-3.5 w-3.5" /> ✓ Watched</> : <><Eye className="h-3.5 w-3.5" /> Mark as Watched</>}
                    </button>

                    {/* Dual ratings */}
                    {movie.watch_status === 'WATCHED' && (
                      <div className="space-y-1.5 border-t border-border pt-1" onClick={(e) => e.stopPropagation()}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <Film className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">{activeTab === 'matches' ? 'No mutual picks yet' : activeTab === 'watched' ? 'No watched movies' : 'Watchlist is empty'}</h3>
            <p className="text-sm text-muted-foreground">Search for movies and add them to your couple list from the movie details.</p>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-xl border p-4 text-center ${message.type === 'success' ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-red-500/30 bg-red-900/20 text-red-400'}`}>
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
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Heart className="mx-auto mb-4 h-16 w-16 text-accent" />
        <h1 className="mb-2 text-3xl font-bold gradient-text">Create Your Couple Space</h1>
        <p className="text-muted-foreground">Invite your partner by their username to start watching together</p>
      </motion.div>

      {invites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 p-6"
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />Pending Invitations ({invites.length})
          </h3>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between rounded-xl bg-card/60 p-4">
                <div>
                  <p className="font-medium text-foreground">{invite.sender?.firstName} {invite.sender?.lastName}</p>
                  <p className="text-sm text-muted-foreground">wants to create a couple space</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptInvite(invite.id)} className="rounded-lg bg-green-600/20 p-2 text-green-400 transition-colors hover:bg-green-600/40"><Check className="h-5 w-5" /></button>
                  <button onClick={() => handleRejectInvite(invite.id)} className="rounded-lg bg-red-600/20 p-2 text-red-400 transition-colors hover:bg-red-600/40"><X className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Send className="h-5 w-5 text-primary" />Send Invitation
        </h3>
        <form onSubmit={handleSendInvite} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <input type="text" placeholder="partner_username" value={partnerUsername} onChange={(e) => setPartnerUsername(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 pl-8 pr-4 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none" required />
          </div>
          <button type="submit" disabled={inviteSending || !partnerUsername.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
            {inviteSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}Send
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-xl border p-4 text-center ${message.type === 'success' ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-red-500/30 bg-red-900/20 text-red-400'}`}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
