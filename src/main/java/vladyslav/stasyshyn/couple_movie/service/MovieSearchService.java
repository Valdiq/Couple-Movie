package vladyslav.stasyshyn.couple_movie.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Index;
import com.meilisearch.sdk.SearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieSummary;
import vladyslav.stasyshyn.couple_movie.model.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MovieSearchService {

    private final MovieRepository movieRepository;
    private final Client meilisearchClient;
    private final ObjectMapper objectMapper;
    private final String INDEX_NAME = "movies";

    public MovieSearchService(MovieRepository movieRepository, Client meilisearchClient, ObjectMapper objectMapper) {
        this.movieRepository = movieRepository;
        this.meilisearchClient = meilisearchClient;
        this.objectMapper = objectMapper;
        setupMeilisearch();
    }

    private void setupMeilisearch() {
        try {
            Index index = meilisearchClient.index(INDEX_NAME);
            com.meilisearch.sdk.model.Settings settings = new com.meilisearch.sdk.model.Settings();
            settings.setFilterableAttributes(new String[] { "genre" });
            settings.setSearchableAttributes(new String[] { "title", "genre" });
            index.updateSettings(settings);
        } catch (Exception e) {
            log.warn("Could not setup Meilisearch index configuration during startup. It might not be ready yet.", e);
        }
    }

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

            // Save to Meilisearch for fuzzy search
            MovieDocument document = MovieDocument.builder()
                    .imdbID(omdbMovie.getImdbID())
                    .title(omdbMovie.getTitle())
                    .year(omdbMovie.getYear())
                    .genre(omdbMovie.getGenre())
                    .build();

            String jsonDoc = objectMapper.writeValueAsString(Collections.singletonList(document));
            meilisearchClient.index(INDEX_NAME).addDocuments(jsonDoc, "imdbID");
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
            try {
                String jsonDocs = objectMapper.writeValueAsString(newDocs);
                meilisearchClient.index(INDEX_NAME).addDocuments(jsonDocs, "imdbID");
                log.info("Batch indexed and saved {} new movie summaries", newMovies.size());
            } catch (Exception e) {
                log.error("Failed to batch index summaries to Meilisearch", e);
            }
        }
    }

    public List<Movie> searchMovies(String query) {
        try {
            SearchRequest request = SearchRequest.builder()
                    .q(query)
                    .attributesToSearchOn(new String[] { "title" })
                    .limit(50)
                    .build();
            com.meilisearch.sdk.model.SearchResult searchResult = (com.meilisearch.sdk.model.SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty())
                return List.of();
            return movieRepository.findAllById(ids);
        } catch (Exception e) {
            log.error("Error searching movies in Meilisearch", e);
            return List.of();
        }
    }

    public Optional<Movie> getMovieById(String imdbId) {
        return movieRepository.findById(imdbId);
    }

    public Movie getRandomMovie() {
        return movieRepository.findRandomMovie().orElse(null);
    }

    public List<Movie> searchByGenres(List<String> genres) {
        try {
            // Meilisearch filter format: genre = 'Comedy' OR genre = 'Action'
            // Since string genres from API like 'Comedy, Romance' aren't perfectly
            // tokenized
            // arrays in Meilisearch yet without further config, we can also just use text
            // search across genre.
            String queryStr = genres.stream().map(String::trim).collect(Collectors.joining(" "));

            SearchRequest request = SearchRequest.builder()
                    .q(queryStr)
                    .attributesToSearchOn(new String[] { "genre" })
                    .limit(50)
                    .build();

            com.meilisearch.sdk.model.SearchResult searchResult = (com.meilisearch.sdk.model.SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty())
                return List.of();
            return movieRepository.findAllById(ids);
        } catch (Exception e) {
            log.error("Error searching movies by genres in Meilisearch", e);
            return List.of();
        }
    }

    public List<Movie> searchNostalgic() {
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

    private List<String> extractIdsFromHits(ArrayList<HashMap<String, Object>> hits) {
        if (hits == null)
            return List.of();
        List<String> ids = new ArrayList<>();
        for (HashMap<String, Object> hit : hits) {
            Object idObj = hit.get("imdbID");
            if (idObj != null) {
                ids.add(idObj.toString());
            }
        }
        return ids;
    }
}
