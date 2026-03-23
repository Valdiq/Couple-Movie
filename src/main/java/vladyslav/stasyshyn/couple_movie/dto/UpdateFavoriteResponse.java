package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.model.WatchStatus;

public record UpdateFavoriteResponse(
        String imdbId,
        WatchStatus watchStatus,
        Double userRating,
        String message) {
}
