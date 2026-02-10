package vladyslav.stasyshyn.couple_movie.dto;

import lombok.Data;

@Data
public class RateMovieRequest {
    private int rating;
    private String review;
}
