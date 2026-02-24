import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { User as UserEntity } from '@/entities/User';
import { UserFavorite } from '@/entities/UserFavorite';
import { Couple } from '@/entities/Couple';
import { authService } from '@/services/authService';
import { Badge } from '@/components/ui/badge';
import { User, Camera, Heart, Calendar, Star, LogOut, Film, Check, X, UserPlus, Loader2, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Unlink, Users } from 'lucide-react';

export default function Profile() {
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ favorites: 0, joinDate: null });
  const [invites, setInvites] = useState([]);
  const [partner, setPartner] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isResettingPw, setIsResettingPw] = useState(false);
  const [showBreakConfirm, setShowBreakConfirm] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  useEffect(() => { loadProfile(); }, [authUser]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await UserEntity.me();
      if (userData) {
        setCurrentUser(userData);
        setStats(prev => ({ ...prev, joinDate: userData.created_date }));
        try { const favs = await UserFavorite.list(); setStats(prev => ({ ...prev, favorites: Array.isArray(favs) ? favs.length : 0 })); } catch (e) { }
        try { const inviteData = await Couple.getInvites(); setInvites(inviteData || []); } catch (e) { }
        try { const partnerData = await Couple.getPartner(); setPartner(partnerData); } catch (e) { }
      }
    } catch (error) { console.error('Error loading profile:', error); }
    setIsLoading(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage({ type: 'error', text: 'Image too large. Max 2MB.' }); return; }
    setAvatarUploading(true); setMessage(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await UserEntity.updateMyUserData({ avatar_url: event.target.result });
          setCurrentUser(prev => ({ ...prev, avatar_url: event.target.result }));
          setMessage({ type: 'success', text: 'Avatar updated!' });
        } catch (err) { setMessage({ type: 'error', text: 'Failed to save avatar' }); }
        setAvatarUploading(false);
      };
      reader.onerror = () => { setMessage({ type: 'error', text: 'Failed to read file' }); setAvatarUploading(false); };
      reader.readAsDataURL(file);
    } catch (error) { setMessage({ type: 'error', text: 'Failed to upload avatar' }); setAvatarUploading(false); }
  };

  const handleAcceptInvite = async (requestId) => {
    try { await Couple.acceptInvite(requestId); setMessage({ type: 'success', text: 'Invitation accepted!' }); setInvites(invites.filter(inv => inv.id !== requestId)); loadProfile(); }
    catch (error) { setMessage({ type: 'error', text: 'Failed to accept invitation' }); }
  };

  const handleRejectInvite = async (requestId) => {
    try { await Couple.rejectInvite(requestId); setInvites(invites.filter(inv => inv.id !== requestId)); }
    catch (error) { setMessage({ type: 'error', text: 'Failed to decline invitation' }); }
  };

  const handleLogout = () => UserEntity.logout();

  const handleResetPassword = async (e) => {
    e.preventDefault(); setMessage(null);
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Passwords do not match' }); return; }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Min 6 characters' }); return; }
    setIsResettingPw(true);
    try {
      await authService.resetPassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password updated!' }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordForm(false);
    } catch (error) { setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to reset password' }); }
    setIsResettingPw(false);
  };

  const handleBreakCouple = async () => {
    setIsBreaking(true);
    try {
      await Couple.breakCouple();
      setMessage({ type: 'success', text: 'Couple link broken. You can create a new link now.' });
      setPartner(null); setShowBreakConfirm(false); loadProfile();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data || 'Failed to break couple link';
      setMessage({ type: 'error', text: typeof errMsg === 'string' ? errMsg : 'Failed to break link' });
    }
    setIsBreaking(false);
  };

  if (isLoadingAuth || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><User className="w-16 h-16 text-slate-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-slate-100 mb-2">Not Logged In</h2>
          <a href="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold">Login</a>
        </div>
      </div>
    );
  }

  const fullName = [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.full_name || 'User';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="group relative w-28 h-28 mx-auto mb-4 cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-28 h-28 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center">
            {currentUser.avatar_url ? <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-14 h-14 text-slate-400" />}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">{fullName}</h2>
        {currentUser.username && <p className="text-slate-400 text-sm mt-1">@{currentUser.username}</p>}
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-3 rounded-xl text-center text-sm ${message.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-300' : 'bg-red-900/30 border border-red-500/30 text-red-300'}`}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Couple Invitations */}
      {invites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-purple-500/30">
          <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-400" />Couple Invitations ({invites.length})</h3>
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

      {/* COUPLE INFO SECTION */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" /> Couple Space
        </h3>
        {partner ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {(currentUser.firstname || fullName || 'U')[0].toUpperCase()}
                </div>
                <span className="text-slate-300 text-sm font-medium">{currentUser.firstname || fullName}</span>
              </div>
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                  {(partner.firstName || partner.username || 'P')[0].toUpperCase()}
                </div>
                <span className="text-slate-300 text-sm font-medium">{partner.firstName} {partner.lastName}</span>
              </div>
              <Badge variant="outline" className="ml-auto bg-green-900/40 text-green-400 border-green-600/30 text-[10px]">Connected</Badge>
            </div>
            {/* Break Couple Link Button */}
            <button
              onClick={() => setShowBreakConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all text-sm"
            >
              <Unlink className="w-4 h-4" /> Break Couple Link
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm mb-3">You're not connected with a partner yet.</p>
            <a href="/Couple" className="inline-block px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Go to Couple Page
            </a>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-slate-100 mb-1">{stats.favorites}</div>
          <div className="text-slate-400 text-sm">Favorite Movies</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-slate-100 mb-1">
            {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
          </div>
          <div className="text-slate-400 text-sm">Member Since</div>
        </motion.div>
      </div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-all text-sm font-medium">
            <Lock className="w-4 h-4 text-purple-400" />Change Password<ChevronDown className="w-4 h-4 ml-auto text-slate-500" />
          </button>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2"><Lock className="w-5 h-5 text-purple-400" />Change Password</h3>
              <button onClick={() => setShowPasswordForm(false)} className="text-slate-500 hover:text-slate-300"><ChevronUp className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="relative">
                <input type={showCurrentPw ? 'text' : 'password'} placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                  className="w-full px-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm pr-10" />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} placeholder="New password (min 6)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm pr-10" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full px-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm" />
              <button type="submit" disabled={isResettingPw || !currentPassword || !newPassword || !confirmPassword}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {isResettingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}{isResettingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center pt-2">
        <button onClick={handleLogout} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors text-sm">
          <LogOut className="w-4 h-4" />Logout
        </button>
      </motion.div>

      {/* Break Couple Confirmation */}
      <AnimatePresence>
        {showBreakConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBreakConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 rounded-2xl p-6 border border-slate-700 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/30"><Unlink className="w-8 h-8 text-red-400" /></div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Break Couple Link?</h3>
                <p className="text-slate-400 text-sm">This will disconnect you and your partner. You'll lose the shared space but can create a new one later.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBreakConfirm(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button onClick={handleBreakCouple} disabled={isBreaking}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {isBreaking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlink className="w-4 h-4" />}{isBreaking ? 'Breaking...' : 'Break Link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}