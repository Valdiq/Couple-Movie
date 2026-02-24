
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Movie } from "@/entities/Movie";
import MovieCard from "../components/movie/MovieCard";
import MovieDetails from "../components/movie/MovieDetails";
import ChatWidget from "../components/chat/ChatWidget";
import Pagination from "../components/ui/Pagination";

const ITEMS_PER_PAGE = 15;

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ratings, setRatings] = useState({});

  const availableGenres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];

  const availableEmotions = [
    "romantic", "exciting", "happy", "emotional", "uplifting", "mysterious", "cozy", "passionate",
    "inspiring", "thrilling", "nostalgic", "melancholic", "euphoric", "adventurous", "terrifying",
    "haunting", "playful", "whimsical", "intense", "peaceful", "empowering", "heartwarming",
    "cathartic", "surreal", "contemplative", "rebellious", "energetic", "dramatic",
    "comforting", "bittersweet", "sophisticated", "liberating"
  ];

  // Whenever genres or emotions change, fetch matching movies from backend
  useEffect(() => {
    if (selectedGenres.length > 0) {
      fetchByGenres(selectedGenres);
    } else if (selectedEmotions.length > 0) {
      fetchByEmotions(selectedEmotions);
    } else if (searchQuery === "") {
      setFilteredMovies(movies);
    }
    setCurrentPage(1);
  }, [selectedGenres, selectedEmotions]);

  const fetchByGenres = async (genres) => {
    setIsLoading(true);
    try {
      const results = await Movie.searchByGenres(genres);
      setFilteredMovies(results);
    } catch (error) {
      console.error("Error fetching by genres:", error);
    }
    setIsLoading(false);
  };

  const fetchByEmotions = async (emotions) => {
    setIsLoading(true);
    try {
      if (emotions.length === 1) {
        const results = await Movie.getByEmotion(emotions[0]);
        setFilteredMovies(results);
      } else {
        const results = await Movie.getByEmotions(emotions);
        setFilteredMovies(results);
      }
    } catch (error) {
      console.error("Error fetching by emotions:", error);
    }
    setIsLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setMovies([]);
      setFilteredMovies([]);
      return;
    }
    setIsSearching(true);
    setCurrentPage(1);
    try {
      const results = await Movie.search(searchQuery.trim());
      setMovies(results);
      setFilteredMovies(results);

      // Fetch batch ratings for all search results from ES cache
      if (results.length > 0) {
        const ids = results.map(m => m.id).filter(Boolean);
        if (ids.length > 0) {
          const ratingsMap = await Movie.batchRatings(ids);
          setRatings(ratingsMap || {});
        }
      }
    } catch (error) {
      console.error("Error searching movies:", error);
    }
    setIsSearching(false);
  };

  const toggleGenre = (genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(newGenres);
    if (newGenres.length > 0) {
      setSelectedEmotions([]);
    }
  };

  const toggleEmotion = (emotion) => {
    const newEmotions = selectedEmotions.includes(emotion)
      ? selectedEmotions.filter(e => e !== emotion)
      : [...selectedEmotions, emotion];
    setSelectedEmotions(newEmotions);
    if (newEmotions.length > 0) {
      setSelectedGenres([]);
    }
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedEmotions([]);
    setFilteredMovies(movies);
    setCurrentPage(1);
  };

  const handleMovieSelect = (movie) => {
    // Show details immediately with whatever data we have
    setSelectedMovie({
      ...movie,
      imdb_rating: movie.imdb_rating || ratings[movie.id] || null,
    });
    setIsDetailsOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Merge ratings into movies for display
  const moviesWithRatings = paginatedMovies.map(m => ({
    ...m,
    imdb_rating: m.imdb_rating || ratings[m.id] || null,
  }));

  return (
    <div className="min-h-screen py-8 pb-20 md:pb-8 bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Find Your Next Movie
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Search by title, filter by genre, or choose emotions to discover movies.
          </p>
        </motion.div>

        <div className="space-y-8">
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-2xl mx-auto flex gap-2"
          >
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by movie title..."
                className="pl-12 pr-4 py-3 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-purple-500 rounded-xl h-12 w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg shadow-pink-500/20"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SearchIcon className="w-5 h-5" />
              )}
              <span className="ml-2 hidden sm:inline">
                {isSearching ? "Searching..." : "Search"}
              </span>
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300 font-medium">Filters:</span>
              </div>
              {(selectedGenres.length > 0 || selectedEmotions.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div>
              <h3 className="text-slate-300 font-medium mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map(genre => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 rounded-full px-3 py-1 ${selectedGenres.includes(genre)
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      }`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-slate-300 font-medium mb-3">Emotions {selectedEmotions.length > 0 && <span className="text-purple-400 text-sm">({selectedEmotions.length} selected)</span>}</h3>
              <div className="flex flex-wrap gap-2">
                {availableEmotions.map(emotion => (
                  <Badge
                    key={emotion}
                    variant={selectedEmotions.includes(emotion) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 capitalize rounded-full px-3 py-1 ${selectedEmotions.includes(emotion)
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      }`}
                    onClick={() => toggleEmotion(emotion)}
                  >
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} >
            <p className="text-slate-400">
              {isSearching || isLoading ? 'Loading...' : `Showing ${filteredMovies.length} ${filteredMovies.length === 1 ? 'result' : 'results'}${totalPages > 1 ? ` • Page ${currentPage} of ${totalPages}` : ''}`}
            </p>
          </motion.div>

          {(isLoading || isSearching) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-2xl aspect-[2/3] animate-pulse" />
              ))}
            </div>
          )}

          {!(isLoading || isSearching) && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {moviesWithRatings.map((movie, index) => (
                  <motion.div
                    key={movie.id}
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

          {!(isLoading || isSearching) && filteredMovies.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {!(isLoading || isSearching) && filteredMovies.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🧐</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">No movies found</h3>
              <p className="text-slate-400 mb-6">
                Try searching for a movie by title, or use genre/emotion filters to discover from cached films.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <MovieDetails
        movie={selectedMovie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <ChatWidget />
    </div>
  );
}
