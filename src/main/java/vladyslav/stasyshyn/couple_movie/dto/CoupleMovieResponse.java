package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.model.WatchStatus;

public record CoupleMovieResponse(
        Long id,
        String imdbId,
        String title,
        String poster,
        String year,
        String genre,
        WatchStatus watchStatus,
        Long addedByUserId,
        boolean userYouAdded,
        boolean partnerAdded,
        boolean isMatch,
        Double yourRating,
        Double partnerRating,
        String createdAt,
        Double imdbRating,
        String awards) {
    public static CoupleMovieResponse fromProjection(
            vladyslav.stasyshyn.couple_movie.repository.projection.CoupleMovieWithDetails m) {
        WatchStatus watchStatusEnum = WatchStatus.WATCHLIST;
        if (m.getWatchStatus() != null) {
            try {
                watchStatusEnum = WatchStatus.valueOf(m.getWatchStatus());
            } catch (Exception e) {
            }
        }

        return new CoupleMovieResponse(
                m.getId(),
                m.getImdbId(),
                m.getTitle(),
                m.getPoster(),
                m.getYearVal(),
                m.getGenre(),
                watchStatusEnum,
                m.getAddedByUserId(),
                m.getUserYouAdded(),
                m.getPartnerAdded(),
                m.getIsMatch(),
                m.getYourRating(),
                m.getPartnerRating(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null,
                m.getImdbRating(),
                m.getAwards());
    }
}
