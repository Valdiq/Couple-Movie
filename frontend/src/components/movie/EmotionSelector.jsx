
import React from "react";
import { motion } from "framer-motion";
import {
  Heart, Zap, Smile, Droplets, Sun, Moon, Coffee, Flame,
  ThumbsUp, Frown, Angry, Meh, SmilePlus, Shell, Orbit,
  Glasses, Brain, Leaf, Star,
  Sparkles, Crown, Target, Music, Rainbow, Sword,
  Shield, Rocket, Bomb, MessageCircleQuestion
} from "lucide-react";

const emotions = [
  { name: "romantic", label: "Romantic", icon: Heart },
  { name: "exciting", label: "Exciting", icon: Zap },
  { name: "happy", label: "Happy", icon: Smile },
  { name: "emotional", label: "Emotional", icon: Droplets },
  { name: "uplifting", label: "Uplifting", icon: Sun },
  { name: "mysterious", label: "Mysterious", icon: Moon },
  { name: "cozy", label: "Cozy", icon: Coffee },
  { name: "passionate", label: "Passionate", icon: Flame },
  { name: "inspiring", label: "Inspiring", icon: Star },
  { name: "thrilling", label: "Thrilling", icon: Target },
  { name: "nostalgic", label: "Nostalgic", icon: Brain },
  { name: "melancholic", label: "Melancholic", icon: Frown },
  { name: "euphoric", label: "Euphoric", icon: Sparkles },
  { name: "adventurous", label: "Adventurous", icon: Rocket },
  { name: "terrifying", label: "Terrifying", icon: Angry },
  { name: "haunting", label: "Haunting", icon: Shell },
  { name: "playful", label: "Playful", icon: SmilePlus },
  { name: "whimsical", label: "Whimsical", icon: Rainbow },
  { name: "intense", label: "Intense", icon: Bomb },
  { name: "peaceful", label: "Peaceful", icon: Leaf },
  { name: "empowering", label: "Empowering", icon: Crown },
  { name: "heartwarming", label: "Heartwarming", icon: Heart },
  { name: "cathartic", label: "Cathartic", icon: Frown },
  { name: "surreal", label: "Surreal", icon: Orbit },
  { name: "contemplative", label: "Contemplative", icon: MessageCircleQuestion },
  { name: "rebellious", label: "Rebellious", icon: Sword },
  { name: "energetic", label: "Energetic", icon: Music },
  { name: "dramatic", label: "Dramatic", icon: Crown },
  { name: "comforting", label: "Comforting", icon: Coffee },
  { name: "bittersweet", label: "Bittersweet", icon: Meh },
  { name: "sophisticated", label: "Sophisticated", icon: Glasses },
  { name: "liberating", label: "Liberating", icon: ThumbsUp }
];

export default function EmotionSelector({ selectedEmotion, onEmotionSelect }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
          How do you want to feel?
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Choose an emotion and let our AI find the perfect movie for you.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {emotions.map((emotion, index) => {
          const Icon = emotion.icon;
          const isSelected = selectedEmotion === emotion.name;

          return (
            <motion.button
              key={emotion.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEmotionSelect(emotion.name)}
              className={`relative p-3 md:p-4 rounded-xl border transition-all duration-300 ${isSelected
                  ? "bg-slate-700/50 border-purple-500/50 shadow-lg"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600"
                }`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 rounded-full flex items-center justify-center transition-colors duration-300 ${isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h3 className={`font-medium text-xs md:text-sm text-center transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {emotion.label}
              </h3>

              {isSelected && (
                <motion.div
                  layoutId="selectedBorder"
                  className="absolute inset-0 rounded-xl border-2 border-pink-500 pointer-events-none"
                  initial={false}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
