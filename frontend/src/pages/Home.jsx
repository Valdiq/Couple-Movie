import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle, Search, Sparkles, X } from "lucide-react";
import { Movie } from "@/entities/Movie";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MovieCard from "../components/movie/MovieCard";
import MovieDetails from "../components/movie/MovieDetails";
import ChatWidget from "../components/chat/ChatWidget";

const EMOTIONS = [
  { name: "romantic", label: "Romantic 💕" },
  { name: "exciting", label: "Exciting ⚡" },
  { name: "happy", label: "Happy 😊" },
  { name: "cozy", label: "Cozy ☕" },
  { name: "thrilling", label: "Thrilling 🎯" },
  { name: "uplifting", label: "Uplifting ☀️" },
  { name: "nostalgic", label: "Nostalgic 🧠" },
  { name: "mysterious", label: "Mysterious 🌙" },
  { name: "adventurous", label: "Adventurous 🚀" },
  { name: "emotional", label: "Emotional 💧" },
  { name: "passionate", label: "Passionate 🔥" },
  { name: "inspiring", label: "Inspiring ⭐" },
];

export default function Home() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [customVibe, setCustomVibe] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getRecommendations = async (emotion) => {
    setIsLoading(true);
    try {
      const results = await Movie.getByEmotion(emotion);
      setMovies(results);
    } catch (error) {
      setMovies([]);
    }
    setIsLoading(false);
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
    getRecommendations(emotion);
  };

  const handleCustomVibe = () => {
    if (customVibe.trim()) {
      setSelectedEmotion(customVibe.trim());
      getRecommendations(customVibe.trim());
    }
  };

  const getRandomMovie = () => {
    if (movies.length > 0) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      setSelectedMovie(randomMovie);
      setIsDetailsOpen(true);
    }
  };

  const clearMood = () => {
    setSelectedEmotion(null);
    setMovies([]);
    setCustomVibe("");
  };

  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
    if (movie.id) {
      const fullDetails = await Movie.getDetails(movie.id);
      if (fullDetails) setSelectedMovie(fullDetails);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header section */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl"
          >
            How do you want to feel <span className="gradient-text">tonight?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-10 max-w-2xl text-muted-foreground"
          >
            Pick an emotion, type your vibe, or surprise yourself — we'll find the perfect movie for you.
          </motion.p>

          {/* Emotion chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex flex-wrap justify-center gap-2"
          >
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.name}
                onClick={() => handleEmotionSelect(emotion.name)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${selectedEmotion === emotion.name
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent shadow-lg shadow-primary/20"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
              >
                {emotion.label}
              </button>
            ))}
          </motion.div>

          {/* Custom vibe input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto flex max-w-md gap-2"
          >
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={customVibe}
                onChange={(e) => setCustomVibe(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomVibe()}
                placeholder="Type your vibe..."
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <Button
              onClick={handleCustomVibe}
              disabled={!customVibe.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl"
            >
              Discover
            </Button>
          </motion.div>

          {/* Action buttons */}
          {selectedEmotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center justify-center gap-3"
            >
              <Button
                variant="outline"
                onClick={clearMood}
                className="rounded-xl border-border text-muted-foreground hover:text-foreground gap-2"
              >
                <X className="h-4 w-4" />
                Clear Mood
              </Button>
              <Button
                onClick={getRandomMovie}
                disabled={movies.length === 0}
                className="rounded-xl bg-card border border-border text-foreground hover:bg-secondary gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Surprise Me
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results */}
      {selectedEmotion && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Perfect for: <span className="gradient-text">"{selectedEmotion}"</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {movies.length} recommendations
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card border border-border" />
                ))}
            </div>
          )}

          {!isLoading && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {movies.map((movie, index) => (
                  <motion.div
                    key={`${movie.id || movie.imdb_id || 'movie'}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MovieCard movie={movie} onSelect={handleMovieSelect} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!isLoading && movies.length === 0 && (
            <div className="py-16 text-center">
              <div className="mb-4 text-5xl">🎬</div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No movies found</h3>
              <p className="mb-6 text-muted-foreground">
                Try searching for movies first to build the cache, or choose a different emotion.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={clearMood} className="border-border text-muted-foreground">
                  Choose Different Emotion
                </Button>
                <Link to={createPageUrl("Search")}>
                  <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    Search Movies
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty state — no emotion selected */}
      {!selectedEmotion && (
        <section className="mx-auto max-w-2xl px-4 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-border bg-card p-10"
          >
            <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Choose a mood or search for movies
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Select an emotion above, type your own vibe, or head to search to find something specific.
            </p>
            <Link to={createPageUrl("Search")}>
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl gap-2">
                <Search className="h-4 w-4" />
                Search Movies
              </Button>
            </Link>
          </motion.div>
        </section>
      )}

      <MovieDetails
        movie={selectedMovie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <ChatWidget />
    </div>
  );
}
