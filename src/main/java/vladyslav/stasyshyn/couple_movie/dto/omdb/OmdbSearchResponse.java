package vladyslav.stasyshyn.couple_movie.dto.omdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record OmdbSearchResponse(
        @JsonProperty("Search") List<OmdbMovieSummary> search,
        @JsonProperty("totalResults") String totalResults,
        @JsonProperty("Response") String response) {
}
