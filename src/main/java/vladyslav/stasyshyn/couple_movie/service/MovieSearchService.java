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
            settings.setSortableAttributes(new String[] { "imdbRating" });
            index.updateSettings(settings);
        } catch (Exception e) {
            log.warn("Could not setup Meilisearch index configuration during startup. It might not be ready yet.", e);
        }
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void syncDatabaseToMeilisearch() {
        log.info(
                "Application ready. Syncing all PostgreSQL movies to Meilisearch to ensure index integrity and sorting compatibility...");
        try {
            List<Movie> allMovies = movieRepository.findAll();
            if (allMovies.isEmpty()) {
                log.info("No movies found in MySQL to sync.");
                return;
            }

            List<MovieDocument> documents = allMovies.stream().map(m -> MovieDocument.builder()
                    .imdbID(m.getImdbId())
                    .title(m.getTitle())
                    .year(m.getYear())
                    .genre(m.getGenre())
                    .imdbRating(m.getImdbRating() != null ? m.getImdbRating() : 0.0)
                    .build()).collect(Collectors.toList());

            // Add documents in batches of 1000 if necessary, but for ~几hundred it's fine
            String jsonDocs = objectMapper.writeValueAsString(documents);
            meilisearchClient.index(INDEX_NAME).addDocuments(jsonDocs, "imdbID");

            log.info("Successfully pushed {} historical movies from MySQL to Meilisearch index.", allMovies.size());
        } catch (Exception e) {
            log.error("Failed to sync historical MySQL movies to Meilisearch on startup.", e);
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
                    .runtime(omdbMovie.getRuntime())
                    .rated(omdbMovie.getRated())
                    .actors(omdbMovie.getActors())
                    .language(omdbMovie.getLanguage())
                    .country(omdbMovie.getCountry())
                    .awards(omdbMovie.getAwards())
                    .metascore(omdbMovie.getMetascore())
                    .imdbVotes(omdbMovie.getImdbVotes())
                    .imdbRating(rating)
                    .build();
            movieRepository.save(movie);

            // Save to Meilisearch for fuzzy search
            MovieDocument document = MovieDocument.builder()
                    .imdbID(omdbMovie.getImdbID())
                    .title(omdbMovie.getTitle())
                    .year(omdbMovie.getYear())
                    .genre(omdbMovie.getGenre())
                    .imdbRating(rating)
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
                    .limit(1000)
                    .sort(new String[] { "imdbRating:desc" })
                    .build();
            com.meilisearch.sdk.model.SearchResult searchResult = (com.meilisearch.sdk.model.SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty())
                return List.of();

            List<Movie> unsortedMovies = movieRepository.findAllById(ids);
            Map<String, Movie> movieMap = unsortedMovies.stream()
                    .collect(Collectors.toMap(Movie::getImdbId, m -> m));
            List<Movie> sortedMovies = new ArrayList<>();
            for (String id : ids) {
                if (movieMap.containsKey(id)) {
                    sortedMovies.add(movieMap.get(id));
                }
            }
            return sortedMovies;
        } catch (Exception e) {
            log.error("Error searching movies in Meilisearch", e);
            return List.of();
        }
    }

    public List<Movie> autocomplete(String query, int limit) {
        try {
            SearchRequest request = SearchRequest.builder()
                    .q(query)
                    .attributesToSearchOn(new String[] { "title" })
                    .limit(limit)
                    .sort(new String[] { "imdbRating:desc" })
                    .build();
            com.meilisearch.sdk.model.SearchResult searchResult = (com.meilisearch.sdk.model.SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty())
                return List.of();

            List<Movie> unsortedMovies = movieRepository.findAllById(ids);
            Map<String, Movie> movieMap = unsortedMovies.stream()
                    .collect(Collectors.toMap(Movie::getImdbId, m -> m));
            List<Movie> sortedMovies = new ArrayList<>();
            for (String id : ids) {
                if (movieMap.containsKey(id)) {
                    sortedMovies.add(movieMap.get(id));
                }
            }
            return sortedMovies;
        } catch (Exception e) {
            log.error("Error autocompleting movies in Meilisearch", e);
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
            if (genres == null || genres.isEmpty())
                return List.of();

            Set<String> allIds = new HashSet<>();
            for (String genre : genres) {
                SearchRequest request = SearchRequest.builder()
                        .q(genre.trim())
                        .attributesToSearchOn(new String[] { "genre" })
                        .limit(1000)
                        .sort(new String[] { "imdbRating:desc" })
                        .build();

                com.meilisearch.sdk.model.SearchResult searchResult = (com.meilisearch.sdk.model.SearchResult) meilisearchClient
                        .index(INDEX_NAME).search(request);
                List<String> ids = extractIdsFromHits(searchResult.getHits());
                allIds.addAll(ids);
            }

            if (allIds.isEmpty())
                return List.of();

            return movieRepository.findAllById(allIds);
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
                .sorted(java.util.Comparator.comparing(Movie::getImdbRating,
                        java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public List<Movie> filterMovies(List<String> explicitGenres, List<List<String>> mappedEmotions,
            boolean isNostalgic) {
        List<Movie> explicitGenreResults = null;
        if (explicitGenres != null && !explicitGenres.isEmpty()) {
            explicitGenreResults = searchByGenres(explicitGenres);
        }

        List<Movie> emotionResults = null;
        if (mappedEmotions != null && !mappedEmotions.isEmpty()) {
            for (List<String> emotionGroup : mappedEmotions) {
                List<Movie> groupResults = searchByGenres(emotionGroup);
                if (emotionResults == null) {
                    emotionResults = new ArrayList<>(groupResults);
                } else {
                    Set<String> groupIds = groupResults.stream().map(Movie::getImdbId).collect(Collectors.toSet());
                    emotionResults.removeIf(m -> !groupIds.contains(m.getImdbId()));
                }
            }
        }

        List<Movie> nostalgicResults = null;
        if (isNostalgic) {
            nostalgicResults = searchNostalgic();
        }

        List<Movie> result = null;

        if (explicitGenreResults != null) {
            result = new ArrayList<>(explicitGenreResults);
        }

        if (emotionResults != null) {
            if (result == null) {
                result = new ArrayList<>(emotionResults);
            } else {
                Set<String> emotionIds = emotionResults.stream().map(Movie::getImdbId).collect(Collectors.toSet());
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

        if (result == null) {
            return new ArrayList<>();
        }

        result.sort(java.util.Comparator.comparing(Movie::getImdbRating,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));

        return result;
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
