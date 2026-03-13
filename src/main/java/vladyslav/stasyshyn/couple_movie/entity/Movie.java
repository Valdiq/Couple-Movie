package vladyslav.stasyshyn.couple_movie.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "movies")
public class Movie {

    @Id
    @Column(name = "imdb_id", nullable = false, unique = true)
    private String imdbId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "year_val")
    private String year;

    @Column(name = "type")
    private String type;

    @Column(name = "poster", columnDefinition = "TEXT")
    private String poster;

    @Column(name = "genre")
    private String genre;

    @Column(name = "director")
    private String director;

    @Column(name = "writer")
    private String writer;

    @Column(name = "plot", columnDefinition = "TEXT")
    private String plot;

    @Column(name = "runtime")
    private String runtime;

    @Column(name = "rated")
    private String rated;

    @Column(name = "actors", columnDefinition = "TEXT")
    private String actors;

    @Column(name = "language")
    private String language;

    @Column(name = "country")
    private String country;

    @Column(name = "awards", columnDefinition = "TEXT")
    private String awards;

    @Column(name = "metascore")
    private String metascore;

    @Column(name = "imdb_votes")
    private String imdbVotes;

    @Column(name = "imdb_rating")
    private Double imdbRating;
}
