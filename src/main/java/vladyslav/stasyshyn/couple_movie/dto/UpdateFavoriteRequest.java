package vladyslav.stasyshyn.couple_movie.dto;

public record UpdateFavoriteRequest(
    String watchStatus,
    Double userRating) {
}
