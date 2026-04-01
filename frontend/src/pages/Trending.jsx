import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MovieCard from "@/components/movie/MovieCard";
import MovieDetails from "@/components/movie/MovieDetails";
import { Flame } from "lucide-react";
import api from "@/api/axios";

const mapMovie = (m) => ({
  id: m.imdbID || m.imdbId || m.imdbid,
  title: m.Title || m.title,
  poster: m.Poster || m.poster,
  year: m.Year || m.year,
  type: m.Type || m.type,
  genre: m.Genre || m.genre,
  director: m.Director || m.director,
  writer: m.Writer || m.writer,
  actors: m.Actors || m.actors,
  plot: m.Plot || m.plot,
  language: m.Language || m.language,
  country: m.Country || m.country,
  awards: m.Awards || m.awards,
  runtime: m.Runtime || m.runtime,
  imdb_rating: m.imdbRating || m.imdb_rating || m.imdbrating,
  imdb_votes: m.imdbVotes || m.imdb_votes || m.imdbvotes,
  imdbRating: m.imdbRating,
});

export default function Trending() {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: async () => {
      const res = await api.get("/movies/trending");
      return res.data.map(mapMovie);
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  const activeId = selectedMovie?.id || null;
  const currentIdx = activeId && movies ? movies.findIndex(m => m.id === activeId) : -1;
  const handleNext = currentIdx >= 0 && currentIdx < movies.length - 1 ? () => handleMovieSelect(movies[currentIdx + 1]) : undefined;
  const handlePrevious = currentIdx > 0 ? () => handleMovieSelect(movies[currentIdx - 1]) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Centered Header imitating Home page */}
      <div className="flex flex-col items-center justify-center text-center space-y-5 pb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Flame className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Top 20 <span className="gradient-text">Trending This Week</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            The hottest global movies and TV shows right now.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-[spin_0.8s_linear_infinite] rounded-full border-4 border-slate-200 border-t-orange-500"></div>
        </div>
      )}

      {isError && (
        <div className="flex justify-center py-20">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-medium text-red-500">
            Could not load trending right now. They might be too hot!
          </div>
        </div>
      )}

      {!isLoading && !isError && movies && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={handleMovieSelect} />
          ))}
        </div>
      )}

      <MovieDetails
        movie={selectedMovie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
}
