package vladyslav.stasyshyn.couple_movie.dto;

public record AddMovieResponse(
        Long id,
        String imdbId,
        String title,
        String message) {
}
