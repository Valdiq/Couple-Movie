package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vladyslav.stasyshyn.couple_movie.entity.EmotionGenreMap;
import vladyslav.stasyshyn.couple_movie.repository.EmotionGenreMapRepository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmotionGenreService {

    private final EmotionGenreMapRepository repository;

    @Transactional(readOnly = true)
    public List<String> getGenresForEmotion(String emotion) {
        try {
            Optional<EmotionGenreMap> mapping = repository.findByEmotion(emotion.toLowerCase());
            return mapping.map(EmotionGenreMap::getGenres).orElse(Collections.emptyList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public List<EmotionGenreMap> getAllMappings() {
        return repository.findAll();
    }
}
