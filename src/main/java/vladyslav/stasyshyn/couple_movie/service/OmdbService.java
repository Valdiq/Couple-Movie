package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbSearchResponse;

@Service
@Slf4j
public class OmdbService {

    private final RestClient restClient;
    private final String apiKey;
    private final String omdbUrl;

    public OmdbService(RestClient.Builder restClientBuilder,
            @Value("${app.omdb.api-key}") String apiKey,
            @Value("${app.omdb.url}") String omdbUrl) {
        this.apiKey = apiKey;
        this.omdbUrl = omdbUrl;
        this.restClient = restClientBuilder.baseUrl(omdbUrl).build();
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

    public OmdbMovieDetails getMovieDetails(String imdbId) {
        log.info("Fetching movie details for imdbID: {}", imdbId);
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("apikey", apiKey)
                        .queryParam("i", imdbId)
                        .queryParam("plot", "full")
                        .build())
                .retrieve()
                .body(OmdbMovieDetails.class);
    }
}
