import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Heart, Users, Check, Plus, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserFavorite } from "@/entities/UserFavorite";
import { cn } from "@/lib/utils";

export default function MovieCard({
  movie,
  onSelect,
  variant = "default",
  coupleStatus,
  showCoupleAdd = false,
  onAddToCouple,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const movieTitle = movie?.Title || movie?.title || "";
  const moviePoster = movie?.Poster || movie?.poster || "";
  const movieYear = movie?.Year || movie?.year || "";
  const movieGenre = movie?.Genre || movie?.genre || "";
  const movieImdbId = movie?.imdbID || movie?.imdb_id || movie?.id || "";
  const movieRating = movie?.imdbRating || movie?.imdb_rating || "";
  const movieRuntime = movie?.Runtime || movie?.runtime || "";

  const isMatch = coupleStatus?.user_you_added && coupleStatus?.partner_added;

  useEffect(() => {
    if (variant === "default" && movieImdbId) {
      UserFavorite.check(movieImdbId).then(setIsFavorite).catch(() => { });
    }
  }, [movieImdbId, variant]);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isFavorite) {
        await UserFavorite.remove(movieImdbId);
        setIsFavorite(false);
      } else {
        await UserFavorite.add({
          imdb_id: movieImdbId,
          title: movieTitle,
          poster: moviePoster,
          year: movieYear,
          genre: movieGenre,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error handling favorite:", error);
    }
    setIsLoading(false);
  };

  const handleAddToCouple = (e) => {
    e.stopPropagation();
    onAddToCouple?.(movie);
  };

  const formatGenres = (genreString) => {
    if (!genreString) return [];
    return genreString
      .split(",")
      .map((g) => g.trim())
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-all cursor-pointer",
        isMatch && "ring-2 ring-primary/50 glow-purple"
      )}
      onClick={() => onSelect?.(movie)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {!imgError && moviePoster && moviePoster !== "N/A" ? (
          <img
            src={moviePoster}
            alt={`${movieTitle} poster`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="text-4xl font-bold text-muted-foreground">
              {movieTitle.charAt(0) || <Film className="w-12 h-12" />}
            </span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Action buttons */}
        <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {variant === "default" && (
            <button
              onClick={handleFavorite}
              disabled={isLoading}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full glass transition-all",
                isFavorite && "bg-primary/80 text-primary-foreground"
              )}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart
                className={cn("h-4 w-4", isFavorite && "fill-current")}
              />
            </button>
          )}
          {showCoupleAdd && onAddToCouple && (
            <button
              onClick={handleAddToCouple}
              className="flex h-8 w-8 items-center justify-center rounded-full glass transition-all hover:bg-primary/80 hover:text-primary-foreground"
              aria-label="Add to couple watchlist"
            >
              <Users className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Match badge */}
        {isMatch && (
          <div className="absolute left-2 top-2">
            <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 gap-1 text-[10px]">
              <Heart className="h-3 w-3 fill-current" />
              Match
            </Badge>
          </div>
        )}

        {/* Rating */}
        {movieRating && movieRating !== "N/A" && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {movieRating}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {movieTitle}
        </h3>
        <p className="text-xs text-muted-foreground">
          {movieYear}
          {movieRuntime && movieRuntime !== "N/A" && ` · ${movieRuntime}`}
        </p>

        {/* Genre tags */}
        {formatGenres(movieGenre).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {formatGenres(movieGenre).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Couple status indicators */}
        {variant === "couple" && coupleStatus && (
          <div className="flex items-center gap-2 pt-1">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                coupleStatus.user_you_added
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {coupleStatus.user_you_added ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Plus className="h-2.5 w-2.5" />
              )}
              You
            </div>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                coupleStatus.partner_added
                  ? "bg-accent/20 text-accent"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {coupleStatus.partner_added ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Plus className="h-2.5 w-2.5" />
              )}
              Partner
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
