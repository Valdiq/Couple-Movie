package vladyslav.stasyshyn.couple_movie.document;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MovieDocument {
    private String imdbID;
    private String title;
    private String year;
    private List<String> genre;
    private Double imdbRating;
    private String awards;
    private Boolean hasWinAward;
    private Integer yearInt;
    private Long imdbVotesInt;
}
