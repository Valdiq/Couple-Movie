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

    @Query(nativeQuery = true)
    List<CoupleMovieWithDetails> findByCoupleKeyWithDetails(@Param("coupleKey") String coupleKey,
            @Param("userId") Long userId);

    Optional<CoupleMovie> findByCoupleKeyAndImdbId(String coupleKey, String imdbId);

    void deleteByCoupleKeyAndImdbId(String coupleKey, String imdbId);
}
