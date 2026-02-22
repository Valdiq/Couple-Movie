package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.model.EmotionGenreMap;
import vladyslav.stasyshyn.couple_movie.service.EmotionGenreService;

import java.util.List;
import java.util.Map;

/**
 * Controller for emotion-to-genre mapping endpoints.
 */
@RestController
@RequestMapping("/api/v1/emotions")
@RequiredArgsConstructor
public class EmotionController {

    private final EmotionGenreService emotionGenreService;

    /**
     * Get all available emotions with their genre mappings.
     */
    @GetMapping
    public ResponseEntity<List<EmotionGenreMap>> getAllEmotions() {
        return ResponseEntity.ok(emotionGenreService.getAllMappings());
    }

    /**
     * Get genres mapped to a specific emotion.
     *
     * @param emotion The emotion name (e.g., "happy", "romantic").
     * @return The list of genres mapped to that emotion.
     */
    @GetMapping("/genres")
    public ResponseEntity<Map<String, Object>> getGenresForEmotion(@RequestParam("emotion") String emotion) {
        List<String> genres = emotionGenreService.getGenresForEmotion(emotion);
        return ResponseEntity.ok(Map.of("emotion", emotion, "genres", genres));
    }
}
