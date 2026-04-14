import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, Loader2, X, ChevronDown, ChevronUp, Film } from "lucide-react";
import debounce from "lodash/debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Movie } from "@/entities/Movie";
import MovieCard from "../components/movie/MovieCard";
import MovieDetails from "../components/movie/MovieDetails";
import ChatWidget from "../components/chat/ChatWidget";
import Pagination from "../components/ui/Pagination";
import AppleEmoji from "@/components/ui/AppleEmoji";

const ITEMS_PER_PAGE = 20;

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
  const [showAwardedOnly, setShowAwardedOnly] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);

  const [hasSearched, setHasSearched] = useState(false);

  // Autocomplete state
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (selectedGenres.length > 0 || selectedEmotions.length > 0 || showAwardedOnly) {
      setHasSearched(true);
      fetchFilters(selectedGenres, selectedEmotions, 1, showAwardedOnly);
    } else if (searchQuery === "") {
      setFilteredMovies(movies);
    }
    setCurrentPage(1);
  }, [selectedGenres, selectedEmotions, showAwardedOnly]);

  const fetchFilters = async (genres, emotions, page = 1, awarded = false) => {
    setIsLoading(true);
    try {
      const { movies: pageMovies, totalHits: hits } = await Movie.filter(genres, emotions, page - 1, ITEMS_PER_PAGE, awarded);
      setFilteredMovies(pageMovies);
      setTotalHits(hits);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const loadPage = async (query, page) => {
    if (isAiMode) {
        const { movies: pageMovies, totalHits: hits } = await Movie.aiSearch(query, page - 1, ITEMS_PER_PAGE);
        setFilteredMovies(pageMovies);
        setTotalHits(hits);
    } else {
        const { movies: pageMovies, totalHits: hits } = await Movie.advancedSearch(query, page - 1, ITEMS_PER_PAGE);
        setFilteredMovies(pageMovies);
        setTotalHits(hits);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setMovies([]); setFilteredMovies([]); setTotalHits(0); return; }
    setIsSearching(true);
    setHasSearched(true);
    setCurrentPage(1);
    try {
      if (isAiMode) {
        // AI Vector Search
        await loadPage(searchQuery.trim(), 1);
      } else {
        // Standard Search
        await Movie.search(searchQuery.trim());
        await loadPage(searchQuery.trim(), 1);
      }
    } catch (error) { console.error(error); }
    setIsSearching(false);
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      if (selectedGenres.length > 0 || selectedEmotions.length > 0 || showAwardedOnly) {
        await fetchFilters(selectedGenres, selectedEmotions, page, showAwardedOnly);
      } else {
        await loadPage(searchQuery.trim(), page);
      }
    } catch (error) { }
    setIsLoading(false);
  };

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        setIsSuggesting(false);
        return;
      }
      setIsSuggesting(true);
      try {
        if (isAiMode) return; // Skip autocomplete for AI queries
        const results = await Movie.autocomplete(query.trim(), 5);
        setSearchSuggestions(results);
        if (results.length > 0) {
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      } finally {
        setIsSuggesting(false);
      }
    }, 300),
    []
  );

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    handleMovieSelect(suggestion);
  };

  const toggleGenre = (genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre) : [...selectedGenres, genre];
    setSelectedGenres(newGenres);
  };

  const toggleEmotion = (emotion) => {
    const newEmotions = selectedEmotions.includes(emotion)
      ? selectedEmotions.filter(e => e !== emotion) : [...selectedEmotions, emotion];
    setSelectedEmotions(newEmotions);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedEmotions([]);
    setShowAwardedOnly(false);
    setFilteredMovies(movies);
    setTotalHits(movies.length);
    setCurrentPage(1);
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie({ ...movie, imdb_rating: movie.imdb_rating || null });
    setIsDetailsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = Math.ceil(totalHits / ITEMS_PER_PAGE);
  const activeFiltersCount = selectedGenres.length + selectedEmotions.length + (showAwardedOnly ? 1 : 0);

  const activeId = selectedMovie ? (selectedMovie.imdbId || selectedMovie.imdb_id || selectedMovie.imdbID || selectedMovie.id) : null;
  const currentIdx = activeId ? filteredMovies.findIndex(m => (m.imdbId || m.imdb_id || m.imdbID || m.id) === activeId) : -1;
  const handleNext = currentIdx >= 0 && currentIdx < filteredMovies.length - 1 ? () => handleMovieSelect(filteredMovies[currentIdx + 1]) : undefined;
  const handlePrevious = currentIdx > 0 ? () => handleMovieSelect(filteredMovies[currentIdx - 1]) : undefined;

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
            className="mx-auto flex max-w-2xl gap-2 z-40 relative"
          >
            <div className="relative flex-1" ref={suggestionsRef}>
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchSuggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search by movie title..."
                className="h-12 w-full rounded-xl border-border bg-card pl-12 text-foreground placeholder:text-muted-foreground focus:border-primary"
              />

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                  >
                    <ul>
                      {searchSuggestions.map((suggestion, index) => (
                        <li key={suggestion.id || index}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/80 focus:bg-secondary/80 focus:outline-none"
                          >
                            {suggestion.poster && suggestion.poster !== "N/A" ? (
                              <img src={suggestion.poster} alt={suggestion.title} className="h-10 w-7 rounded object-cover shadow-sm" />
                            ) : (
                              <div className="flex h-10 w-7 items-center justify-center rounded bg-secondary text-muted-foreground">
                                <Film className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex flex-col flex-1 truncate">
                              <span className="truncate font-medium text-foreground">{suggestion.title}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {suggestion.year && <span>{suggestion.year}</span>}
                                {suggestion.genre && (
                                  <>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span className="truncate">{suggestion.genre.split(',')[0]}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {suggestion.imdb_rating && suggestion.imdb_rating !== "N/A" && (
                              <Badge variant="secondary" className="ml-2 font-mono text-xs">⭐ {suggestion.imdb_rating}</Badge>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button type="submit" disabled={isSearching}
              className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground gap-2 shadow-lg shadow-primary/20"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
              <span className="hidden sm:inline">{isSearching ? "Searching..." : "Search"}</span>
            </Button>
          </motion.form>

          {/* AI Toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mx-auto flex max-w-2xl items-center justify-end pr-2 -mt-4 z-30 relative">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group">
              <span className="text-xl group-hover:scale-110 transition-transform">✨</span>
              <span className="font-medium">AI Semantic Search</span>
              <button type="button" onClick={() => setIsAiMode(!isAiMode)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isAiMode ? 'bg-gradient-to-r from-primary to-accent' : 'bg-secondary'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAiMode ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </label>
          </motion.div>

          {/* Filter toggle */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mx-auto flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0 text-xs">{activeFiltersCount}</Badge>
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

                <div className="flex items-center justify-start gap-4 border-t border-border pt-4">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="text-xl">🏆</span> Award Winners Only
                  </span>
                  <button
                    onClick={() => setShowAwardedOnly(!showAwardedOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showAwardedOnly ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAwardedOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedGenres.map(g => (
                <Badge variant="outline" key={g} className="bg-primary/10 text-primary border-primary/20 gap-1 cursor-pointer" onClick={() => toggleGenre(g)}>
                  {g} <X className="h-3 w-3" />
                </Badge>
              ))}
              {selectedEmotions.map(e => (
                <Badge variant="outline" key={e} className="bg-accent/10 text-accent border-accent/20 gap-1 capitalize cursor-pointer" onClick={() => toggleEmotion(e)}>
                  {e} <X className="h-3 w-3" />
                </Badge>
              ))}
              {showAwardedOnly && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1 cursor-pointer" onClick={() => setShowAwardedOnly(false)}>
                  🏆 Awarded <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          )}

          {/* Results count */}
          {!(isLoading || isSearching) && filteredMovies.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {totalHits} {totalHits === 1 ? 'result' : 'results'}{totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ''}
            </p>
          )}
          {(isLoading || isSearching) && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {(isLoading || isSearching) && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card border border-border" />
              ))}
            </div>
          )}

          {/* Results grid */}
          {!(isLoading || isSearching) && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6"
              >
                {filteredMovies.map((movie, index) => (
                  <motion.div key={`${movie.id || movie.imdb_id || 'movie'}-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <MovieCard movie={movie} onSelect={handleMovieSelect} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!(isLoading || isSearching) && filteredMovies.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}

          {!(isLoading || isSearching) && filteredMovies.length === 0 && hasSearched && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <div className="mb-4 flex justify-center text-7xl"><AppleEmoji emoji="🍿" /></div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">Time for a movie night!</h3>
              <p className="text-muted-foreground">It seems we couldn't find any movies matching that vibe.<br />Try mixing up the genres and emotions, or search for a classic title!</p>
            </motion.div>
          )}
        </div>
      </div>

      <MovieDetails movie={selectedMovie} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} onNext={handleNext} onPrevious={handlePrevious} />
      <ChatWidget />
    </div>
  );
}
