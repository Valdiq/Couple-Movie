package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.model.MovieStatus;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.model.UserMovieStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMovieStatusRepository extends JpaRepository<UserMovieStatus, Long> {
    Optional<UserMovieStatus> findByUserAndImdbId(User user, String imdbId);

    List<UserMovieStatus> findByUserAndStatus(User user, MovieStatus status);

    List<UserMovieStatus> findByUser(User user);
}
