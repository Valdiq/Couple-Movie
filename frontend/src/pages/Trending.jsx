import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MovieCard from "@/components/movie/MovieCard";
import MovieDetails from "@/components/movie/MovieDetails";
import { Flame } from "lucide-react";

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
      const token = localStorage.getItem("token") || ""; 
      const res = await fetch("/api/v1/movies/trending", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  const activeId = selectedMovie ? (selectedMovie.imdbId || selectedMovie.imdb_id || selectedMovie.imdbID || selectedMovie.id) : null;
  const currentIdx = activeId && movies ? movies.findIndex(m => (m.imdbId || m.imdb_id || m.imdbID || m.id) === activeId) : -1;
  const handleNext = currentIdx >= 0 && currentIdx < movies.length - 1 ? () => handleMovieSelect(movies[currentIdx + 1]) : undefined;
  const handlePrevious = currentIdx > 0 ? () => handleMovieSelect(movies[currentIdx - 1]) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-500/20">
          <Flame className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Top 20 Trending This Week</h1>
          <p className="text-muted-foreground mt-1 text-sm">The hottest global movies and TV shows right now.</p>
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
            <MovieCard key={movie.imdbId} movie={movie} onSelect={handleMovieSelect} />
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
