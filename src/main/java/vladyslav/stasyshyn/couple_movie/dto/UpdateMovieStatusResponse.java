package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.model.WatchStatus;

public record UpdateMovieStatusResponse(
        String imdbId,
        WatchStatus watchStatus,
        String message) {
}
