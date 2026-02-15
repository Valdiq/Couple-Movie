
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle, Sparkles, Search } from "lucide-react";
import { Movie } from "@/entities/Movie";
import { InvokeLLM } from "@/integrations/Core";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EmotionSelector from "../components/movie/EmotionSelector";
import CustomEmotionInput from "../components/movie/CustomEmotionInput"; // Added this import
import MovieCard from "../components/movie/MovieCard";
import MovieDetails from "../components/movie/MovieDetails";
import ChatWidget from "../components/chat/ChatWidget";

export default function Home() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadInitialMovies();
  }, []);

  const loadInitialMovies = async () => {
    try {
      const movieData = await Movie.list("-created_date", 12);
      setMovies(movieData);
    } catch (error) {
      console.error("Error loading movies:", error);
    }
  };

  const getRecommendations = async (emotion) => {
    setIsLoading(true);
    try {
      const existingMovies = await Movie.list();
      
      // Filter movies by AI-analyzed emotions
      const filteredMovies = existingMovies.filter(movie => 
        movie.ai_emotions?.includes(emotion)
      );
      
      if (filteredMovies.length >= 8) {
        // If we have enough movies with this emotion, show them
        setMovies(filteredMovies.slice(0, 12));
      } else {
        // Use AI to find movies that match the emotion from our database
        const moviesForAnalysis = existingMovies.map(m => ({
          id: m.id,
          title: m.title,
          plot: m.plot,
          genre: m.genre,
          ai_emotions: m.ai_emotions || []
        }));

        const response = await InvokeLLM({
          prompt: `A user wants to feel "${emotion}". From this list of movies, find ones that would evoke this emotion. Consider genres, plot themes, and existing AI emotions. Return movie IDs that best match: ${JSON.stringify(moviesForAnalysis)}`,
          response_json_schema: {
            type: "object",
            properties: {
              movie_ids: {
                type: "array",
                items: { type: "string" },
                description: "Array of movie IDs that evoke the requested emotion"
              }
            }
          }
        });

        if (response.movie_ids && response.movie_ids.length > 0) {
          const movieMap = new Map(existingMovies.map(m => [m.id, m]));
          const recommendedMovies = response.movie_ids.map(id => movieMap.get(id)).filter(Boolean);
          setMovies(recommendedMovies.slice(0, 12));
        } else {
          setMovies(filteredMovies);
        }
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setMovies([]);
    }
    setIsLoading(false);
  };

  const getCustomEmotionRecommendations = async (emotionText) => {
    setIsLoading(true);
    setSelectedEmotion(emotionText); // Use the custom emotion as selected
    
    try {
      const existingMovies = await Movie.list();
      
      // Use AI to analyze the custom emotion and find matching movies
      const moviesForAnalysis = existingMovies.map(m => ({
        id: m.id,
        title: m.title,
        plot: m.plot,
        genre: m.genre,
        ai_emotions: m.ai_emotions || []
      }));

      const response = await InvokeLLM({
        prompt: `A user is feeling: "${emotionText}". Based on this emotional state and mood, find movies from this database that would resonate with them or provide what they're looking for. Consider the plot themes, genres, and existing AI emotions. Return movie IDs that best match their emotional needs: ${JSON.stringify(moviesForAnalysis)}`,
        response_json_schema: {
          type: "object",
          properties: {
            movie_ids: {
              type: "array",
              items: { type: "string" },
              description: "Array of movie IDs that match the user's emotional state"
            }
          }
        }
      });

      if (response.movie_ids && response.movie_ids.length > 0) {
        const movieMap = new Map(existingMovies.map(m => [m.id, m]));
        const recommendedMovies = response.movie_ids.map(id => movieMap.get(id)).filter(Boolean);
        setMovies(recommendedMovies.slice(0, 12));
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error("Error getting custom emotion recommendations:", error);
      setMovies([]);
    }
    setIsLoading(false);
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
    getRecommendations(emotion);
  };

  const getRandomMovie = () => {
    if (movies.length > 0) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      setSelectedMovie(randomMovie);
      setIsDetailsOpen(true);
    }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-slate-900 text-slate-300">
      {!selectedEmotion ? (
        <>
          <section className="text-center py-16 md:py-24 bg-slate-900 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-900/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6">
                Your Perfect
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Movie Night</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto">
                Discover movies and shows that match your emotions with AI-powered recommendations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={getRandomMovie}
                  disabled={movies.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 px-8 py-3 rounded-full text-lg shadow-lg shadow-pink-500/20"
                >
                  <Shuffle className="w-5 h-5 mr-2" />
                  Surprise Me
                </Button>
                <Link to={createPageUrl("Search")}>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-3 rounded-full text-lg"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search For a Movie
                  </Button>
                </Link>
              </div>
              <p className="text-slate-500 text-sm mt-6">or choose your mood below</p>
            </motion.div>
          </section>

          <CustomEmotionInput onEmotionSubmit={getCustomEmotionRecommendations} />

          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onEmotionSelect={handleEmotionSelect}
          />
        </>
      ) : (
        <div className="py-12">
          {/* Results Header */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">
                  Perfect for: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">"{selectedEmotion}"</span>
                </h1>
                <p className="text-slate-400">
                  {movies.length} AI-curated recommendations tailored to how you're feeling
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmotion(null)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Change Mood
                </Button>
                <Button
                  onClick={getRandomMovie}
                  disabled={movies.length === 0}
                  className="bg-slate-200 text-slate-800 hover:bg-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Random Pick
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-2xl aspect-[2/3] animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Movie Grid */}
          {!isLoading && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                  {movies.map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <MovieCard movie={movie} onSelect={handleMovieSelect} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {movies.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold text-slate-200 mb-2">No movies found for this emotion</h3>
                  <p className="text-slate-400 text-lg mb-6">
                    Try adding some content from our search page, or choose a different emotion.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => setSelectedEmotion(null)}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Choose Different Emotion
                    </Button>
                    <Link to={createPageUrl("Search")}>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        Add Movies
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
