package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final OmdbService omdbService;

    @PostMapping("/seed-omdb")
    public ResponseEntity<String> seedDatabase() {
        String result = omdbService.seedDatabaseFromFile();
        return ResponseEntity.ok(result);
    }
}
