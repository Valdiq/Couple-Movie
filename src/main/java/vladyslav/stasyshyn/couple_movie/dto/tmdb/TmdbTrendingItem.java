package vladyslav.stasyshyn.couple_movie.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmdbTrendingItem(
        Long id,
        @JsonProperty("media_type") String mediaType,
        Double popularity
) {}
