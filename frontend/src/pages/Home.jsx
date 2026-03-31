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
import AppleEmoji from "@/components/ui/AppleEmoji";
import Pagination from "../components/ui/Pagination";

const EMOTIONS = [
  { name: "Romantic", text: "Romantic", emoji: "💕" },
  { name: "Exciting", text: "Exciting", emoji: "⚡" },
  { name: "Happy", text: "Happy", emoji: "😊" },
  { name: "Cozy", text: "Cozy", emoji: "☕" },
  { name: "Thrilling", text: "Thrilling", emoji: "🎯" },
  { name: "Uplifting", text: "Uplifting", emoji: "☀️" },
  { name: "Nostalgic", text: "Nostalgic", emoji: "🧠" },
  { name: "Mysterious", text: "Mysterious", emoji: "🌙" },
  { name: "Adventurous", text: "Adventurous", emoji: "🚀" },
  { name: "Emotional", text: "Emotional", emoji: "💧" },
  { name: "Passionate", text: "Passionate", emoji: "🔥" },
  { name: "Inspiring", text: "Inspiring", emoji: "⭐" },
];

export default function Home() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [customVibe, setCustomVibe] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);

  const getRecommendations = async (emotion, pageNum = 1) => {
    setIsLoading(true);
    try {
      const response = await Movie.filter([], [emotion], pageNum - 1, 20, false);
      const results = response.movies || [];
      const hits = response.totalHits || 0;
      
      setMovies(results);
      setTotalHits(hits);
    } catch (error) {
      setMovies([]);
      setTotalHits(0);
    }
    setIsLoading(false);
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
    setCurrentPage(1);
    getRecommendations(emotion, 1);
  };

  const handleCustomVibe = () => {
    if (customVibe.trim()) {
      const vibe = customVibe.trim();
      setSelectedEmotion(vibe);
      setCurrentPage(1);
      getRecommendations(vibe, 1);
    }
  };

  const getRandomMovie = async () => {
    setIsLoading(true);
    let randomMovie;

    if (selectedEmotion && movies.length > 0) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      randomMovie = movies[randomIndex];
    } else {
      randomMovie = await Movie.getRandom();
    }

    if (randomMovie) {
      setSelectedMovie(randomMovie);
      setIsDetailsOpen(true);
    }
    setIsLoading(false);
  };

  const clearMood = () => {
    setSelectedEmotion(null);
    setMovies([]);
    setCustomVibe("");
    setCurrentPage(1);
    setTotalHits(0);
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  const activeId = selectedMovie ? (selectedMovie.imdbId || selectedMovie.imdb_id || selectedMovie.imdbID || selectedMovie.id) : null;
  const currentIdx = activeId ? movies.findIndex(m => (m.imdbId || m.imdb_id || m.imdbID || m.id) === activeId) : -1;
  const handleNext = currentIdx >= 0 && currentIdx < movies.length - 1 ? () => handleMovieSelect(movies[currentIdx + 1]) : undefined;
  const handlePrevious = currentIdx > 0 ? () => handleMovieSelect(movies[currentIdx - 1]) : undefined;

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
            Pick an emotion, type your vibe, or surprise yourself — we'll find the perfect movie for you
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
                {emotion.text} <AppleEmoji emoji={emotion.emoji} className="ml-1" />
              </button>
            ))}
          </motion.div>

          {/* Surprise me button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto flex max-w-md justify-center"
          >
            <Button
              onClick={getRandomMovie}
              disabled={isLoading}
              className="rounded-xl bg-card border border-border text-foreground hover:bg-secondary gap-2 hidden sm:flex"
            >
              <Shuffle className="h-4 w-4" />
              Surprise Me
            </Button>
          </motion.div>
          {/* Mobile Surprise Me button below */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-4 flex sm:hidden justify-center"
          >
            <Button
              onClick={getRandomMovie}
              disabled={isLoading}
              className="rounded-xl bg-card border border-border text-foreground hover:bg-secondary gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Surprise Me
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
                {totalHits > 0 ? `${totalHits} recommendations` : `${movies.length} recommendations`}
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

          {totalHits > 20 && (
            <div className="mt-8 flex justify-center pb-8 border-b-0">
              <Pagination 
                currentPage={currentPage} 
                totalPages={Math.ceil(totalHits / 20)} 
                onPageChange={(page) => {
                  setCurrentPage(page);
                  getRecommendations(selectedEmotion, page);
                }} 
              />
            </div>
          )}

          {!isLoading && movies.length === 0 && (
            <div className="py-16 text-center shadow-none">
              <div className="mb-4 text-5xl flex justify-center"><AppleEmoji emoji="🎬" /></div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No movies found</h3>
              <p className="mb-6 text-muted-foreground">
                Try searching for movies first to build the cache, or choose a different emotion
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
              Select an emotion above or head to search to find something specific
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
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      <ChatWidget />
    </div>
  );
}
