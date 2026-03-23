package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.model.WatchStatus;
import vladyslav.stasyshyn.couple_movie.repository.projection.FavoriteWithDetails;
import java.time.LocalDateTime;

public record FavoriteResponse(
        Long id,
        String imdbId,
        String title,
        String poster,
        String year,
        String genre,
        WatchStatus watchStatus,
        Double userRating,
        LocalDateTime createdAt,
        String imdbRating,
        String awards) {

    public static FavoriteResponse fromProjection(FavoriteWithDetails p) {
        WatchStatus status;
        try {
            status = p.getWatchStatus() != null ? WatchStatus.valueOf(p.getWatchStatus()) : WatchStatus.PLAN_TO_WATCH;
        } catch (IllegalArgumentException e) {
            status = WatchStatus.PLAN_TO_WATCH;
        }

        return new FavoriteResponse(
                p.getId(),
                p.getImdbId(),
                p.getTitle(),
                p.getPoster(),
                p.getYearVal(),
                p.getGenre(),
                status,
                p.getUserRating(),
                p.getCreatedAt(),
                p.getImdbRating(),
                p.getAwards());
    }
}
