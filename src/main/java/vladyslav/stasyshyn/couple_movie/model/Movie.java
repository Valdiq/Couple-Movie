package vladyslav.stasyshyn.couple_movie.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "movies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @Column(name = "imdb_id", nullable = false, unique = true)
    private String imdbId;

    @Column(nullable = false)
    private String title;

    private String year;
    private String type;

    @Column(columnDefinition = "TEXT")
    private String poster;

    private String genre;
    private String director;

    @Column(columnDefinition = "TEXT")
    private String plot;

    @Column(name = "imdb_rating")
    private Double imdbRating;
}
