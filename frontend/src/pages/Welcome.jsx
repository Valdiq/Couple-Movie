import React from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Users, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg">
                <Heart className="w-10 h-10 text-rose-500 fill-current" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6">
              Your Perfect Movie Night
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Starts Here
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto">
              Discover movies that match your emotions with AI-powered recommendations. 
              Share the experience with your partner and never argue about what to watch again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => User.login()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 px-8 py-4 text-lg shadow-lg shadow-pink-500/20"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Link to={createPageUrl("Pricing")}>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              Why Choose CoupleMovie?
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Transform how you discover and enjoy movies together
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">AI-Powered Discovery</h3>
              <p className="text-slate-400">
                Tell us how you want to feel, and our AI finds movies that perfectly match your mood. 
                From romantic to thrilling, we understand your emotions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">Couple Space</h3>
              <p className="text-slate-400">
                Create shared watchlists, discover mutual interests, and track what you've watched together. 
                Perfect for couples and friends who love movies.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">Smart Search</h3>
              <p className="text-slate-400">
                Use natural language to find exactly what you're looking for. 
                "A funny sci-fi movie from the 80s" - we'll find it.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-400">
              Three simple steps to your perfect movie night
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose Your Mood",
                description: "Select how you want to feel or describe what you're looking for in natural language."
              },
              {
                step: "2", 
                title: "Get AI Recommendations",
                description: "Our intelligent system finds movies that match your emotional preferences perfectly."
              },
              {
                step: "3",
                title: "Watch & Share",
                description: "Add favorites, create shared watchlists with your partner, and rate what you've watched."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              Ready to Find Your Perfect Movie?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Join thousands of movie lovers who've discovered their new favorites with CoupleMovie
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => User.login()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 px-8 py-4 text-lg shadow-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Now
              </Button>
              <Link to={createPageUrl("Pricing")}>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              No credit card required • Free plan available forever
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}