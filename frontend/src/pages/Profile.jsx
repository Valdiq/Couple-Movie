import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User as UserIcon, Crown, LogOut, Settings, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/entities/User";
import { UserFavorite } from "@/entities/UserFavorite";
import { Couple } from "@/entities/Couple";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    favorites: 0,
    partnerConnected: false,
    joinDate: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserAndStats();
  }, []);

  const loadUserAndStats = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load user stats
      const userFavorites = await UserFavorite.filter({ user_email: currentUser.email });
      
      const partnerships = await Couple.filter({
        $or: [
          { user1_email: currentUser.email },
          { user2_email: currentUser.email }
        ]
      });

      setStats({
        favorites: userFavorites.length,
        partnerConnected: partnerships.length > 0 && partnerships[0].status === 'accepted',
        joinDate: currentUser.created_date
      });
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await User.logout();
      // Redirect will happen automatically
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      await User.updateMyUserData({ subscription_plan: 'pro' });
      const updatedUser = await User.me();
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to upgrade:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading your profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-16 bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-3xl p-12 border border-slate-700"
          >
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-4">Join CoupleMovie</h1>
            <p className="text-lg text-slate-400 mb-8">
              Sign in to discover your perfect movie matches, create favorites, and share the experience with your partner.
            </p>
            <Button 
              onClick={() => User.login()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 text-lg"
            >
              Sign In / Sign Up
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 pb-20 md:pb-16 bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
            <UserIcon className="w-12 h-12 text-slate-300" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-2">{user.full_name}</h1>
          <p className="text-lg text-slate-400">{user.email}</p>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
                  {user.subscription_plan === 'pro' ? (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Star className="w-5 h-5 text-slate-400" />
                  )}
                  {user.subscription_plan === 'pro' ? 'CoupleMovie Pro' : 'Free Plan'}
                </h3>
                <p className="text-slate-400">
                  {user.subscription_plan === 'pro' 
                    ? 'You have access to all premium features including Couple Space'
                    : 'Upgrade to unlock Couple Space and advanced features'
                  }
                </p>
              </div>
              {user.subscription_plan === 'free' && (
                <div className="flex gap-3">
                  <Link to={createPageUrl("Pricing")}>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-700">
            <div className="text-3xl font-bold text-slate-100 mb-1">{stats.favorites}</div>
            <div className="text-slate-400">Favorite Movies</div>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-700">
            <div className="text-3xl font-bold text-slate-100 mb-1">
              {stats.partnerConnected ? '1' : '0'}
            </div>
            <div className="text-slate-400">Partner Connected</div>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-700">
            <div className="text-3xl font-bold text-slate-100 mb-1">
              {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
            </div>
            <div className="text-slate-400">Member Since</div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-slate-100">Quick Actions</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Link to={createPageUrl("Favorites")}>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-rose-500" />
                  <div>
                    <h3 className="font-semibold text-slate-200">My Favorites</h3>
                    <p className="text-slate-400 text-sm">View your saved movies</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to={createPageUrl("Couple")}>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-500" />
                  <div>
                    <h3 className="font-semibold text-slate-200">Couple Space</h3>
                    <p className="text-slate-400 text-sm">
                      {user.subscription_plan === 'pro' ? 'Manage shared watchlists' : 'Upgrade to unlock'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to={createPageUrl("Search")}>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-indigo-500" />
                  <div>
                    <h3 className="font-semibold text-slate-200">Discover Movies</h3>
                    <p className="text-slate-400 text-sm">Find your next favorite</p>
                  </div>
                </div>
              </div>
            </Link>

            <div 
              onClick={handleLogout}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-red-900/20 hover:border-red-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-8 h-8 text-red-400" />
                <div>
                  <h3 className="font-semibold text-slate-200">Sign Out</h3>
                  <p className="text-slate-400 text-sm">
                    {isLoggingOut ? 'Signing out...' : 'Logout from your account'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-slate-800"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Plan:</span>
              <Badge className={user.subscription_plan === 'pro' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-slate-700 text-slate-300'
              }>
                {user.subscription_plan === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member since:</span>
              <span className="text-slate-300">
                {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}