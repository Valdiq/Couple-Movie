package vladyslav.stasyshyn.couple_movie.repository.projection;

import java.time.LocalDateTime;

public interface FavoriteWithDetails {
    Long getId();

    String getImdbId();

    String getTitle();

    String getPoster();

    String getYearVal();

    String getGenre();

    String getWatchStatus();

    Double getUserRating();

    LocalDateTime getCreatedAt();

    String getImdbRating();

    String getAwards();
}
