package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.model.EmotionGenreMap;

import java.util.Optional;

@Repository
public interface EmotionGenreMapRepository extends MongoRepository<EmotionGenreMap, String> {
    Optional<EmotionGenreMap> findByEmotion(String emotion);
}
