
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, Sparkles, Loader2, ServerOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Movie } from "@/entities/Movie";
import { InvokeLLM } from "@/integrations/Core";
import MovieCard from "../components/movie/MovieCard";
import MovieDetails from "../components/movie/MovieDetails";
import ChatWidget from "../components/chat/ChatWidget";
import CustomEmotionInput from "../components/movie/CustomEmotionInput";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiSearching, setIsAiSearching] = useState(false);

  const availableGenres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];
  
  const availableEmotions = [
    "romantic", "exciting", "happy", "emotional", "uplifting", "mysterious", "cozy", "passionate",
    "inspiring", "thrilling", "nostalgic", "melancholic", "euphoric", "adventurous", "terrifying",
    "haunting", "playful", "whimsical", "intense", "peaceful", "empowering", "heartwarming",
    "cathartic", "surreal", "contemplative", "rebellious", "protective", "energetic", "dramatic",
    "comforting", "bittersweet", "sophisticated", "liberating"
  ];

  const applyLocalFilters = useCallback(() => {
    let results = [...movies];
    if (selectedGenres.length > 0) {
      results = results.filter(movie =>
        movie.genre && selectedGenres.some(genre => 
          movie.genre.toLowerCase().includes(genre.toLowerCase())
        )
      );
    }
    if (selectedEmotions.length > 0) {
      results = results.filter(movie =>
        movie.ai_emotions && movie.ai_emotions.some(emotion => 
          selectedEmotions.includes(emotion)
        )
      );
    }
    setFilteredMovies(results);
  }, [movies, selectedGenres, selectedEmotions]);

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    if (searchQuery === "") {
      applyLocalFilters();
    }
  }, [searchQuery, applyLocalFilters]);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const movieData = await Movie.list("-created_date", 100);
      setMovies(movieData);
      setFilteredMovies(movieData);
    } catch (error) {
      console.error("Error loading movies:", error);
    }
    setIsLoading(false);
  };

  const handleUnifiedSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      applyLocalFilters();
      return;
    }
    setIsAiSearching(true);

    // This is where OMDB search would happen. For now, we only search local DB.
    // The alert will guide the user to enable backend functions.
    await handleAiSearchOnLocalDB();
    
    setIsAiSearching(false);
  };

  const handleAiSearchOnLocalDB = async () => {
    try {
      const moviesForContext = movies.map(m => ({
        id: m.id,
        title: m.title,
        plot: m.plot,
        genre: m.genre,
        director: m.director,
        actors: m.actors,
        year: m.year,
        imdb_rating: m.imdb_rating,
        language: m.language,
        country: m.country,
        awards: m.awards,
        ai_emotions: m.ai_emotions,
        type: m.type
      }));

      const genreFilter = selectedGenres.length > 0 ? `Genres: ${selectedGenres.join(', ')}` : '';
      const emotionFilter = selectedEmotions.length > 0 ? `Emotions: ${selectedEmotions.join(', ')}` : '';
      const filters = [genreFilter, emotionFilter].filter(Boolean).join('. ');

      const prompt = `You are an advanced movie recommendation AI. A user is searching with this query: "${searchQuery}". ${filters ? `They also applied these filters: ${filters}.` : ''} Analyze all fields of each movie and return the IDs of movies that best match the user's intent. Consider semantic similarity. Movies database: ${JSON.stringify(moviesForContext)} Return up to 12 movie IDs ordered by relevance.`;
      
      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            movie_ids: {
              type: "array",
              items: { "type": "string" },
              description: "An array of movie IDs that match the query, ordered by relevance."
            }
          }
        }
      });

      if (response && response.movie_ids) {
        const movieMap = new Map(movies.map(m => [m.id, m]));
        const aiFiltered = response.movie_ids.map(id => movieMap.get(id)).filter(Boolean);
        setFilteredMovies(aiFiltered);
      } else {
        setFilteredMovies([]);
      }
    } catch (error) {
      console.error("Error with AI search:", error);
      const basicFiltered = movies.filter(movie =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMovies(basicFiltered);
    }
  };

  const handleCustomEmotionSearch = async (emotionText) => {
    setIsAiSearching(true);
    setSearchQuery(emotionText); // Set the emotion as search query
    
    try {
      const moviesForContext = movies.map(m => ({
        id: m.id,
        title: m.title,
        plot: m.plot,
        genre: m.genre,
        director: m.director,
        actors: m.actors,
        year: m.year,
        imdb_rating: m.imdb_rating,
        language: m.language,
        country: m.country,
        awards: m.awards,
        ai_emotions: m.ai_emotions,
        type: m.type
      }));

      const genreFilter = selectedGenres.length > 0 ? `Genres: ${selectedGenres.join(', ')}` : '';
      const emotionFilter = selectedEmotions.length > 0 ? `Emotions: ${selectedEmotions.join(', ')}` : '';
      const filters = [genreFilter, emotionFilter].filter(Boolean).join('. ');

      const prompt = `A user is feeling: "${emotionText}". ${filters ? `They also applied these filters: ${filters}.` : ''} Find movies that match their emotional state and mood. Consider how different movies might help them feel better, provide comfort, excitement, or whatever they're looking for. Movies database: ${JSON.stringify(moviesForContext)} Return up to 12 movie IDs ordered by emotional relevance.`;
      
      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            movie_ids: {
              type: "array",
              items: { "type": "string" },
              description: "An array of movie IDs that match the user's emotional state."
            }
          }
        }
      });

      if (response && response.movie_ids) {
        const movieMap = new Map(movies.map(m => [m.id, m]));
        const emotionFiltered = response.movie_ids.map(id => movieMap.get(id)).filter(Boolean);
        setFilteredMovies(emotionFiltered);
      } else {
        setFilteredMovies([]);
      }
    } catch (error) {
      console.error("Error with emotion search:", error);
      setFilteredMovies([]);
    }
    setIsAiSearching(false);
  };

  const toggleGenre = (genre) => {
    const newGenres = selectedGenres.includes(genre)
        ? selectedGenres.filter(g => g !== genre)
        : [...selectedGenres, genre];
    setSelectedGenres(newGenres);
  };

  const toggleEmotion = (emotion) => {
    const newEmotions = selectedEmotions.includes(emotion)
        ? selectedEmotions.filter(e => e !== emotion)
        : [...selectedEmotions, emotion];
    setSelectedEmotions(newEmotions);
  };
  
  useEffect(() => {
      applyLocalFilters();
  }, [selectedGenres, selectedEmotions, applyLocalFilters]);

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedEmotions([]);
    setFilteredMovies(movies);
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

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
            Use natural language to search. The more you search, the smarter our library gets.
          </p>
        </motion.div>

        <div className="space-y-8">
            <motion.form
              onSubmit={handleUnifiedSearch}
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
                  placeholder="e.g., 'a funny space movie' or 'films by Wes Anderson'"
                  className="pl-12 pr-4 py-3 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-purple-500 rounded-xl h-12 w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={isAiSearching}
                className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg shadow-pink-500/20"
              >
                {isAiSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {isAiSearching ? "Thinking..." : "AI Search"}
                </span>
              </Button>
            </motion.form>

             <Alert variant="default" className="max-w-2xl mx-auto bg-slate-800/50 border-slate-700 text-slate-400">
                <ServerOff className="h-4 w-4 !text-slate-500" />
                <AlertTitle className="text-slate-200">Want Better Search Results?</AlertTitle>
                <AlertDescription>
                  To automatically discover and add new movies from the internet, please enable backend functions in <strong>Dashboard &rarr; Settings</strong>, then let me know to complete the OMDB integration.
                </AlertDescription>
              </Alert>

            <CustomEmotionInput onEmotionSubmit={handleCustomEmotionSearch} />

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
                      className={`cursor-pointer transition-all duration-200 rounded-full px-3 py-1 ${
                        selectedGenres.includes(genre)
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
                <h3 className="text-slate-300 font-medium mb-3">Emotions</h3>
                <div className="flex flex-wrap gap-2">
                  {availableEmotions.map(emotion => (
                    <Badge
                      key={emotion}
                      variant={selectedEmotions.includes(emotion) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 capitalize rounded-full px-3 py-1 ${
                        selectedEmotions.includes(emotion)
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
                {isAiSearching ? 'AI is thinking...' : `Showing ${filteredMovies.length} ${filteredMovies.length === 1 ? 'result' : 'results'} from your library`}
              </p>
            </motion.div>

            {(isLoading || isAiSearching) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-2xl aspect-[2/3] animate-pulse" />
                ))}
              </div>
            )}

            {!(isLoading || isAiSearching) && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                  {filteredMovies.map((movie, index) => (
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

            {!(isLoading || isAiSearching) && filteredMovies.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🧐</div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">No movies found</h3>
                <p className="text-slate-400 mb-6">
                  Try adjusting your search query or filters.
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
