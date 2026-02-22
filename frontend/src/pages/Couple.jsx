import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserEntity } from '@/entities/User';
import { Couple } from '@/entities/Couple';
import { useAuth } from '@/lib/AuthContext';
import { Heart, Users, Send, UserPlus, Crown, Film, Search as SearchIcon, X, Check, Loader2 } from 'lucide-react';

export default function CouplePage() {
  const { user: authUser, isLoading: isLoadingAuth } = useAuth();
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [invites, setInvites] = useState([]);
  const [partnerUsername, setPartnerUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [inviteSending, setInviteSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, [authUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await UserEntity.me();
      if (currentUser) {
        setUser(currentUser);
        // Load partner
        const partnerData = await Couple.getPartner();
        setPartner(partnerData);
        // Load pending invites
        const inviteData = await Couple.getInvites();
        setInvites(inviteData || []);
      }
    } catch (error) {
      console.error('Error loading couple data:', error);
    }
    setIsLoading(false);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!partnerUsername.trim()) return;
    setInviteSending(true);
    setMessage(null);
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
    try {
      await Couple.acceptInvite(requestId);
      setMessage({ type: 'success', text: 'Invitation accepted! You are now connected!' });
      loadData();
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
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Join the fun!</h2>
          <p className="text-slate-400 mb-4">Log in to create your Couple Space</p>
          <a href="/login" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity">
            Login
          </a>
        </div>
      </div>
    );
  }

  // If already paired
  if (partner) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-2 rounded-full border border-purple-500/30 mb-6">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span className="text-sm text-purple-300">Connected</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Couple Space
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* You */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="You" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <Crown className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{user.full_name || 'You'}</h3>
                <p className="text-sm text-slate-400">@{user.username || user.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Partner */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {partner.firstName} {partner.lastName}
                </h3>
                <p className="text-sm text-slate-400">@{partner.username || partner.email}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not paired — show invite form + received invites
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Create Your Couple Space
        </h1>
        <p className="text-slate-400">Invite your partner by their username to start watching together</p>
      </motion.div>

      {/* Received Invitations */}
      {invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-400" />
            Pending Invitations ({invites.length})
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

      {/* Send Invitation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-purple-400" />
          Send Invitation
        </h3>
        <form onSubmit={handleSendInvite} className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
            <input
              type="text"
              placeholder="partner_username"
              value={partnerUsername}
              onChange={(e) => setPartnerUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={inviteSending || !partnerUsername.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {inviteSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send
          </button>
        </form>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl text-center ${message.type === 'success'
                ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                : 'bg-red-900/30 border border-red-500/30 text-red-300'
              }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
