package vladyslav.stasyshyn.couple_movie.dto;

public record GetStatusResponse(
        int matches,
        int watchlist,
        int watched) {
}