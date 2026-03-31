package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieSummary;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbSearchResponse;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OmdbService {

    private final RestClient restClient;
    private final String apiKey;
    private final MovieSearchService movieSearchService;
    private final MovieRepository movieRepository;

    public OmdbService(RestClient.Builder restClientBuilder,
                       @Value("${app.omdb.api-key}") String apiKey,
                       @Value("${app.omdb.url}") String omdbUrl,
                       MovieSearchService movieSearchService,
                       MovieRepository movieRepository) {
        this.apiKey = apiKey;
        this.restClient = restClientBuilder.baseUrl(omdbUrl).build();
        this.movieSearchService = movieSearchService;
        this.movieRepository = movieRepository;
    }

    public void fetchAndSaveFullDetailsAsync(List<OmdbMovieSummary> summaries) {
        if (summaries == null || summaries.isEmpty())
            return;

        var semaphore = new Semaphore(25);

        Thread.startVirtualThread(() -> {
            try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
                for (OmdbMovieSummary summary : summaries) {
                    executor.submit(() -> {
                        try {
                            semaphore.acquire();
                            var cached = movieRepository.findById(summary.imdbID());
                            if (cached.isPresent() && cached.get().getPlot() != null) {
                                return;
                            }
                            getMovieDetails(summary.imdbID());
                        } catch (Exception e) {
                            log.error("Failed async fetch for {}", summary.imdbID(), e);
                        } finally {
                            semaphore.release();
                        }
                    });
                }
            }
        });
    }

    public OmdbSearchResponse searchMovies(String title) {
        OmdbSearchResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("apikey", apiKey)
                        .queryParam("s", title)
                        .build())
                .retrieve()
                .body(OmdbSearchResponse.class);

        if (response != null && response.response().equals("True") && response.search() != null) {
            fetchAndSaveFullDetailsAsync(response.search());
        }

        return response;
    }

    public OmdbSearchResponse searchAllMovies(String title) {
        List<Movie> localMovies = movieSearchService.searchMovies(title, 0, 1000).movies();
        List<OmdbMovieSummary> localResults = localMovies.stream().map(m -> new OmdbMovieSummary(
                        m.getTitle(),
                        m.getYear(),
                        m.getImdbId(),
                        m.getType(),
                        m.getPoster(),
                        m.getGenre(),
                        m.getAwards(),
                        m.getImdbRating() != null ? m.getImdbRating() : null))
                .collect(Collectors.toList());

        if (localResults.size() >= 100) {
            return new OmdbSearchResponse(
                    localResults,
                    String.valueOf(localResults.size()),
                    "True"
            );
        }

        List<OmdbMovieSummary> allResults = new ArrayList<>();
        int totalResults = 0;
        int maxPages = 25;

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
                break;
            }

            if (response == null || !response.response().equals("True") || response.search() == null) {
                break;
            }

            if (page == 1 && response.totalResults() != null) {
                try {
                    totalResults = Integer.parseInt(response.totalResults());
                } catch (NumberFormatException e) {
                    totalResults = 0;
                }
            }

            allResults.addAll(response.search());
            fetchAndSaveFullDetailsAsync(response.search());

            if (allResults.size() >= totalResults) {
                break;
            }
        }

        Map<String, OmdbMovieSummary> mergedMap = new LinkedHashMap<>();

        for (OmdbMovieSummary summary : localResults) {
            mergedMap.put(summary.imdbID(), summary);
        }

        for (OmdbMovieSummary summary : allResults) {
            String id = summary.imdbID();
            if (mergedMap.containsKey(id)) {
                OmdbMovieSummary localEquivalent = mergedMap.get(id);
                summary = new OmdbMovieSummary(
                        summary.title(),
                        summary.year(),
                        summary.imdbID(),
                        summary.type(),
                        summary.poster(),
                        localEquivalent.genre() != null ? localEquivalent.genre() : summary.genre(),
                        localEquivalent.awards() != null ? localEquivalent.awards() : summary.awards(),
                        localEquivalent.imdbRating());
            }
            mergedMap.put(id, summary);
        }

        List<OmdbMovieSummary> mergedList = new ArrayList<>(mergedMap.values());
        mergedList.sort(Comparator.comparing(OmdbMovieSummary::imdbRating, Comparator.nullsLast(Comparator.reverseOrder())));

        return new OmdbSearchResponse(
                mergedList,
                String.valueOf(mergedList.size()),
                mergedList.isEmpty() ? "False" : "True"
        );
    }

    public OmdbMovieDetails getMovieDetails(String imdbId) {
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
