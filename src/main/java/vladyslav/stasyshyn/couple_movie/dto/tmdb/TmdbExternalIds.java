package vladyslav.stasyshyn.couple_movie.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmdbExternalIds(
        Long id,
        @JsonProperty("imdb_id") String imdbId
) {}
