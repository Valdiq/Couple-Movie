package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.model.CoupleMovie;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoupleMovieRepository extends JpaRepository<CoupleMovie, Long> {
    List<CoupleMovie> findByCoupleKey(String coupleKey);

    List<CoupleMovie> findByCoupleKeyAndWatchStatus(String coupleKey, String watchStatus);

    Optional<CoupleMovie> findByCoupleKeyAndImdbId(String coupleKey, String imdbId);

    boolean existsByCoupleKeyAndImdbId(String coupleKey, String imdbId);

    void deleteByCoupleKeyAndImdbId(String coupleKey, String imdbId);
}
