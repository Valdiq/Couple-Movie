package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.entity.CoupleMovie;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vladyslav.stasyshyn.couple_movie.repository.projection.CoupleMovieWithDetails;

@Repository
public interface CoupleMovieRepository extends JpaRepository<CoupleMovie, Long> {
    List<CoupleMovie> findByCoupleKey(String coupleKey);

    @Query(value = "SELECT cm.id, cm.couple_key AS coupleKey, cm.imdb_id AS imdbId, " +
           "cm.title, cm.poster, cm.year_val AS yearVal, cm.genre, " +
           "cm.added_by_user_id AS addedByUserId, cm.watch_status AS watchStatus, " +
           "cm.user_you_added AS userYouAdded, cm.partner_added AS partnerAdded, " +
           "(cm.user_you_added = true AND cm.partner_added = true) AS isMatch, " +
           "CASE WHEN cm.user1_id = :userId THEN cm.user1_rating ELSE cm.user2_rating END AS yourRating, " +
           "CASE WHEN cm.user1_id = :userId THEN cm.user2_rating ELSE cm.user1_rating END AS partnerRating, " +
           "cm.created_at AS createdAt, " +
           "m.imdb_rating AS imdbRating, m.awards AS awards " +
           "FROM couple_movies cm LEFT JOIN movies m ON cm.imdb_id = m.imdb_id " +
           "WHERE cm.couple_key = :coupleKey " +
           "ORDER BY cm.created_at DESC", nativeQuery = true)
    List<CoupleMovieWithDetails> findByCoupleKeyWithDetails(@Param("coupleKey") String coupleKey,
            @Param("userId") Long userId);

    Optional<CoupleMovie> findByCoupleKeyAndImdbId(String coupleKey, String imdbId);

    void deleteByCoupleKeyAndImdbId(String coupleKey, String imdbId);

    @Query("SELECT c.imdbId FROM CoupleMovie c WHERE c.coupleKey = :coupleKey AND " +
           "((c.addedByUserId = :userId AND c.userYouAdded = true) OR " +
           "(c.addedByUserId <> :userId AND c.partnerAdded = true))")
    List<String> findMyAddedImdbIds(@Param("coupleKey") String coupleKey, @Param("userId") Long userId);
}
