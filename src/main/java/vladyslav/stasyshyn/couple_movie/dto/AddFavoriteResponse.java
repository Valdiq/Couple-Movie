package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.model.WatchStatus;

public record AddFavoriteResponse(
        Long id,
        String imdbId,
        String title,
        WatchStatus watchStatus,
        String message) {
}
