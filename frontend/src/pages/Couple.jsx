
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/entities/User';
import { Couple } from '@/entities/Couple';
import { CoupleMovie } from '@/entities/CoupleMovie';
import { Movie } from '@/entities/Movie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Heart, Users, Mail, Send, Check, X, Clock, Star, Plus, Play, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MovieCard from '../components/movie/MovieCard';
import MovieDetails from '../components/movie/MovieDetails';
import ChatWidget from '../components/chat/ChatWidget';

export default function CouplePage() {
  const [user, setUser] = useState(null);
  const [partnership, setPartnership] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Couple features state
  const [coupleMovies, setCoupleMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('watchlist');

  useEffect(() => {
    checkUserAndPartnership();
  }, []);

  const loadCoupleData = useCallback(async () => {
    // Ensure partnership and its id are available before proceeding
    if (!partnership?.id) {
        return;
    }
    try {
      const movies = await Movie.list();
      setAllMovies(movies);
      
      const coupleMoviesList = await CoupleMovie.filter({ couple_id: partnership.id });
      const moviesWithDetails = await Promise.all(
        coupleMoviesList.map(async (cm) => {
          const movie = movies.find(m => m.id === cm.movie_id);
          return { ...cm, movie };
        })
      );
      setCoupleMovies(moviesWithDetails.filter(cm => cm.movie));
    } catch (error) {
      console.error('Error loading couple data:', error);
    }
  }, [partnership?.id]); // Dependency on partnership.id

  useEffect(() => {
    if (partnership && partnership.status === 'accepted') {
      loadCoupleData();
    }
  }, [partnership, loadCoupleData]); // Added loadCoupleData to dependencies

  const checkUserAndPartnership = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const existingPartnership = await Couple.filter({
        $or: [
          { user1_email: currentUser.email },
          { user2_email: currentUser.email }
        ]
      });

      if (existingPartnership.length > 0) {
        setPartnership(existingPartnership[0]);
      }
    } catch (e) {
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!partnerEmail || !user) return;
    if (partnerEmail === user.email) {
      setError("You can't invite yourself!");
      return;
    }
    setError('');
    setSuccess('');

    try {
      await Couple.create({
        user1_email: user.email,
        user1_name: user.full_name,
        user2_email: partnerEmail,
        status: 'pending'
      });
      setSuccess(`Invitation sent to ${partnerEmail}!`);
      checkUserAndPartnership();
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
      console.error(err);
    }
  };

  const handleAccept = async () => {
    if (!partnership) return;
    try {
      await Couple.update(partnership.id, { status: 'accepted' });
      checkUserAndPartnership();
    } catch (err) {
      console.error('Failed to accept invitation', err);
    }
  };

  const handleDecline = async () => {
    if (!partnership) return;
    try {
      await Couple.delete(partnership.id);
      setPartnership(null);
      checkUserAndPartnership();
    } catch (err) {
      console.error('Failed to decline invitation', err);
    }
  };

  const addToWatchlist = async (movie) => {
    if (!partnership || partnership.status !== 'accepted') return;
    
    try {
      const isUser1 = user.email === partnership.user1_email;
      await CoupleMovie.create({
        couple_id: partnership.id,
        movie_id: movie.id,
        user1_wants_to_watch: isUser1,
        user2_wants_to_watch: !isUser1,
        status: 'watchlist'
      });
      loadCoupleData();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const toggleWantToWatch = async (coupleMovie) => {
    const isUser1 = user.email === partnership.user1_email;
    const updates = isUser1 
      ? { user1_wants_to_watch: !coupleMovie.user1_wants_to_watch }
      : { user2_wants_to_watch: !coupleMovie.user2_wants_to_watch };
    
    try {
      await CoupleMovie.update(coupleMovie.id, updates);
      loadCoupleData();
    } catch (error) {
      console.error('Error updating want to watch:', error);
    }
  };

  const markAsWatched = async (coupleMovie) => {
    try {
      await CoupleMovie.update(coupleMovie.id, {
        status: 'watched',
        date_watched: new Date().toISOString()
      });
      loadCoupleData();
    } catch (error) {
      console.error('Error marking as watched:', error);
    }
  };

  const rateMovie = async (coupleMovie, rating) => {
    const isUser1 = user.email === partnership.user1_email;
    const updates = isUser1 
      ? { user1_rating: rating }
      : { user2_rating: rating };
    
    try {
      await CoupleMovie.update(coupleMovie.id, updates);
      loadCoupleData();
    } catch (error) {
      console.error('Error rating movie:', error);
    }
  };

  const watchlistMovies = coupleMovies.filter(cm => cm.status === 'watchlist');
  const watchedMovies = coupleMovies.filter(cm => cm.status === 'watched');
  const mutualWants = watchlistMovies.filter(cm => cm.user1_wants_to_watch && cm.user2_wants_to_watch);

  // Pro feature gate
  const ProFeatureGate = ({ children }) => (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl border border-slate-700">
        <div className="text-center p-8">
          <Crown className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-100 mb-2">Pro Feature</h3>
          <p className="text-slate-400 mb-4">Upgrade to unlock Couple Space</p>
          <Link to={createPageUrl("Pricing")}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-slate-500">Loading your Couple Space...</div>;
    }

    if (!user) {
      return (
        <div className="text-center max-w-md mx-auto">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
             <Users className="w-8 h-8 text-indigo-400"/>
           </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Join the fun!</h2>
          <p className="text-slate-400 mb-6">Log in to create your Couple Space and share movies with your partner.</p>
          <Button onClick={() => User.login()} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            Log In or Sign Up
          </Button>
        </div>
      );
    }
    
    if (partnership) {
        if (partnership.status === 'pending') {
            if (user.email === partnership.user2_email) {
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
                           <Mail className="w-8 h-8 text-indigo-400"/>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-100">You have an invitation!</h2>
                        <p className="text-slate-400 mt-2 text-lg"><span className="font-semibold text-slate-200">{partnership.user1_name}</span> wants to connect with you.</p>
                        <div className="flex gap-4 mt-8 justify-center">
                            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700 text-white">
                                <Check className="w-4 h-4 mr-2"/> Accept
                            </Button>
                            <Button onClick={handleDecline} variant="outline" className="text-rose-400 border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300">
                                <X className="w-4 h-4 mr-2"/> Decline
                            </Button>
                        </div>
                    </motion.div>
                );
            }
            return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
                       <Clock className="w-8 h-8 text-amber-400"/>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-100">Invitation Sent</h2>
                    <p className="text-slate-400 mt-2 text-lg">Waiting for <span className="font-semibold text-slate-200">{partnership.user2_email}</span> to accept.</p>
                     <Button onClick={handleDecline} variant="ghost" className="mt-6 text-slate-500 hover:text-slate-300">
                        Cancel Invitation
                    </Button>
                </motion.div>
            );
        }

        if (partnership.status === 'accepted') {
            const coupleSpaceContent = (
              <div className="space-y-8">
                  {/* Header */}
                  <div className="text-center">
                      <h2 className="text-3xl font-bold text-slate-100 mb-2">Your Couple Space</h2>
                      <p className="text-slate-400">
                          Connected with <span className="font-medium text-slate-200">{user.email === partnership.user1_email ? partnership.user2_email : partnership.user1_name || partnership.user1_email}</span>
                      </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700">
                          <div className="text-2xl font-bold text-slate-100">{watchlistMovies.length}</div>
                          <div className="text-slate-400 text-sm">In Watchlist</div>
                      </div>
                      <div className="bg-rose-900/20 rounded-2xl p-4 text-center border border-rose-500/30">
                          <div className="text-2xl font-bold text-rose-400">{mutualWants.length}</div>
                          <div className="text-rose-400/80 text-sm">Mutual Picks</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700">
                          <div className="text-2xl font-bold text-slate-100">{watchedMovies.length}</div>
                          <div className="text-slate-400 text-sm">Watched</div>
                      </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                      {[
                          { id: 'watchlist', label: 'Watchlist', count: watchlistMovies.length },
                          { id: 'matches', label: 'Mutual Picks', count: mutualWants.length },
                          { id: 'watched', label: 'Watched', count: watchedMovies.length }
                      ].map((tab) => (
                          <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  activeTab === tab.id
                                      ? 'bg-slate-700/50 text-slate-100 shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                              {tab.label} ({tab.count})
                          </button>
                      ))}
                  </div>

                  {/* Content based on active tab */}
                  <div className="min-h-[400px]">
                      {activeTab === 'watchlist' && (
                          <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                  <h3 className="text-xl font-semibold text-slate-200">Shared Watchlist</h3>
                                  <Link to={createPageUrl("Search")}>
                                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                          <Plus className="w-4 h-4 mr-2" />
                                          Add Movies
                                      </Button>
                                  </Link>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {watchlistMovies.map((cm) => (
                                      <div key={cm.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                          <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden">
                                              <MovieCard movie={cm.movie} onSelect={() => {
                                                  setSelectedMovie(cm.movie);
                                                  setIsDetailsOpen(true);
                                              }} />
                                          </div>
                                          
                                          <div className="space-y-2">
                                              <div className="flex gap-2">
                                                  <Button
                                                      size="sm"
                                                      variant={user.email === partnership.user1_email && cm.user1_wants_to_watch ? "default" : "outline"}
                                                      onClick={() => toggleWantToWatch(cm)}
                                                      className="flex-1 text-xs"
                                                  >
                                                      {user.email === partnership.user1_email && cm.user1_wants_to_watch ? "✓ You want to watch" : "I want to watch"}
                                                  </Button>
                                                  <Button
                                                      size="sm"
                                                      onClick={() => markAsWatched(cm)}
                                                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                                  >
                                                      Mark Watched
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>

                              {watchlistMovies.length === 0 && (
                                  <div className="text-center py-12">
                                      <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                      <h3 className="text-xl font-semibold text-slate-200 mb-2">No movies in watchlist yet</h3>
                                      <p className="text-slate-400 mb-6">Start adding movies you both want to watch!</p>
                                      <Link to={createPageUrl("Search")}>
                                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                              <Plus className="w-4 h-4 mr-2" />
                                              Browse Movies
                                          </Button>
                                      </Link>
                                  </div>
                              )}
                          </div>
                      )}

                      {activeTab === 'matches' && (
                          <div className="space-y-6">
                              <h3 className="text-xl font-semibold text-slate-200">Movies You Both Want to Watch</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {mutualWants.map((cm) => (
                                      <div key={cm.id} className="bg-gradient-to-br from-rose-900/20 to-pink-900/20 rounded-xl p-4 border border-rose-500/30">
                                          <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden">
                                              <MovieCard movie={cm.movie} onSelect={() => {
                                                  setSelectedMovie(cm.movie);
                                                  setIsDetailsOpen(true);
                                              }} />
                                          </div>
                                          
                                          <Button
                                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white"
                                              onClick={() => markAsWatched(cm)}
                                          >
                                              <Heart className="w-4 h-4 mr-2 fill-current" />
                                              Perfect Match!
                                          </Button>
                                      </div>
                                  ))}
                              </div>

                              {mutualWants.length === 0 && (
                                  <div className="text-center py-12">
                                      <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                      <h3 className="text-xl font-semibold text-slate-200 mb-2">No mutual picks yet</h3>
                                      <p className="text-slate-400">Add movies to your watchlist and see which ones you both want to watch!</p>
                                  </div>
                              )}
                          </div>
                      )}

                      {activeTab === 'watched' && (
                          <div className="space-y-6">
                              <h3 className="text-xl font-semibold text-slate-200">Movies You've Watched Together</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {watchedMovies.map((cm) => {
                                      const isUser1 = user.email === partnership.user1_email;
                                      const myRating = isUser1 ? cm.user1_rating : cm.user2_rating;
                                      const partnerRating = isUser1 ? cm.user2_rating : cm.user1_rating;
                                      
                                      return (
                                          <div key={cm.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                              <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden">
                                                  <MovieCard movie={cm.movie} onSelect={() => {
                                                      setSelectedMovie(cm.movie);
                                                      setIsDetailsOpen(true);
                                                  }} />
                                              </div>
                                              
                                              <div className="space-y-2">
                                                  <div className="text-xs text-slate-500">
                                                      Watched {new Date(cm.date_watched).toLocaleDateString()}
                                                  </div>
                                                  
                                                  <div className="flex gap-1">
                                                      {[1, 2, 3, 4, 5].map((rating) => (
                                                          <button
                                                              key={rating}
                                                              onClick={() => rateMovie(cm, rating)}
                                                              className={`w-6 h-6 ${rating <= (myRating || 0) ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400/50'}`}
                                                          >
                                                              <Star className={`w-5 h-5 ${rating <= (myRating || 0) ? 'fill-current' : ''}`} />
                                                          </button>
                                                      ))}
                                                  </div>
                                                  
                                                  {partnerRating && (
                                                      <div className="text-xs text-slate-500">
                                                          Partner rated: {partnerRating}/5 ⭐
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>

                              {watchedMovies.length === 0 && (
                                  <div className="text-center py-12">
                                      <Check className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                      <h3 className="text-xl font-semibold text-slate-200 mb-2">No watched movies yet</h3>
                                      <p className="text-slate-400">Start watching movies together and rate them!</p>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
            );

            if (user?.subscription_plan === 'pro') {
                return coupleSpaceContent;
            } else {
                return <ProFeatureGate>{coupleSpaceContent}</ProFeatureGate>;
            }
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                   <Users className="w-8 h-8 text-indigo-400"/>
                </div>
                <h2 className="text-3xl font-bold text-slate-100">Create Your Couple Space</h2>
                <p className="text-slate-400 mt-2">Invite your partner to start sharing movie watchlists and ratings.</p>
                
                <form onSubmit={handleInvite} className="mt-8 space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5"/>
                        <Input 
                            type="email" 
                            placeholder="Your partner's email" 
                            value={partnerEmail}
                            onChange={(e) => setPartnerEmail(e.target.value)}
                            required
                            className="pl-10 h-12 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                        />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-lg text-white">
                        <Send className="w-5 h-5 mr-2"/>
                        Send Invitation
                    </Button>
                </form>
                {error && <p className="text-rose-400 mt-4 text-sm">{error}</p>}
                {success && <p className="text-green-400 mt-4 text-sm">{success}</p>}
            </div>
        </motion.div>
    );
  };

  return (
    <div className="min-h-screen py-16 md:py-24 bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderContent()}
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
