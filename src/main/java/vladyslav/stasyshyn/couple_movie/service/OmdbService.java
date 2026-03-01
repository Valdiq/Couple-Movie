package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieSummary;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbSearchResponse;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OmdbService {

    private final RestClient restClient;
    private final String apiKey;
    private final MovieSearchService movieSearchService;

    public OmdbService(RestClient.Builder restClientBuilder,
            @Value("${app.omdb.api-key}") String apiKey,
            @Value("${app.omdb.url}") String omdbUrl,
            MovieSearchService movieSearchService) {
        this.apiKey = apiKey;
        this.restClient = restClientBuilder.baseUrl(omdbUrl).build();
        this.movieSearchService = movieSearchService;
    }

    public void fetchAndSaveFullDetailsAsync(List<OmdbMovieSummary> summaries) {
        if (summaries == null || summaries.isEmpty())
            return;
        CompletableFuture.runAsync(() -> {
            for (OmdbMovieSummary summary : summaries) {
                try {
                    // Skip if already in database (as getMovieById checks MySQL)
                    var cachedMovie = movieSearchService.getMovieById(summary.getImdbID());
                    if (cachedMovie.isPresent() && cachedMovie.get().getPlot() != null) {
                        continue;
                    }
                    getMovieDetails(summary.getImdbID());
                } catch (Exception e) {
                    log.error("Failed async fetch for {}", summary.getImdbID(), e);
                }
            }
        });
    }

    public OmdbSearchResponse searchMovies(String title) {
        log.info("Searching movies with title: {}", title);
        OmdbSearchResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("apikey", apiKey)
                        .queryParam("s", title)
                        .build())
                .retrieve()
                .body(OmdbSearchResponse.class);

        if (response != null && "True".equals(response.getResponse()) && response.getSearch() != null) {
            fetchAndSaveFullDetailsAsync(response.getSearch());
        }

        return response;
    }

    /**
     * Fetch ALL pages of OMDb search results for a title (up to 15 pages = 150
     * results).
     * Now uses Hybrid Search: Checks Meilisearch first for typo tolerance.
     * Falls back to OMDb returns 10 results per page if local DB returns nothing.
     */
    public Map<String, Object> searchAllMovies(String title) {
        log.info("Searching ALL pages for title: {}", title);

        // 1. Fire local Meilisearch query asynchronously
        CompletableFuture<List<OmdbMovieSummary>> localSearchFuture = CompletableFuture.supplyAsync(() -> {
            List<vladyslav.stasyshyn.couple_movie.model.Movie> localMovies = movieSearchService.searchMovies(title);
            return localMovies.stream().map(m -> {
                OmdbMovieSummary summary = new OmdbMovieSummary();
                summary.setImdbID(m.getImdbId());
                summary.setTitle(m.getTitle());
                summary.setYear(m.getYear());
                summary.setType(m.getType());
                summary.setPoster(m.getPoster());
                summary.setImdbRating(m.getImdbRating());
                return summary;
            }).collect(Collectors.toList());
        });

        List<OmdbMovieSummary> localResults = localSearchFuture.join();
        log.info("CRITICAL LOG -> Meilisearch/MySQL localResults extracted pre-merge string size: {}",
                localResults.size());

        // 2. Check the dynamic threshold to save API calls
        if (localResults.size() >= 100) {
            log.info("Local database returned {} matches (>100 threshold). Skipping OMDB API entirely.",
                    localResults.size());
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("Search", localResults);
            result.put("totalResults", String.valueOf(localResults.size()));
            result.put("Response", "True");
            return result;
        }

        // 3. Fallback to API if DB is too small (e.g. cold start or rare searches)
        log.info("Local DB returned {} matches. Fetching from OMDB API to enrich backend.", localResults.size());

        List<OmdbMovieSummary> allResults = new ArrayList<>();
        int totalResults = 0;
        int maxPages = 100; // OMDb API limits pagination to 100 pages maximum

        for (int page = 1; page <= maxPages; page++) {
            final int currentPage = page;
            OmdbSearchResponse response = null;
            try {
                response = restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .queryParam("apikey", apiKey)
                                .queryParam("s", title)
                                .queryParam("page", currentPage)
                                .build())
                        .retrieve()
                        .body(OmdbSearchResponse.class);
            } catch (Exception e) {
                log.warn("OMDb API exception on page {}: {}. Likely reached rate limit. Breaking loop.", page,
                        e.getMessage());
                break;
            }

            if (response == null || !"True".equals(response.getResponse()) || response.getSearch() == null) {
                break;
            }

            if (page == 1 && response.getTotalResults() != null) {
                try {
                    totalResults = Integer.parseInt(response.getTotalResults());
                } catch (NumberFormatException e) {
                    totalResults = 0;
                }
            }

            allResults.addAll(response.getSearch());
            fetchAndSaveFullDetailsAsync(response.getSearch());

            if (allResults.size() >= totalResults) {
                break;
            }
        }

        // 4. Merge results (Favoring API results for consistency, deduplicating via
        // LinkedHashMap)
        Map<String, OmdbMovieSummary> mergedMap = new LinkedHashMap<>();

        // Add local results first
        for (OmdbMovieSummary summary : localResults) {
            mergedMap.put(summary.getImdbID(), summary);
        }

        // Append API results (this will overwrite any local duplicates with fresh API
        // versions, but we MUST preserve the local rating so we don't break sorting)
        for (OmdbMovieSummary summary : allResults) {
            String id = summary.getImdbID();
            if (mergedMap.containsKey(id)) {
                OmdbMovieSummary localEquivalent = mergedMap.get(id);
                summary.setImdbRating(localEquivalent.getImdbRating());
            }
            mergedMap.put(id, summary);
        }

        List<OmdbMovieSummary> finalMergedList = new ArrayList<>(mergedMap.values());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("Search", finalMergedList);
        result.put("totalResults", String.valueOf(finalMergedList.size()));
        result.put("Response", finalMergedList.isEmpty() ? "False" : "True");
        return result;
    }

    public OmdbMovieDetails getMovieDetails(String imdbId) {
        log.info("Fetching movie details for imdbID: {}", imdbId);
        OmdbMovieDetails movieDetails = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("apikey", apiKey)
                        .queryParam("i", imdbId)
                        .queryParam("plot", "full")
                        .build())
                .retrieve()
                .body(OmdbMovieDetails.class);

        if (movieDetails != null) {
            movieSearchService.saveMovie(movieDetails);
        }

        return movieDetails;
    }
}
