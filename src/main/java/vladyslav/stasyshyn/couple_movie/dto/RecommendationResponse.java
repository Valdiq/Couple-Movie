package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.entity.Movie;
import java.util.List;

public record RecommendationResponse(
        List<RecommendationGroup> groups,
        String message) {

    public record RecommendationGroup(
            String reason,
            List<Movie> movies) {
    }
}
