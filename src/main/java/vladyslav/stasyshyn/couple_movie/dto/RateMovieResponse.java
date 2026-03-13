package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.model.WatchStatus;

public record RateMovieResponse(
        String imdbId,
        Double yourRating,
        WatchStatus watchStatus,
        String message) {
}
