package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.repository.MovieSearchRepository;

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
     * Deduplicates results by imdbID.
     */
    public List<MovieDocument> searchByGenres(List<String> genres) {
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
}
