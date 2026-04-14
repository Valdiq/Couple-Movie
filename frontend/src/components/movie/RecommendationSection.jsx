import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Movie } from "@/entities/Movie";
import MovieCard from "./MovieCard";
import AppleEmoji from "@/components/ui/AppleEmoji";
import { Loader2 } from "lucide-react";

export default function RecommendationSection({ onMovieSelect }) {
    const [groups, setGroups] = useState([]);
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setIsLoading(true);
            try {
                const response = await Movie.getRecommendations();
                if (response.groups && response.groups.length > 0) {
                    setGroups(response.groups);
                } else if (response.message) {
                    setMessage(response.message);
                } else {
                    console.warn("API returned 200 OK but groups and message were both empty. Response:", response);
                }
            } catch (error) {
                console.error("Error fetching AI recommendations:", error);
            }
            setIsLoading(false);
        };

        fetchRecommendations();
    }, []);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground font-medium">Brewing AI recommendations...</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 lg:w-[80%] xl:w-[80%] mx-auto xl:gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card border border-border" />
                    ))}
                </div>
            </div>
        );
    }

    if (message && groups.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 hidden">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                    <AppleEmoji emoji="🌟" className="text-3xl mb-3 block mx-auto" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Personalized AI Recommendations</h3>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
        );
    }

    if (groups.length === 0) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <AppleEmoji emoji="✨" /> Recommended For You
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Based on your favorites and watch history
                </p>
            </motion.div>

            <div className="space-y-12">
                {groups.map((group, groupIndex) => (
                    <motion.div
                        key={groupIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4 pl-1 border-l-4 border-primary/50">
                            {group.reason}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 lg:w-[80%] xl:w-[80%] mx-auto xl:gap-6">
                            {group.movies.map((movie, movieIndex) => (
                                <motion.div
                                    key={movie.id || movie.imdb_id || movieIndex}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (groupIndex * 0.1) + (movieIndex * 0.05) }}
                                >
                                    <MovieCard movie={movie} onSelect={onMovieSelect} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
