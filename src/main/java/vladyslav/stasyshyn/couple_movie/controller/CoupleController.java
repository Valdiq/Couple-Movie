package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.service.CoupleService;

@RestController
@RequestMapping("/api/couple")
@RequiredArgsConstructor
public class CoupleController {

    private final CoupleService coupleService;

    @PostMapping("/invite")
    public ResponseEntity<?> sendInvite(@AuthenticationPrincipal User user, @RequestParam("email") String email) {
        try {
            return ResponseEntity.ok(coupleService.sendInvite(user, email));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptInvite(@AuthenticationPrincipal User user,
            @PathVariable("requestId") Long requestId) {
        try {
            coupleService.acceptInvite(user, requestId);
            return ResponseEntity.ok("Invite accepted");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectInvite(@AuthenticationPrincipal User user,
            @PathVariable("requestId") Long requestId) {
        try {
            coupleService.rejectInvite(user, requestId);
            return ResponseEntity.ok("Invite rejected");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/invites")
    public ResponseEntity<?> getInvites(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(coupleService.getReceivedInvites(user));
    }

    @GetMapping("/partner")
    public ResponseEntity<?> getPartner(@AuthenticationPrincipal User user) {
        return ResponseEntity.of(coupleService.getPartner(user));
    }
}
