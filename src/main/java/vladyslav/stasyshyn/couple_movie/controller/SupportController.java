package vladyslav.stasyshyn.couple_movie.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.dto.FeedbackRequest;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.service.SupportService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping("/feedback")
    public ResponseEntity<Map<String, String>> submitFeedback(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody FeedbackRequest request) {
            
        supportService.sendFeedback(request, user.getEmail());
        
        return ResponseEntity.ok(Map.of("message", "Feedback successfully submitted. Thank you for making CoupleMovie better!"));
    }
}
