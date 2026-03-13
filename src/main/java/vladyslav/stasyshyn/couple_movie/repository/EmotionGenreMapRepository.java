package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.entity.EmotionGenreMap;
import java.util.Optional;

@Repository
public interface EmotionGenreMapRepository extends JpaRepository<EmotionGenreMap, String> {
    Optional<EmotionGenreMap> findByEmotion(String emotion);
}
