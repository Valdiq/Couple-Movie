package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.model.UserFavorite;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {
    List<UserFavorite> findByUser(User user);

    Optional<UserFavorite> findByUserAndImdbId(User user, String imdbId);

    void deleteByUserAndImdbId(User user, String imdbId);

    boolean existsByUserAndImdbId(User user, String imdbId);
}
