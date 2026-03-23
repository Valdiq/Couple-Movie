package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.entity.Movie;
import java.util.List;

public record SearchPageResponse(
        List<Movie> movies,
        long totalHits,
        int page,
        int size) {
}
