package vladyslav.stasyshyn.couple_movie.repository.projection;

import java.time.LocalDateTime;

public interface CoupleMovieWithDetails {
    Long getId();

    String getCoupleKey();

    String getImdbId();

    String getTitle();

    String getPoster();

    String getYearVal();

    String getGenre();

    Long getAddedByUserId();

    String getWatchStatus();

    boolean getUserYouAdded();

    boolean getPartnerAdded();

    boolean getIsMatch();

    Double getYourRating();

    Double getPartnerRating();

    LocalDateTime getCreatedAt();

    Double getImdbRating();

    String getAwards();
}
