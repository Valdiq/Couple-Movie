package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.model.Movie;

import java.util.Optional;

@Repository
public interface MovieRepository extends JpaRepository<Movie, String> {

    @Query(value = "SELECT * FROM movies ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Optional<Movie> findRandomMovie();

}
