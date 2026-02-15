import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";

export default function CustomEmotionInput({ onEmotionSubmit }) {
  const [emotionText, setEmotionText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emotionText.trim()) return;

    setIsLoading(true);
    await onEmotionSubmit(emotionText.trim());
    setEmotionText("");
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-3">
          How are you feeling right now?
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-6">
          Describe your current mood, emotions, or what kind of experience you're looking for, 
          and let our AI find the perfect movies for you.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative flex gap-3">
            <div className="relative flex-grow">
              <Sparkles className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input
                value={emotionText}
                onChange={(e) => setEmotionText(e.target.value)}
                placeholder="e.g., 'I'm feeling nostalgic and want something heartwarming' or 'stressed and need a good laugh'"
                className="pl-12 pr-4 py-3 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-purple-500 rounded-xl h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={!emotionText.trim() || isLoading}
              className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg shadow-pink-500/20 px-6"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="ml-2 hidden sm:inline">
                {isLoading ? "Finding..." : "Find Movies"}
              </span>
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}