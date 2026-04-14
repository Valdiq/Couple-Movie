package vladyslav.stasyshyn.couple_movie.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Index;
import com.meilisearch.sdk.SearchRequest;
import com.meilisearch.sdk.model.MatchingStrategy;
import com.meilisearch.sdk.model.SearchResult;
import com.meilisearch.sdk.model.Settings;
import com.meilisearch.sdk.model.Pagination;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;
import vladyslav.stasyshyn.couple_movie.dto.SearchPageResponse;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieSummary;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@Slf4j
public class MovieSearchService {

    private final MovieRepository movieRepository;
    private final Client meilisearchClient;
    private final ObjectMapper objectMapper;
    private final Optional<AiVectorizationService> aiVectorizationService;
    private final String INDEX_NAME = "movies";

    public MovieSearchService(MovieRepository movieRepository, 
                            Client meilisearchClient, 
                            ObjectMapper objectMapper,
                            Optional<AiVectorizationService> aiVectorizationService) {
        this.movieRepository = movieRepository;
        this.meilisearchClient = meilisearchClient;
        this.objectMapper = objectMapper;
        this.aiVectorizationService = aiVectorizationService;
        setupMeilisearch();
    }

    private void setupMeilisearch() {
        Index index = meilisearchClient.index(INDEX_NAME);
        Settings settings = new Settings();
        settings.setFilterableAttributes(new String[]{"genre", "hasWinAward", "yearInt", "imdbVotesInt", "imdbRating"});
        settings.setSearchableAttributes(new String[]{"title", "genre"});
        settings.setSortableAttributes(new String[]{"imdbVotesInt"});

        settings.setStopWords(new String[]{
                "a", "an", "the", "and", "or", "but", "in", "on", "at",
                "to", "for", "of", "with", "by", "from", "up", "about",
                "into", "over", "after", "is", "are", "was", "were"
        });

        Pagination pagination = new Pagination();
        pagination.setMaxTotalHits(10000);
        settings.setPagination(pagination);

        index.updateSettings(settings);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncDatabaseToMeilisearch() {
        try {
            Index index = meilisearchClient.index(INDEX_NAME);
            index.deleteAllDocuments();

            int batchSize = 1000;
            int pageNumber = 0;
            Page<Movie> page;

            do {
                page = movieRepository.findAll(
                        PageRequest.of(pageNumber, batchSize));

                if (page.isEmpty()) break;

                List<MovieDocument> documents = page.getContent().stream().map(m -> {
                    List<String> genreList = new ArrayList<>();
                    if (m.getGenre() != null && !m.getGenre().isEmpty() && !m.getGenre().equals("N/A")) {
                        genreList = Arrays.stream(m.getGenre().split(","))
                                .map(String::trim)
                                .collect(Collectors.toList());
                    }
                    boolean hasWin = false;
                    if (m.getAwards() != null && !m.getAwards().equals("N/A")) {
                        hasWin = m.getAwards().matches("(?i).*\\b(win|wins|won)\\b.*");
                    }
                    return MovieDocument.builder()
                            .imdbID(m.getImdbId())
                            .title(m.getTitle())
                            .year(m.getYear())
                            .genre(genreList)
                            .imdbRating(m.getImdbRating() != null ? m.getImdbRating() : 0.0)
                            .awards(m.getAwards() != null ? m.getAwards() : "")
                            .hasWinAward(hasWin)
                            .yearInt(parseYear(m.getYear()))
                            .imdbVotesInt(parseVotes(m.getImdbVotes()))
                            .build();
                }).collect(Collectors.toList());

                String jsonDocs = objectMapper.writeValueAsString(documents);
                index.addDocuments(jsonDocs, "imdbID");
                pageNumber++;
            } while (page.hasNext());

        } catch (Exception e) {
            log.error("Failed to sync historical PostgreSQL movies to Meilisearch on startup.", e);
        }
    }

    public void saveMovie(OmdbMovieDetails omdbMovie) {
        Long votes = parseVotes(omdbMovie.imdbVotes());
        if (votes < 1000) {
            return;
        }

        double rating = 0.0;
        if (omdbMovie.imdbRating() != null && !omdbMovie.imdbRating().equals("N/A")) {
            rating = Double.parseDouble(omdbMovie.imdbRating());
        }

        Movie movie = Movie.builder()
                .imdbId(omdbMovie.imdbID())
                .title(omdbMovie.title())
                .year(omdbMovie.year())
                .type(omdbMovie.type())
                .poster(omdbMovie.poster())
                .genre(omdbMovie.genre())
                .director(omdbMovie.director())
                .writer(omdbMovie.writer())
                .plot(omdbMovie.plot())
                .runtime(omdbMovie.runtime())
                .actors(omdbMovie.actors())
                .language(omdbMovie.language())
                .country(omdbMovie.country())
                .awards(omdbMovie.awards())
                .imdbVotes(omdbMovie.imdbVotes())
                .imdbRating(rating)
                .build();
        movieRepository.save(Objects.requireNonNull(movie));
        aiVectorizationService.ifPresent(service -> service.vectorizeMovie(movie));

        List<String> genreList = new ArrayList<>();
        if (omdbMovie.genre() != null && !omdbMovie.genre().isEmpty() && !omdbMovie.genre().equals("N/A")) {
            genreList = Arrays.stream(omdbMovie.genre().split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
        }

        boolean hasWin = false;
        if (omdbMovie.awards() != null && !omdbMovie.awards().equals("N/A")) {
            hasWin = omdbMovie.awards().matches("(?i).*\\b(win|wins|won)\\b.*");
        }
        MovieDocument document = MovieDocument.builder()
                .imdbID(omdbMovie.imdbID())
                .title(omdbMovie.title())
                .year(omdbMovie.year())
                .genre(genreList)
                .imdbRating(rating)
                .awards(omdbMovie.awards() != null ? omdbMovie.awards() : "")
                .hasWinAward(hasWin)
                .yearInt(parseYear(omdbMovie.year()))
                .imdbVotesInt(parseVotes(omdbMovie.imdbVotes()))
                .build();

        try {
            String jsonDoc = objectMapper.writeValueAsString(Collections.singletonList(document));
            meilisearchClient.index(INDEX_NAME).addDocuments(jsonDoc, "imdbID");
        } catch (Exception e) {
            log.error("Failed to index and save movie: {}", omdbMovie.title(), e);
        }
    }

    public void saveTrendingMovie(OmdbMovieDetails omdbMovie) {
        double rating = 0.0;
        if (omdbMovie.imdbRating() != null && !omdbMovie.imdbRating().equals("N/A")) {
            rating = Double.parseDouble(omdbMovie.imdbRating());
        }

        Movie movie = Movie.builder()
                .imdbId(omdbMovie.imdbID())
                .title(omdbMovie.title())
                .year(omdbMovie.year())
                .type(omdbMovie.type())
                .poster(omdbMovie.poster())
                .genre(omdbMovie.genre())
                .director(omdbMovie.director())
                .writer(omdbMovie.writer())
                .plot(omdbMovie.plot())
                .runtime(omdbMovie.runtime())
                .actors(omdbMovie.actors())
                .language(omdbMovie.language())
                .country(omdbMovie.country())
                .awards(omdbMovie.awards())
                .imdbVotes(omdbMovie.imdbVotes())
                .imdbRating(rating)
                .build();
        movieRepository.save(Objects.requireNonNull(movie));
        aiVectorizationService.ifPresent(service -> service.vectorizeMovie(movie));

        List<String> genreList = new ArrayList<>();
        if (omdbMovie.genre() != null && !omdbMovie.genre().isEmpty() && !omdbMovie.genre().equals("N/A")) {
            genreList = Arrays.stream(omdbMovie.genre().split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
        }

        boolean hasWin = false;
        if (omdbMovie.awards() != null && !omdbMovie.awards().equals("N/A")) {
            hasWin = omdbMovie.awards().matches("(?i).*\\b(win|wins|won)\\b.*");
        }
        MovieDocument document = MovieDocument.builder()
                .imdbID(omdbMovie.imdbID())
                .title(omdbMovie.title())
                .year(omdbMovie.year())
                .genre(genreList)
                .imdbRating(rating)
                .awards(omdbMovie.awards() != null ? omdbMovie.awards() : "")
                .hasWinAward(hasWin)
                .yearInt(parseYear(omdbMovie.year()))
                .imdbVotesInt(parseVotes(omdbMovie.imdbVotes()))
                .build();

        try {
            String jsonDoc = objectMapper.writeValueAsString(Collections.singletonList(document));
            meilisearchClient.index(INDEX_NAME).addDocuments(jsonDoc, "imdbID");
        } catch (Exception e) {
            log.error("Failed to index trending movie: {}", omdbMovie.title(), e);
        }
    }

    public void saveMovieSummaries(List<OmdbMovieSummary> summaries) {
        if (summaries == null || summaries.isEmpty())
            return;

        List<String> imdbIds = summaries.stream().map(OmdbMovieSummary::imdbID).collect(Collectors.toList());
        List<String> existingIds = movieRepository.findAllById(imdbIds).stream()
                .map(Movie::getImdbId).collect(Collectors.toList());

        List<Movie> newMovies = new ArrayList<>();
        List<MovieDocument> newDocs = new ArrayList<>();

        for (OmdbMovieSummary summary : summaries) {
            if (existingIds.contains(summary.imdbID())) {
                continue;
            }

            Movie movie = Movie.builder()
                    .imdbId(summary.imdbID())
                    .title(summary.title())
                    .year(summary.year())
                    .type(summary.type())
                    .poster(summary.poster())
                    .genre(summary.genre())
                    .awards(summary.awards())
                    .imdbRating(summary.imdbRating() != null ? summary.imdbRating() : 0.0)
                    .build();
            newMovies.add(movie);

            boolean hasWin = false;
            if (summary.awards() != null && !summary.awards().equals("N/A")) {
                hasWin = summary.awards().matches("(?i).*\\b(win|wins|won)\\b.*");
            }

            List<String> genreList = new ArrayList<>();
            if (summary.genre() != null && !summary.genre().isEmpty() && !summary.genre().equals("N/A")) {
                genreList = Arrays.stream(summary.genre().split(","))
                        .map(String::trim)
                        .collect(Collectors.toList());
            }

            MovieDocument document = MovieDocument.builder()
                    .imdbID(summary.imdbID())
                    .title(summary.title())
                    .year(summary.year())
                    .genre(genreList)
                    .awards(summary.awards())
                    .imdbRating(summary.imdbRating() != null ? summary.imdbRating() : 0.0)
                    .hasWinAward(hasWin)
                    .build();
            newDocs.add(document);
        }

        if (!newMovies.isEmpty()) {
            movieRepository.saveAll(newMovies);
            try {
                String jsonDocs = objectMapper.writeValueAsString(newDocs);
                meilisearchClient.index(INDEX_NAME).addDocuments(jsonDocs, "imdbID");
            } catch (Exception e) {
                log.error("Failed to batch index summaries to Meilisearch", e);
            }
        }
    }

    public SearchPageResponse searchMovies(String query, int page, int size) {
        try {
            SearchRequest request = SearchRequest.builder()
                    .q(query)
                    .attributesToSearchOn(new String[]{"title"})
                    .offset(page * size)
                    .limit(size)
                    .sort(new String[]{"imdbVotesInt:desc"})
                    .matchingStrategy(MatchingStrategy.ALL)
                    .build();
            SearchResult searchResult = (SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty()) {
                return new SearchPageResponse(List.of(), searchResult.getEstimatedTotalHits(), page, size);
            }

            List<Movie> unsortedMovies = movieRepository.findAllById(ids);
            Map<String, Movie> movieMap = unsortedMovies.stream()
                    .collect(Collectors.toMap(Movie::getImdbId, m -> m));
            List<Movie> sortedMovies = new ArrayList<>();
            for (String id : ids) {
                if (movieMap.containsKey(id)) {
                    sortedMovies.add(movieMap.get(id));
                }
            }
            return new SearchPageResponse(sortedMovies, searchResult.getEstimatedTotalHits(), page, size);
        } catch (Exception e) {
            log.error("Error searching movies in Meilisearch", e);
            return new SearchPageResponse(List.of(), 0, page, size);
        }
    }

    public List<Movie> autocomplete(String query, int limit) {
        try {
            SearchRequest request = SearchRequest.builder()
                    .q(query)
                    .attributesToSearchOn(new String[]{"title"})
                    .limit(limit)
                    .sort(new String[]{"imdbVotesInt:desc"})
                    .matchingStrategy(MatchingStrategy.ALL)
                    .build();
            SearchResult searchResult = (SearchResult) meilisearchClient
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


    public Movie getRandomMovie() {
        return movieRepository.findRandomMovie().orElse(null);
    }

    public SearchPageResponse searchByGenres(List<String> genres, int page, int size) {
        if (genres == null || genres.isEmpty()) {
            return new SearchPageResponse(List.of(), 0, page, size);
        }
        try {
            String filterQuery = genres.stream()
                    .map(g -> "genre = \"" + g.trim() + "\"")
                    .collect(Collectors.joining(" OR "));

            SearchRequest request = SearchRequest.builder()
                    .q("")
                    .filter(new String[]{filterQuery})
                    .offset(page * size)
                    .limit(size)
                    .sort(new String[]{"imdbVotesInt:desc"})
                    .build();

            SearchResult searchResult = (SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty()) {
                return new SearchPageResponse(List.of(), searchResult.getEstimatedTotalHits(), page, size);
            }

            List<Movie> unsortedMovies = movieRepository.findAllById(ids);
            Map<String, Movie> movieMap = unsortedMovies.stream()
                    .collect(Collectors.toMap(Movie::getImdbId, m -> m));
            List<Movie> sortedMovies = new ArrayList<>();
            for (String id : ids) {
                if (movieMap.containsKey(id)) {
                    sortedMovies.add(movieMap.get(id));
                }
            }
            return new SearchPageResponse(sortedMovies, searchResult.getEstimatedTotalHits(), page, size);
        } catch (Exception e) {
            log.error("Error searching movies by genres in Meilisearch", e);
            return new SearchPageResponse(List.of(), 0, page, size);
        }
    }

    public List<Movie> searchByGenres(List<String> genres) {
        return searchByGenres(genres, 0, 1000).movies();
    }

    public List<Movie> searchNostalgic() {
        int year = Year.now().getValue() - 10;
        List<Movie> allMovies = movieRepository.findAll();
        return allMovies.stream()
                .filter(m -> m.getImdbRating() != null && m.getImdbRating() > 8.5)
                .filter(m -> {
                    try {
                        String movieYear = m.getYear();
                        if (movieYear != null && !movieYear.equals("N/A")) {
                            int yr = Integer.parseInt(movieYear.substring(0, 4));
                            return yr <= year;
                        }
                    } catch (Exception e) {
                        log.debug("Could not parse year for movie: {}", m.getImdbId(), e);
                    }
                    return false;
                })
                .sorted(Comparator.comparing(m -> parseVotes(m.getImdbVotes()), Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public SearchPageResponse filterMoviesAndEmotions(List<String> genres, List<String> emotions,
                                                      EmotionGenreService emotionGenreService, int page, int size, boolean awarded) {

        boolean hasGenres = genres != null && !genres.isEmpty();
        boolean hasEmotions = emotions != null && !emotions.isEmpty();

        if (!hasGenres && !hasEmotions && !awarded) {
            return new SearchPageResponse(List.of(), 0, page, size);
        }

        List<String> filterConditions = new ArrayList<>();

        if (hasGenres) {
            String genreQuery = genres.stream()
                    .map(g -> "genre = \"" + g.trim() + "\"")
                    .collect(Collectors.joining(" OR "));
            filterConditions.add("(" + genreQuery + ")");
        }

        if (hasEmotions) {
            boolean isNostalgic = false;
            for (String emotion : emotions) {
                if (emotion.equalsIgnoreCase("nostalgic")) {
                    isNostalgic = true;
                    continue;
                }
                Set<String> emotionGenres = new HashSet<>(emotionGenreService.getGenresForEmotion(emotion.trim()));
                if (!emotionGenres.isEmpty()) {
                    String emotionQuery = emotionGenres.stream()
                            .map(g -> "genre = \"" + g.trim() + "\"")
                            .collect(Collectors.joining(" OR "));
                    filterConditions.add("(" + emotionQuery + ")");
                }
            }
            if (isNostalgic) {
                int nostalgicYear = Year.now().getValue() - 10;
                filterConditions.add("(yearInt <= " + nostalgicYear + " AND imdbRating > 8.5 AND imdbVotesInt > 50000)");
            }
        }

        if (awarded) {
            filterConditions.add("hasWinAward = true");
        }

        String finalFilterQuery = String.join(" AND ", filterConditions);

        try {
            SearchRequest request = SearchRequest.builder()
                    .q("")
                    .filter(new String[]{finalFilterQuery})
                    .offset(page * size)
                    .limit(size)
                    .sort(new String[]{"imdbVotesInt:desc"})
                    .build();

            SearchResult searchResult = (SearchResult) meilisearchClient
                    .index(INDEX_NAME).search(request);
            List<String> ids = extractIdsFromHits(searchResult.getHits());

            if (ids.isEmpty()) {
                return new SearchPageResponse(List.of(), searchResult.getEstimatedTotalHits(), page, size);
            }

            List<Movie> unsortedMovies = movieRepository.findAllById(ids);
            Map<String, Movie> movieMap = unsortedMovies.stream()
                    .collect(Collectors.toMap(Movie::getImdbId, m -> m));
            List<Movie> sortedMovies = new ArrayList<>();
            for (String id : ids) {
                if (movieMap.containsKey(id)) {
                    sortedMovies.add(movieMap.get(id));
                }
            }
            return new SearchPageResponse(sortedMovies, searchResult.getEstimatedTotalHits(), page, size);
        } catch (Exception e) {
            log.error("Error filtering movies in Meilisearch", e);
            return new SearchPageResponse(List.of(), 0, page, size);
        }
    }

    public Object getMovieDetails(String imdbId, OmdbService omdbService) {
        var requestedMovie = movieRepository.findById(imdbId);
        if (requestedMovie.isPresent()) {
            var movie = requestedMovie.get();
            if (movie.getDirector() != null && movie.getPlot() != null && movie.getGenre() != null
                    && movie.getWriter() != null) {
                return movie;
            }
        }
        return omdbService.getMovieDetails(imdbId);
    }

    public Map<String, Double> getBatchRatings(Map<String, List<String>> body) {
        List<String> ids = body.getOrDefault("ids", List.of());
        if (ids.isEmpty()) {
            return Map.of();
        }

        List<Movie> movies = movieRepository.findAllById(ids);
        Map<String, Double> ratings = new LinkedHashMap<>();
        for (Movie movie : movies) {
            ratings.put(movie.getImdbId(), movie.getImdbRating());
        }
        return ratings;
    }

    private Integer parseYear(String yearStr) {
        if (yearStr == null || yearStr.equalsIgnoreCase("N/A") || yearStr.isEmpty()) return 0;
        try {
            return Integer.parseInt(yearStr.substring(0, 4));
        } catch (Exception e) {
            return 0;
        }
    }

    private Long parseVotes(String votesStr) {
        if (votesStr == null || votesStr.equalsIgnoreCase("N/A") || votesStr.isEmpty()) return 0L;
        try {
            return Long.parseLong(votesStr.replace(",", ""));
        } catch (NumberFormatException e) {
            return 0L;
        }
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
