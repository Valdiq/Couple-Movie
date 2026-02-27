package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.model.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;
import vladyslav.stasyshyn.couple_movie.repository.MovieSearchRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovieSearchService {

    private final MovieSearchRepository movieSearchRepository;
    private final MovieRepository movieRepository;

    public void saveMovie(OmdbMovieDetails omdbMovie) {
        try {
            double rating = 0.0;
            if (omdbMovie.getImdbRating() != null && !omdbMovie.getImdbRating().equals("N/A")) {
                rating = Double.parseDouble(omdbMovie.getImdbRating());
            }

            // Save to MySQL
            Movie movie = Movie.builder()
                    .imdbId(omdbMovie.getImdbID())
                    .title(omdbMovie.getTitle())
                    .year(omdbMovie.getYear())
                    .type(omdbMovie.getType())
                    .poster(omdbMovie.getPoster())
                    .genre(omdbMovie.getGenre())
                    .director(omdbMovie.getDirector())
                    .plot(omdbMovie.getPlot())
                    .imdbRating(rating)
                    .build();
            movieRepository.save(movie);

            // Save to Elasticsearch for fuzzy search
            MovieDocument document = MovieDocument.builder()
                    .imdbID(omdbMovie.getImdbID())
                    .title(omdbMovie.getTitle())
                    .year(omdbMovie.getYear())
                    .genre(omdbMovie.getGenre())
                    .build();
            movieSearchRepository.save(document);
            log.info("Indexed and saved movie: {}", omdbMovie.getTitle());
        } catch (Exception e) {
            log.error("Failed to index and save movie: {}", omdbMovie.getTitle(), e);
        }
    }

    public void saveMovieSummaries(List<OmdbMovieSummary> summaries) {
        if (summaries == null || summaries.isEmpty())
            return;

        List<String> imdbIds = summaries.stream().map(OmdbMovieSummary::getImdbID).collect(Collectors.toList());
        List<String> existingIds = movieRepository.findAllById(imdbIds).stream()
                .map(Movie::getImdbId).collect(Collectors.toList());

        List<Movie> newMovies = new ArrayList<>();
        List<MovieDocument> newDocs = new ArrayList<>();

        for (OmdbMovieSummary summary : summaries) {
            if (existingIds.contains(summary.getImdbID())) {
                continue;
            }

            Movie movie = Movie.builder()
                    .imdbId(summary.getImdbID())
                    .title(summary.getTitle())
                    .year(summary.getYear())
                    .type(summary.getType())
                    .poster(summary.getPoster())
                    .build();
            newMovies.add(movie);

            MovieDocument document = MovieDocument.builder()
                    .imdbID(summary.getImdbID())
                    .title(summary.getTitle())
                    .year(summary.getYear())
                    .build();
            newDocs.add(document);
        }

        if (!newMovies.isEmpty()) {
            movieRepository.saveAll(newMovies);
            movieSearchRepository.saveAll(newDocs);
            log.info("Batch indexed and saved {} new movie summaries", newMovies.size());
        }
    }

    public List<Movie> searchMovies(String query) {
        List<MovieDocument> esResults = movieSearchRepository.searchByTitleFuzzy(query);
        List<String> ids = esResults.stream().map(MovieDocument::getImdbID).collect(Collectors.toList());
        if (ids.isEmpty())
            return List.of();
        return movieRepository.findAllById(ids);
    }

    public Optional<Movie> getMovieById(String imdbId) {
        return movieRepository.findById(imdbId);
    }

    public Movie getRandomMovie() {
        return movieRepository.findRandomMovie().orElse(null);
    }

    public List<Movie> searchByGenres(List<String> genres) {
        // Find IDs from ES based on genre
        Set<String> ids = new HashSet<>();
        try {
            String regex = genres.stream().map(String::trim).collect(Collectors.joining("|"));
            List<MovieDocument> results = movieSearchRepository.findByGenreMatches(regex);
            ids.addAll(results.stream().map(MovieDocument::getImdbID).collect(Collectors.toList()));
        } catch (Exception e) {
            for (String genre : genres) {
                ids.addAll(movieSearchRepository.findByGenreContaining(genre.trim())
                        .stream().map(MovieDocument::getImdbID).collect(Collectors.toList()));
            }
        }
        if (ids.isEmpty())
            return List.of();
        return movieRepository.findAllById(ids);
    }

    public List<Movie> searchNostalgic() {
        // For nostalgic we search directly in MySQL, because rating and year aren't
        // parsed in ES anymore (rating removed)
        // Let's retrieve all movies from MySQL and filter in memory, or we could add a
        // DB query.
        // It's easier to add a DB query for nostalgic but since we don't have it yet,
        // we stream all.
        // Or actually, let's just use MySQL. Wait, rating > 9.0 and year <= cutoff.
        int cutoffYear = java.time.Year.now().getValue() - 10;
        List<Movie> allMovies = movieRepository.findAll();
        return allMovies.stream()
                .filter(m -> m.getImdbRating() != null && m.getImdbRating() > 9.0)
                .filter(m -> {
                    try {
                        String yrStr = m.getYear();
                        if (yrStr != null && yrStr.length() >= 4) {
                            int yr = Integer.parseInt(yrStr.substring(0, 4));
                            return yr <= cutoffYear;
                        }
                    } catch (Exception ignore) {
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    public List<Movie> filterMovies(List<String> explicitGenres, List<String> emotionGenres, boolean isNostalgic) {
        List<Movie> explicitGenreResults = null;
        if (explicitGenres != null && !explicitGenres.isEmpty()) {
            explicitGenreResults = searchByGenres(explicitGenres);
        }

        List<Movie> emotionGenreResults = null;
        if (emotionGenres != null && !emotionGenres.isEmpty()) {
            emotionGenreResults = searchByGenres(emotionGenres);
        }

        List<Movie> nostalgicResults = null;
        if (isNostalgic) {
            nostalgicResults = searchNostalgic();
        }

        List<Movie> result = null;

        if (explicitGenreResults != null) {
            result = new ArrayList<>(explicitGenreResults);
        }

        if (emotionGenreResults != null) {
            if (result == null) {
                result = new ArrayList<>(emotionGenreResults);
            } else {
                Set<String> emotionIds = emotionGenreResults.stream().map(Movie::getImdbId).collect(Collectors.toSet());
                result.removeIf(m -> !emotionIds.contains(m.getImdbId()));
            }
        }

        if (nostalgicResults != null) {
            if (result == null) {
                result = new ArrayList<>(nostalgicResults);
            } else {
                Set<String> nostalgicIds = nostalgicResults.stream().map(Movie::getImdbId).collect(Collectors.toSet());
                result.removeIf(m -> !nostalgicIds.contains(m.getImdbId()));
            }
        }

        return result != null ? result : new ArrayList<>();
    }
}
