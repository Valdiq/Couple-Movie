import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { User as UserEntity } from '@/entities/User';
import { UserFavorite } from '@/entities/UserFavorite';
import { Couple } from '@/entities/Couple';
import { authService } from '@/services/authService';
import { Badge } from '@/components/ui/badge';
import { User, Camera, Heart, Star, LogOut, Check, X, UserPlus, Loader2, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Unlink, Users, Settings, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
    } catch (error) { }
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
      setMessage({ type: 'success', text: 'Couple link broken.' });
      setPartner(null); setShowBreakConfirm(false); loadProfile();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data || 'Failed to break couple link';
      setMessage({ type: 'error', text: typeof errMsg === 'string' ? errMsg : 'Failed to break link' });
    }
    setIsBreaking(false);
  };

  if (isLoadingAuth || isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold text-foreground">Not Logged In</h2>
          <a href="/login" className="inline-block rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground">Login</a>
        </div>
      </div>
    );
  }

  const fullName = [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.full_name || 'User';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="group relative mx-auto mb-4 h-28 w-28 cursor-pointer" onClick={handleAvatarClick}>
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary">
            {currentUser.avatar_url
              ? <img src={currentUser.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              : <User className="h-14 w-14 text-muted-foreground" />
            }
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {avatarUploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
        {currentUser.username && <p className="mt-1 text-sm text-muted-foreground">@{currentUser.username}</p>}
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-xl border p-3 text-center text-sm ${message.type === 'success' ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-red-500/30 bg-red-900/20 text-red-400'}`}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Couple Invitations */}
      {invites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 p-5"
        >
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />Couple Invitations ({invites.length})
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

      {/* Couple Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <Heart className="h-5 w-5 text-accent" /> Couple Space
        </h3>
        {partner ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">
                  {(currentUser.firstname || fullName || 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{currentUser.firstname || fullName}</span>
              </div>
              <Heart className="h-4 w-4 fill-accent text-accent" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-destructive font-bold text-primary-foreground">
                  {(partner.firstName || partner.username || 'P')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{partner.firstName} {partner.lastName}</span>
              </div>
              <Badge variant="outline" className="ml-auto border-green-600/30 bg-green-900/30 text-[10px] text-green-400">Connected</Badge>
            </div>
            <button onClick={() => setShowBreakConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm text-muted-foreground transition-all hover:border-red-500/40 hover:text-red-400">
              <Unlink className="h-4 w-4" /> Break Couple Link
            </button>
          </div>
        ) : (
          <div className="py-4 text-center">
            <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="mb-3 text-sm text-muted-foreground">You're not connected with a partner yet.</p>
            <Link to={createPageUrl("Couple")}
              className="inline-block rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Go to Couple Page
            </Link>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5 text-center">
          <div className="mb-1 text-3xl font-bold text-foreground">{stats.favorites}</div>
          <div className="text-sm text-muted-foreground">Favorite Movies</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card p-5 text-center">
          <div className="mb-1 text-3xl font-bold text-foreground">
            {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Member Since</div>
        </motion.div>
      </div>

      {/* Menu items */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <Link to={createPageUrl("Favorites")}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30">
          <Heart className="h-4 w-4 text-accent" /> My Favorites
        </Link>
        <Link to={createPageUrl("Pricing")}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30">
          <Crown className="h-4 w-4 text-primary" /> Upgrade Plan
        </Link>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30">
            <Lock className="h-4 w-4 text-primary" />Change Password<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Lock className="h-5 w-5 text-primary" />Change Password</h3>
              <button onClick={() => setShowPasswordForm(false)} className="text-muted-foreground hover:text-foreground"><ChevronUp className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="relative">
                <input type={showCurrentPw ? 'text' : 'password'} placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} placeholder="New password (min 6)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
              <button type="submit" disabled={isResettingPw || !currentPassword || !newPassword || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {isResettingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}{isResettingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-2 text-center">
        <button onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-red-500/30 hover:text-red-400">
          <LogOut className="h-4 w-4" />Logout
        </button>
      </motion.div>

      {/* Break Couple Confirmation */}
      <AnimatePresence>
        {showBreakConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowBreakConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-900/30"><Unlink className="h-8 w-8 text-red-400" /></div>
                <h3 className="mb-2 text-xl font-bold text-foreground">Break Couple Link?</h3>
                <p className="text-sm text-muted-foreground">This will disconnect you and your partner. You'll lose the shared space but can create a new one later.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBreakConfirm(false)} className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-foreground hover:bg-secondary/80">Cancel</button>
                <button onClick={handleBreakCouple} disabled={isBreaking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {isBreaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Unlink className="h-4 w-4" />}{isBreaking ? 'Breaking...' : 'Break Link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}