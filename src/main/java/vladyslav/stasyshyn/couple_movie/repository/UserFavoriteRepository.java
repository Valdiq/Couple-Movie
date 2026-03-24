package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.entity.UserFavorite;
import vladyslav.stasyshyn.couple_movie.repository.projection.FavoriteWithDetails;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {
    List<UserFavorite> findByUser(User user);

    Optional<UserFavorite> findByUserAndImdbId(User user, String imdbId);

    void deleteByUserAndImdbId(User user, String imdbId);

    boolean existsByUserAndImdbId(User user, String imdbId);

    @Query(value = "SELECT uf.id, uf.imdb_id AS imdbId, uf.title, uf.poster, " +
           "uf.year_val AS yearVal, uf.genre, uf.watch_status AS watchStatus, " +
           "uf.user_rating AS userRating, uf.created_at AS createdAt, " +
           "m.imdb_rating AS imdbRating, m.awards AS awards " +
           "FROM user_favorites uf LEFT JOIN movies m ON uf.imdb_id = m.imdb_id " +
           "WHERE uf.user_id = :userId " +
           "ORDER BY uf.created_at DESC", nativeQuery = true)
    List<FavoriteWithDetails> findByUserWithDetails(@Param("userId") Long userId);

    @Query("SELECT uf.imdbId FROM UserFavorite uf WHERE uf.user = :user")
    List<String> findImdbIdsByUser(@Param("user") User user);
}
