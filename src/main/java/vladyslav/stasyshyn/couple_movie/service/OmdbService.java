package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieSummary;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbSearchResponse;

import java.util.*;

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

    public OmdbSearchResponse searchMovies(String title) {
        log.info("Searching movies with title: {}", title);
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("apikey", apiKey)
                        .queryParam("s", title)
                        .build())
                .retrieve()
                .body(OmdbSearchResponse.class);
    }

    /**
     * Fetch ALL pages of OMDb search results for a title (up to 15 pages = 150
     * results).
     * OMDb returns 10 results per page.
     */
    public Map<String, Object> searchAllMovies(String title) {
        log.info("Searching ALL pages for title: {}", title);
        List<OmdbMovieSummary> allResults = new ArrayList<>();
        int totalResults = 0;
        int maxPages = 15;

        for (int page = 1; page <= maxPages; page++) {
            final int currentPage = page;
            OmdbSearchResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("apikey", apiKey)
                            .queryParam("s", title)
                            .queryParam("page", currentPage)
                            .build())
                    .retrieve()
                    .body(OmdbSearchResponse.class);

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

            // Stop if we've fetched all available results
            if (allResults.size() >= totalResults) {
                break;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("Search", allResults);
        result.put("totalResults", String.valueOf(totalResults));
        result.put("Response", allResults.isEmpty() ? "False" : "True");
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
