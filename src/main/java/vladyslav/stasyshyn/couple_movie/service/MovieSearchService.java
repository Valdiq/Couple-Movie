package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.repository.MovieSearchRepository;

import java.time.Year;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovieSearchService {

    private final MovieSearchRepository movieSearchRepository;

    public void saveMovie(OmdbMovieDetails omdbMovie) {
        try {
            double rating = 0.0;
            if (omdbMovie.getImdbRating() != null && !omdbMovie.getImdbRating().equals("N/A")) {
                rating = Double.parseDouble(omdbMovie.getImdbRating());
            }

            MovieDocument document = MovieDocument.builder()
                    .imdbID(omdbMovie.getImdbID())
                    .title(omdbMovie.getTitle())
                    .year(omdbMovie.getYear())
                    .type(omdbMovie.getType())
                    .poster(omdbMovie.getPoster())
                    .genre(omdbMovie.getGenre())
                    .director(omdbMovie.getDirector())
                    .plot(omdbMovie.getPlot())
                    .imdbRating(rating)
                    .build();

            movieSearchRepository.save(document);
            log.info("Indexed movie: {}", omdbMovie.getTitle());
        } catch (Exception e) {
            log.error("Failed to index movie: {}", omdbMovie.getTitle(), e);
        }
    }

    public List<MovieDocument> searchMovies(String query) {
        return movieSearchRepository.findByTitleContaining(query);
    }

    public Optional<MovieDocument> getMovieById(String imdbId) {
        return movieSearchRepository.findById(imdbId);
    }

    /**
     * Search for movies that match any of the provided genres.
     * Uses a single regex query for efficiency when possible.
     */
    public List<MovieDocument> searchByGenres(List<String> genres) {
        // Try a single regex query: "Action|Comedy|Drama"
        try {
            String regex = genres.stream()
                    .map(String::trim)
                    .collect(java.util.stream.Collectors.joining("|"));
            List<MovieDocument> results = movieSearchRepository.findByGenreMatches(regex);
            if (!results.isEmpty()) {
                // Deduplicate by imdbID
                Set<String> seenIds = new LinkedHashSet<>();
                List<MovieDocument> deduped = new ArrayList<>();
                for (MovieDocument movie : results) {
                    if (seenIds.add(movie.getImdbID())) {
                        deduped.add(movie);
                    }
                }
                return deduped;
            }
        } catch (Exception e) {
            log.warn("Regex genre search failed, falling back to loop: {}", e.getMessage());
        }

        // Fallback: loop approach
        Set<String> seenIds = new HashSet<>();
        List<MovieDocument> results = new ArrayList<>();

        for (String genre : genres) {
            List<MovieDocument> movies = movieSearchRepository.findByGenreContaining(genre.trim());
            for (MovieDocument movie : movies) {
                if (seenIds.add(movie.getImdbID())) {
                    results.add(movie);
                }
            }
        }

        return results;
    }

    /**
     * Search for "nostalgic" movies: rating > 9.0 and at least 10 years old.
     * Year comparison is year-only (e.g., current year 2026 → return films with
     * year ≤ 2016).
     */
    public List<MovieDocument> searchNostalgic() {
        int cutoffYear = Year.now().getValue() - 10;
        return movieSearchRepository.findByImdbRatingGreaterThanAndYearLessThanEqual(
                9.0, String.valueOf(cutoffYear));
    }

    /**
     * Filter movies combining multiple criteria.
     * 
     * @param explicitGenres Genres selected explicitly (OR logic among them).
     * @param emotionGenres  Intersected genres from selected emotions (OR logic
     *                       among them).
     * @param isNostalgic    Whether nostalgic criteria is required.
     */
    public List<MovieDocument> filterMovies(List<String> explicitGenres, List<String> emotionGenres,
            boolean isNostalgic) {
        // We will fetch lists and then intersect them in memory for simplicity,
        // as the data set is small and complex AND/OR queries are hard to express with
        // method names.

        List<MovieDocument> explicitGenreResults = null;
        if (explicitGenres != null && !explicitGenres.isEmpty()) {
            explicitGenreResults = searchByGenres(explicitGenres);
        }

        List<MovieDocument> emotionGenreResults = null;
        if (emotionGenres != null && !emotionGenres.isEmpty()) {
            emotionGenreResults = searchByGenres(emotionGenres);
        }

        List<MovieDocument> nostalgicResults = null;
        if (isNostalgic) {
            nostalgicResults = searchNostalgic();
        }

        // Now we intersect the non-null result sets
        List<MovieDocument> result = null;

        if (explicitGenreResults != null) {
            result = new ArrayList<>(explicitGenreResults);
        }

        if (emotionGenreResults != null) {
            if (result == null) {
                result = new ArrayList<>(emotionGenreResults);
            } else {
                // Intersect based on imdbID
                Set<String> emotionIds = emotionGenreResults.stream()
                        .map(MovieDocument::getImdbID)
                        .collect(java.util.stream.Collectors.toSet());
                result.removeIf(m -> !emotionIds.contains(m.getImdbID()));
            }
        }

        if (nostalgicResults != null) {
            if (result == null) {
                result = new ArrayList<>(nostalgicResults);
            } else {
                // Intersect based on imdbID
                Set<String> nostalgicIds = nostalgicResults.stream()
                        .map(MovieDocument::getImdbID)
                        .collect(java.util.stream.Collectors.toSet());
                result.removeIf(m -> !nostalgicIds.contains(m.getImdbID()));
            }
        }

        return result != null ? result : new ArrayList<>();
    }
}
