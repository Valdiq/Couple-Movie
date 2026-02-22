import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { User as UserEntity } from '@/entities/User';
import { UserFavorite } from '@/entities/UserFavorite';
import { Couple } from '@/entities/Couple';
import { Badge } from '@/components/ui/badge';
import { User, Camera, Heart, Calendar, Star, LogOut, Film, Check, X, UserPlus, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ favorites: 0, joinDate: null });
  const [invites, setInvites] = useState([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, [authUser]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await UserEntity.me();
      if (userData) {
        setCurrentUser(userData);
        setStats(prev => ({
          ...prev,
          joinDate: userData.created_date
        }));

        // Load favorites count
        try {
          const favs = await UserFavorite.list();
          setStats(prev => ({ ...prev, favorites: Array.isArray(favs) ? favs.length : 0 }));
        } catch (e) {
          // Favorites not available
        }

        // Load invitations
        try {
          const inviteData = await Couple.getInvites();
          setInvites(inviteData || []);
        } catch (e) {
          // No invites
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setIsLoading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image too large. Max 2MB.' });
      return;
    }

    setAvatarUploading(true);
    setMessage(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        try {
          await UserEntity.updateMyUserData({ avatar_url: base64 });
          setCurrentUser(prev => ({ ...prev, avatar_url: base64 }));
          setMessage({ type: 'success', text: 'Avatar updated!' });
        } catch (err) {
          console.error('Failed to save avatar:', err);
          setMessage({ type: 'error', text: 'Failed to save avatar' });
        }
        setAvatarUploading(false);
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read file' });
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
      setAvatarUploading(false);
    }
  };

  const handleAcceptInvite = async (requestId) => {
    try {
      await Couple.acceptInvite(requestId);
      setMessage({ type: 'success', text: 'Invitation accepted! Check the Couple page.' });
      setInvites(invites.filter(inv => inv.id !== requestId));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to accept invitation' });
    }
  };

  const handleRejectInvite = async (requestId) => {
    try {
      await Couple.rejectInvite(requestId);
      setMessage({ type: 'success', text: 'Invitation declined' });
      setInvites(invites.filter(inv => inv.id !== requestId));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to decline invitation' });
    }
  };

  const handleLogout = () => {
    UserEntity.logout();
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Not Logged In</h2>
          <p className="text-slate-400 mb-4">Please log in to view your profile</p>
          <a href="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity">
            Login
          </a>
        </div>
      </div>
    );
  }

  const fullName = [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.full_name || 'User';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Avatar */}
        <div
          className="group relative w-28 h-28 mx-auto mb-4 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <div className="w-28 h-28 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-14 h-14 text-slate-400" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {avatarUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Name + Username */}
        <h2 className="text-2xl font-bold text-slate-100">{fullName}</h2>
        {currentUser.username && (
          <p className="text-slate-400 text-sm mt-1">@{currentUser.username}</p>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-xl text-center text-sm ${message.type === 'success'
              ? 'bg-green-900/30 border border-green-500/30 text-green-300'
              : 'bg-red-900/30 border border-red-500/30 text-red-300'
              }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Couple Invitations */}
      {invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-purple-500/30"
        >
          <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-400" />
            Couple Invitations ({invites.length})
          </h3>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between bg-slate-800/60 rounded-xl p-4">
                <div>
                  <p className="text-slate-200 font-medium">
                    {invite.sender?.firstName} {invite.sender?.lastName}
                  </p>
                  <p className="text-sm text-slate-400">
                    wants to create a couple space with you
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg text-green-400 transition-colors"
                    title="Accept"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 transition-colors"
                    title="Decline"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50"
      >
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-slate-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Free Plan</h3>
            <p className="text-sm text-slate-400">Upgrade to unlock Couple Space and advanced features</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 text-center"
        >
          <div className="text-3xl font-bold text-slate-100 mb-1">{stats.favorites}</div>
          <div className="text-slate-400 text-sm">Favorite Movies</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 text-center"
        >
          <div className="text-3xl font-bold text-slate-100 mb-1">
            {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
          </div>
          <div className="text-slate-400 text-sm">Member Since</div>
        </motion.div>
      </div>
    </div>
  );
}