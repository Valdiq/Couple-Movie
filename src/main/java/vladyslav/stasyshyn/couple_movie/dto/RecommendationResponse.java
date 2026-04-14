package vladyslav.stasyshyn.couple_movie.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private List<RecommendationGroup> groups;
    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationGroup {
        private String reason;
        private List<Movie> movies;
    }
}
