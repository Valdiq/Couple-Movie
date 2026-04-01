package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vladyslav.stasyshyn.couple_movie.dto.tmdb.TmdbExternalIds;
import vladyslav.stasyshyn.couple_movie.dto.tmdb.TmdbTrendingItem;
import vladyslav.stasyshyn.couple_movie.dto.tmdb.TmdbTrendingResponse;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
public class TmdbService {

    private final RestClient restClient;
    private final String apiKey;
    private final OmdbService omdbService;
    private final MovieRepository movieRepository;

    public TmdbService(RestClient.Builder restClientBuilder,
                       @Value("${app.tmdb.api-key:placeholder}") String apiKey,
                       OmdbService omdbService,
                       MovieRepository movieRepository) {
        this.apiKey = apiKey;
        this.restClient = restClientBuilder.baseUrl("https://api.themoviedb.org/3").build();
        this.omdbService = omdbService;
        this.movieRepository = movieRepository;
    }

    @Cacheable("trendingMovies")
    public List<Movie> getTrending() {
        TmdbTrendingResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trending/all/week")
                        .queryParam("api_key", apiKey)
                        .build())
                .retrieve()
                .body(TmdbTrendingResponse.class);

        if (response == null || response.results() == null) {
            return List.of();
        }

        List<TmdbTrendingItem> sortedItems = new ArrayList<>(response.results());
        sortedItems.sort(Comparator.comparing(TmdbTrendingItem::popularity).reversed());

        List<Movie> trendingMovies = new ArrayList<>();

        for (TmdbTrendingItem item : sortedItems) {
            try {
                String targetPath = "/movie/" + item.id() + "/external_ids";
                if ("tv".equalsIgnoreCase(item.mediaType())) {
                    targetPath = "/tv/" + item.id() + "/external_ids";
                }

                final String finalPath = targetPath;
                TmdbExternalIds externalIds = restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path(finalPath)
                                .queryParam("api_key", apiKey)
                                .build())
                        .retrieve()
                        .body(TmdbExternalIds.class);

                if (externalIds != null && externalIds.imdbId() != null) {
                    String imdbId = externalIds.imdbId();
                    var dbMovieOpt = movieRepository.findById(imdbId);
                    if (dbMovieOpt.isPresent()) {
                        trendingMovies.add(dbMovieOpt.get());
                    } else {
                        var omdbDetails = omdbService.getMovieDetails(imdbId);
                        if (omdbDetails != null) {
                            var savedMovieOpt = movieRepository.findById(imdbId);
                            savedMovieOpt.ifPresent(trendingMovies::add);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to process trending item with TMDB ID: {}. Reason: {}", item.id(), e.getMessage());
            }
        }

        return trendingMovies;
    }
}
