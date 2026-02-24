import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Movie } from "@/entities/Movie";
import MovieCard from "../components/movie/MovieCard";
import MovieDetails from "../components/movie/MovieDetails";
import ChatWidget from "../components/chat/ChatWidget";
import Pagination from "../components/ui/Pagination";

const ITEMS_PER_PAGE = 15;

const availableGenres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];

const availableEmotions = [
  "romantic", "exciting", "happy", "emotional", "uplifting", "mysterious", "cozy", "passionate",
  "inspiring", "thrilling", "nostalgic", "melancholic", "euphoric", "adventurous", "terrifying",
  "haunting", "playful", "whimsical", "intense", "peaceful", "empowering", "heartwarming",
  "cathartic", "surreal", "contemplative", "rebellious", "energetic", "dramatic",
  "comforting", "bittersweet", "sophisticated", "liberating"
];

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
  const [showFilters, setShowFilters] = useState(false);

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
    try { const results = await Movie.searchByGenres(genres); setFilteredMovies(results); }
    catch (error) { }
    setIsLoading(false);
  };

  const fetchByEmotions = async (emotions) => {
    setIsLoading(true);
    try {
      if (emotions.length === 1) {
        const results = await Movie.getByEmotion(emotions[0]); setFilteredMovies(results);
      } else {
        const results = await Movie.getByEmotions(emotions); setFilteredMovies(results);
      }
    } catch (error) { }
    setIsLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setMovies([]); setFilteredMovies([]); return; }
    setIsSearching(true);
    setCurrentPage(1);
    try {
      const results = await Movie.search(searchQuery.trim());
      setMovies(results);
      setFilteredMovies(results);
      if (results.length > 0) {
        const ids = results.map(m => m.id).filter(Boolean);
        if (ids.length > 0) {
          const ratingsMap = await Movie.batchRatings(ids);
          setRatings(ratingsMap || {});
        }
      }
    } catch (error) { }
    setIsSearching(false);
  };

  const toggleGenre = (genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre) : [...selectedGenres, genre];
    setSelectedGenres(newGenres);
    if (newGenres.length > 0) setSelectedEmotions([]);
  };

  const toggleEmotion = (emotion) => {
    const newEmotions = selectedEmotions.includes(emotion)
      ? selectedEmotions.filter(e => e !== emotion) : [...selectedEmotions, emotion];
    setSelectedEmotions(newEmotions);
    if (newEmotions.length > 0) setSelectedGenres([]);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedEmotions([]);
    setFilteredMovies(movies);
    setCurrentPage(1);
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie({ ...movie, imdb_rating: movie.imdb_rating || ratings[movie.id] || null });
    setIsDetailsOpen(true);
  };

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const moviesWithRatings = paginatedMovies.map(m => ({ ...m, imdb_rating: m.imdb_rating || ratings[m.id] || null }));
  const activeFiltersCount = selectedGenres.length + selectedEmotions.length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Search & <span className="gradient-text">Discover</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Search by title, filter by genre, or choose emotions to discover movies.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Search bar */}
          <motion.form onSubmit={handleSearch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mx-auto flex max-w-2xl gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by movie title..."
                className="h-12 w-full rounded-xl border-border bg-card pl-12 text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <Button type="submit" disabled={isSearching}
              className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground gap-2 shadow-lg shadow-primary/20"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
              <span className="hidden sm:inline">{isSearching ? "Searching..." : "Search"}</span>
            </Button>
          </motion.form>

          {/* Filter toggle */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mx-auto flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="bg-primary/20 text-primary border-0 text-xs">{activeFiltersCount}</Badge>
              )}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </motion.div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-border bg-card p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Filters</span>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground gap-1">
                      <X className="h-3 w-3" /> Clear All
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map(genre => (
                      <button key={genre} onClick={() => toggleGenre(genre)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${selectedGenres.includes(genre)
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-primary/30"
                          }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">
                    Emotions {selectedEmotions.length > 0 && <span className="text-primary">({selectedEmotions.length})</span>}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableEmotions.map(emotion => (
                      <button key={emotion} onClick={() => toggleEmotion(emotion)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all ${selectedEmotions.includes(emotion)
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-primary/30"
                          }`}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedGenres.map(g => (
                <Badge key={g} className="bg-primary/10 text-primary border-primary/20 gap-1 cursor-pointer" onClick={() => toggleGenre(g)}>
                  {g} <X className="h-3 w-3" />
                </Badge>
              ))}
              {selectedEmotions.map(e => (
                <Badge key={e} className="bg-accent/10 text-accent border-accent/20 gap-1 capitalize cursor-pointer" onClick={() => toggleEmotion(e)}>
                  {e} <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            {isSearching || isLoading ? 'Loading...' :
              `Showing ${filteredMovies.length} ${filteredMovies.length === 1 ? 'result' : 'results'}${totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ''}`
            }
          </p>

          {/* Loading */}
          {(isLoading || isSearching) && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card border border-border" />
              ))}
            </div>
          )}

          {/* Results grid */}
          {!(isLoading || isSearching) && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {moviesWithRatings.map((movie, index) => (
                  <motion.div key={`${movie.id || movie.imdb_id || 'movie'}-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <MovieCard movie={movie} onSelect={handleMovieSelect} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!(isLoading || isSearching) && filteredMovies.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}

          {!(isLoading || isSearching) && filteredMovies.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <div className="mb-4 text-5xl">🧐</div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No movies found</h3>
              <p className="text-muted-foreground">Try searching for a movie by title, or use genre/emotion filters to discover from cached films.</p>
            </motion.div>
          )}
        </div>
      </div>

      <MovieDetails movie={selectedMovie} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      <ChatWidget />
    </div>
  );
}
