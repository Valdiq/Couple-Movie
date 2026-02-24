package vladyslav.stasyshyn.couple_movie.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.model.EmotionGenreMap;
import vladyslav.stasyshyn.couple_movie.repository.EmotionGenreMapRepository;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmotionGenreService {

    private final EmotionGenreMapRepository repository;

    /**
     * On application startup, seed the emotion_genre_map collection if empty.
     */
    @PostConstruct
    public void seedIfEmpty() {
        try {
            if (repository.count() > 0) {
                log.info("EmotionGenreMap collection already seeded ({} entries)", repository.count());
                return;
            }

            log.info("Seeding EmotionGenreMap collection...");

            Map<String, List<String>> mappings = Map.ofEntries(
                    Map.entry("romantic", List.of("Romance", "Drama")),
                    Map.entry("exciting", List.of("Action", "Adventure", "Thriller")),
                    Map.entry("happy", List.of("Comedy", "Animation", "Adventure", "Family")),
                    Map.entry("emotional", List.of("Drama", "Romance")),
                    Map.entry("uplifting", List.of("Comedy", "Family", "Adventure")),
                    Map.entry("mysterious", List.of("Mystery", "Thriller", "Crime")),
                    Map.entry("cozy", List.of("Comedy", "Family", "Romance")),
                    Map.entry("passionate", List.of("Romance", "Drama")),
                    Map.entry("inspiring", List.of("Drama", "Biography")),
                    Map.entry("thrilling", List.of("Thriller", "Action", "Crime")),

                    Map.entry("melancholic", List.of("Drama", "Romance")),
                    Map.entry("euphoric", List.of("Comedy", "Music", "Adventure")),
                    Map.entry("adventurous", List.of("Adventure", "Action", "Sci-Fi")),
                    Map.entry("terrifying", List.of("Horror", "Thriller")),
                    Map.entry("haunting", List.of("Horror", "Mystery", "Drama")),
                    Map.entry("playful", List.of("Comedy", "Animation", "Family")),
                    Map.entry("whimsical", List.of("Animation", "Fantasy", "Comedy")),
                    Map.entry("intense", List.of("Thriller", "Action", "Drama")),
                    Map.entry("peaceful", List.of("Documentary", "Family", "Comedy")),
                    Map.entry("empowering", List.of("Action", "Drama", "Biography")),
                    Map.entry("heartwarming", List.of("Family", "Comedy", "Drama")),
                    Map.entry("cathartic", List.of("Drama", "Romance")),
                    Map.entry("surreal", List.of("Fantasy", "Sci-Fi", "Animation")),
                    Map.entry("contemplative", List.of("Drama", "Documentary")),
                    Map.entry("rebellious", List.of("Action", "Crime", "Thriller")),
                    Map.entry("protective", List.of("Action", "Family", "Drama")),
                    Map.entry("energetic", List.of("Action", "Comedy", "Music")),
                    Map.entry("dramatic", List.of("Drama", "Thriller")),
                    Map.entry("comforting", List.of("Comedy", "Family", "Romance")),
                    Map.entry("bittersweet", List.of("Drama", "Romance")),
                    Map.entry("sophisticated", List.of("Drama", "Crime", "Mystery")),
                    Map.entry("liberating", List.of("Adventure", "Drama", "Comedy")));

            mappings.forEach((emotion, genres) -> {
                EmotionGenreMap entry = EmotionGenreMap.builder()
                        .emotion(emotion)
                        .genres(genres)
                        .build();
                repository.save(entry);
            });

            log.info("Seeded {} emotion-genre mappings", mappings.size());
        } catch (Exception e) {
            log.warn("Could not seed EmotionGenreMap (MongoDB may not be available): {}", e.getMessage());
        }
    }

    public List<String> getGenresForEmotion(String emotion) {
        try {
            Optional<EmotionGenreMap> mapping = repository.findByEmotion(emotion.toLowerCase());
            return mapping.map(EmotionGenreMap::getGenres).orElse(Collections.emptyList());
        } catch (Exception e) {
            log.warn("Could not query MongoDB for emotion '{}': {}", emotion, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<EmotionGenreMap> getAllMappings() {
        return repository.findAll();
    }
}
