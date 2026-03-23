package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.AddFavoriteResponse;
import vladyslav.stasyshyn.couple_movie.dto.FavoriteResponse;
import vladyslav.stasyshyn.couple_movie.dto.UpdateFavoriteRequest;
import vladyslav.stasyshyn.couple_movie.dto.UpdateFavoriteResponse;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.exception.UnauthorizedException;
import vladyslav.stasyshyn.couple_movie.service.FavoritesService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final FavoritesService favoritesService;

    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> getFavorites(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(favoritesService.getFavorites(user));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<String>> getFavoriteIds(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(favoritesService.getFavoriteIds(user));
    }

    @PostMapping
    public ResponseEntity<AddFavoriteResponse> addFavorite(@AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(favoritesService.addFavorite(user, request));
    }

    @PatchMapping("/{imdbId}")
    public ResponseEntity<UpdateFavoriteResponse> updateFavorite(@AuthenticationPrincipal User user,
            @PathVariable String imdbId,
            @RequestBody UpdateFavoriteRequest request) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(favoritesService.updateFavorite(user, imdbId, request));
    }

    @DeleteMapping("/{imdbId}")
    public ResponseEntity<Map<String, Object>> removeFavorite(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        favoritesService.removeFavorite(user, imdbId);
        return ResponseEntity.ok(Map.of("message", "Removed from favorites"));
    }

    @GetMapping("/check/{imdbId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("is_favorite", false));
        }
        return ResponseEntity.ok(favoritesService.checkFavorite(user, imdbId));
    }
}
