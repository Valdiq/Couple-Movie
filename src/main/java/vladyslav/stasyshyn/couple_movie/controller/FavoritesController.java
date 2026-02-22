package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.model.UserFavorite;
import vladyslav.stasyshyn.couple_movie.repository.UserFavoriteRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final UserFavoriteRepository userFavoriteRepository;

    @GetMapping
    public ResponseEntity<?> getFavorites(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        List<UserFavorite> favorites = userFavoriteRepository.findByUser(user);
        List<Map<String, Object>> result = favorites.stream().map(fav -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", fav.getId());
            map.put("imdb_id", fav.getImdbId());
            map.put("title", fav.getTitle());
            map.put("poster", fav.getPoster());
            map.put("year", fav.getYear());
            map.put("genre", fav.getGenre());
            map.put("created_at", fav.getCreatedAt() != null ? fav.getCreatedAt().toString() : null);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String imdbId = body.get("imdb_id");
        if (imdbId == null || imdbId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "imdb_id is required"));
        }

        // Check if already favorited
        if (userFavoriteRepository.existsByUserAndImdbId(user, imdbId)) {
            return ResponseEntity.ok(Map.of("message", "Already favorited"));
        }

        UserFavorite favorite = UserFavorite.builder()
                .user(user)
                .imdbId(imdbId)
                .title(body.getOrDefault("title", ""))
                .poster(body.getOrDefault("poster", ""))
                .year(body.getOrDefault("year", ""))
                .genre(body.getOrDefault("genre", ""))
                .build();

        userFavoriteRepository.save(favorite);

        Map<String, Object> result = new HashMap<>();
        result.put("id", favorite.getId());
        result.put("imdb_id", favorite.getImdbId());
        result.put("title", favorite.getTitle());
        result.put("message", "Added to favorites");
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{imdbId}")
    @Transactional
    public ResponseEntity<?> removeFavorite(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        userFavoriteRepository.deleteByUserAndImdbId(user, imdbId);
        return ResponseEntity.ok(Map.of("message", "Removed from favorites"));
    }

    @GetMapping("/check/{imdbId}")
    public ResponseEntity<?> checkFavorite(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("is_favorite", false));
        }
        boolean isFavorite = userFavoriteRepository.existsByUserAndImdbId(user, imdbId);
        return ResponseEntity.ok(Map.of("is_favorite", isFavorite));
    }
}
