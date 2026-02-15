
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Heart, Users, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/entities/User"; // Ensure User entity is correctly imported and available
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
        User.loginWithRedirect(window.location.href);
        return;
    }
    
    // In a real app, this would redirect to a payment processor like Stripe.
    // For this demo, we'll just update the user's plan directly.
    try {
        setIsLoading(true);
        // Assuming User.updateMyUserData is an asynchronous function that updates the user's plan
        await User.updateMyUserData({ subscription_plan: 'pro' });
        const updatedUser = await User.me(); // Fetch the updated user data
        setUser(updatedUser);
    } catch (error) {
        console.error("Failed to upgrade:", error);
        alert("There was an error processing your upgrade. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const freeFeatures = [
    "Emotion-based movie discovery",
    "AI-powered natural language search",
    "Personal favorites list",
    "Basic movie details & ratings",
    "Mobile & desktop access",
    "Up to 50 movies in favorites"
  ];

  const premiumFeatures = [
    "Everything in Free",
    "Couple Space & partner invitations",
    "Shared watchlists for couples",
    "Mutual movie matching system",
    "Individual rating system (1-5 stars)",
    "Watch history tracking",
    "Advanced AI recommendations for couples",
    "Priority customer support",
    "Unlimited favorites",
    "Early access to new features"
  ];

  return (
    <div className="min-h-screen py-16 pb-20 md:pb-16 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-slate-100 mb-6">
            Choose Your Perfect
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Movie Experience
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Start free with personal movie discovery, or upgrade to unlock the full couple experience
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 relative flex flex-col"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600/50">
                <Heart className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Free</h3>
              <div className="text-4xl font-bold text-slate-100 mb-2">
                $0
                <span className="text-lg font-normal text-slate-400">/month</span>
              </div>
              <p className="text-slate-400">Perfect for individual movie lovers</p>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 text-lg mt-auto"
              disabled={user?.subscription_plan === 'free'}
              onClick={() => !user && User.login()}
            >
              {user?.subscription_plan === 'free' ? "Your Current Plan" : (user ? "Current Plan" : "Get Started Free")}
            </Button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 rounded-3xl border border-pink-500/30 p-8 relative overflow-hidden flex flex-col"
          >
            <div className="absolute -inset-px bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-xl" />
            
            {user?.subscription_plan === 'pro' ? (
                <Badge className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none">
                    <Check className="w-3 h-3 mr-1" />
                    Active Plan
                </Badge>
            ) : (
                <Badge className="absolute top-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                </Badge>
            )}


            <div className="relative text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">CoupleMovie Pro</h3>
              <div className="text-4xl font-bold text-white mb-2">
                $15
                <span className="text-lg font-normal text-slate-400">/month</span>
              </div>
              <p className="text-slate-300">The ultimate experience for couples & friends</p>
            </div>

            <ul className="relative space-y-4 mb-8 flex-grow">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className={`${index === 0 ? 'text-slate-400' : 'text-slate-200'} ${index > 0 && index <= 6 ? 'font-medium' : ''}`}>
                    {feature}
                  </span>
                  {index > 0 && index <= 6 && (
                    <Sparkles className="w-4 h-4 text-pink-400 ml-auto" />
                  )}
                </li>
              ))}
            </ul>

            <Button 
              onClick={handleUpgrade}
              disabled={isLoading || user?.subscription_plan === 'pro'}
              className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white py-3 text-lg font-semibold mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5 mr-2" />
              {user?.subscription_plan === 'pro' ? 'You are a Pro' : 'Upgrade to Pro'}
            </Button>
            
            <p className="relative text-center text-slate-400 text-sm mt-4">
              Cancel anytime • 7-day free trial
            </p>
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Feature Comparison
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-700/20">
              <div></div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">Free</h4>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">Pro</h4>
                <Badge className="mt-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">$15/mo</Badge>
              </div>
            </div>
            
            {[
              ["Personal movie discovery", true, true],
              ["AI-powered search", true, true],
              ["Favorites list", "50 movies", "Unlimited"],
              ["Couple Space", false, true],
              ["Shared watchlists", false, true],
              ["Movie matching system", false, true],
              ["Individual ratings", false, true],
              ["Watch history tracking", false, true],
              ["Priority support", false, true],
              ["Early access features", false, true]
            ].map(([feature, free, pro], index) => (
              <div key={index} className="grid grid-cols-3 gap-4 p-4 border-t border-slate-700">
                <div className="text-slate-300 font-medium">{feature}</div>
                <div className="text-center">
                  {typeof free === 'boolean' ? (
                    free ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-slate-500 mx-auto" />
                  ) : (
                    <span className="text-slate-400 text-sm">{free}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof pro === 'boolean' ? (
                    pro ? <Check className="w-5 h-5 text-pink-500 mx-auto" /> : <X className="w-5 h-5 text-slate-500 mx-auto" />
                  ) : (
                    <span className="text-slate-200 text-sm font-medium">{pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-100 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            {[
              {
                q: "Can I try Pro features before subscribing?",
                a: "Yes! We offer a 7-day free trial for all Pro features. Cancel anytime during the trial period."
              },
              {
                q: "What happens if my partner doesn't have Pro?",
                a: "Both partners need Pro to access Couple Space features. You can invite your partner and they'll get a special trial offer."
              },
              {
                q: "Can I use the app with friends instead of a romantic partner?",
                a: "Absolutely! The 'Couple Space' works perfectly for friends who want to share movie recommendations and watch together."
              },
              {
                q: "How does the mutual movie matching work?",
                a: "Our AI analyzes both partners' preferences, ratings, and mood selections to suggest movies you'll both enjoy. The more you use the app, the better the recommendations become."
              }
            ].map(({ q, a }, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                <h3 className="font-semibold text-slate-100 mb-2">{q}</h3>
                <p className="text-slate-400">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border border-slate-700 shadow-lg">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Ready to Transform Your Movie Nights?
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of couples who've discovered their perfect movie matches with CoupleMovie Pro
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={createPageUrl("Home")}>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  Try Free Version
                </Button>
              </Link>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white" onClick={handleUpgrade} disabled={isLoading || user?.subscription_plan === 'pro'}>
                <Crown className="w-4 h-4 mr-2" />
                Start Pro Trial
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
