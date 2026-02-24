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
            map.put("watch_status", fav.getWatchStatus() != null ? fav.getWatchStatus() : "PLAN_TO_WATCH");
            map.put("user_rating", fav.getUserRating());
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
        result.put("watch_status", favorite.getWatchStatus());
        result.put("message", "Added to favorites");
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{imdbId}")
    @Transactional
    public ResponseEntity<?> updateFavorite(@AuthenticationPrincipal User user,
            @PathVariable String imdbId,
            @RequestBody Map<String, Object> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        var optFav = userFavoriteRepository.findByUserAndImdbId(user, imdbId);
        if (optFav.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        UserFavorite fav = optFav.get();

        if (body.containsKey("watch_status")) {
            String status = (String) body.get("watch_status");
            if ("WATCHED".equals(status) || "PLAN_TO_WATCH".equals(status)) {
                fav.setWatchStatus(status);
            }
        }
        if (body.containsKey("user_rating")) {
            Object ratingObj = body.get("user_rating");
            if (ratingObj == null) {
                fav.setUserRating(null);
            } else {
                double rating = ratingObj instanceof Number ? ((Number) ratingObj).doubleValue()
                        : Double.parseDouble(ratingObj.toString());
                if (rating < 0.5 || rating > 5.0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 0.5 and 5"));
                }
                fav.setUserRating(rating);
            }
        }

        userFavoriteRepository.save(fav);

        Map<String, Object> result = new HashMap<>();
        result.put("imdb_id", fav.getImdbId());
        result.put("watch_status", fav.getWatchStatus());
        result.put("user_rating", fav.getUserRating());
        result.put("message", "Updated successfully");
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
