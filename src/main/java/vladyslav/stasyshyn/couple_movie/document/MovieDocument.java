package vladyslav.stasyshyn.couple_movie.document;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovieDocument {

    private String imdbID;
    private String title;
    private String year;
    private String genre;
    private Double imdbRating;
}
