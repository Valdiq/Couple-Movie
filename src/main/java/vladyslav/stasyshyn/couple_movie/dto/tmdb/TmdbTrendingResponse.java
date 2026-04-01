package vladyslav.stasyshyn.couple_movie.dto.tmdb;

import java.util.List;

public record TmdbTrendingResponse(
        Integer page,
        List<TmdbTrendingItem> results
) {}
