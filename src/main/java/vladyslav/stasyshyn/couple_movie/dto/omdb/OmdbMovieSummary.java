package vladyslav.stasyshyn.couple_movie.dto.omdb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OmdbMovieSummary(
                @JsonProperty("Title") String title,
                @JsonProperty("Year") String year,
                @JsonProperty("imdbID") String imdbID,
                @JsonProperty("Type") String type,
                @JsonProperty("Poster") String poster,
                @JsonProperty("Genre") String genre,
                @JsonProperty("Awards") String awards,
                Double imdbRating) {
}
