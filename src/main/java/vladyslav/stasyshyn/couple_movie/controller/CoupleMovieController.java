package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieRequest;
import vladyslav.stasyshyn.couple_movie.model.MovieStatus;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.service.UserMovieService;

@RestController
@RequestMapping("/api/user/movies")
@RequiredArgsConstructor
public class CoupleMovieController {
    // Renamed to avoid conflict if any, but class name inside was
    // UserMovieController in plan.
    // Actually let's stick to UserMovieController for consistency with service.
}
