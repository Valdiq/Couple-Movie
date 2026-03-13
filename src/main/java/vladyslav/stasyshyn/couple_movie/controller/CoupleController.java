package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.entity.CoupleRequest;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.exception.UnauthorizedException;
import vladyslav.stasyshyn.couple_movie.service.CoupleService;

/**
 * Controller for managing couple connections and invitations.
 */
@RestController
@RequestMapping("/api/v1/couple")
@RequiredArgsConstructor
public class CoupleController {

    private final CoupleService coupleService;

    /**
     * Send a couple invitation to another user by email.
     *
     * @param user  The authenticated user sending the invite.
     * @param email The email of the user to invite.
     * @return The created invitation request.
     */
    @PostMapping("/invite")
    public ResponseEntity<CoupleRequest> sendInvite(@AuthenticationPrincipal User user, @RequestParam("username") String username) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleService.sendInvite(user, username));
    }

    /**
     * Accept a received couple invitation.
     *
     * @param user      The authenticated user accepting the invite.
     * @param requestId The ID of the invitation request.
     * @return A success message.
     */
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<Map<String, Object>> acceptInvite(@AuthenticationPrincipal User user,
            @PathVariable("requestId") Long requestId) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        coupleService.acceptInvite(user, requestId);
        return ResponseEntity.ok(Map.of("message", "Invite accepted"));
    }

    /**
     * Reject a received couple invitation.
     *
     * @param user      The authenticated user rejecting the invite.
     * @param requestId The ID of the invitation request.
     * @return A success message.
     */
    @PostMapping("/reject/{requestId}")
    public ResponseEntity<Map<String, Object>> rejectInvite(@AuthenticationPrincipal User user,
            @PathVariable("requestId") Long requestId) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        coupleService.rejectInvite(user, requestId);
        return ResponseEntity.ok(Map.of("message", "Invite rejected"));
    }

    /**
     * Get all received couple invitations for the authenticated user.
     *
     * @param user The authenticated user.
     * @return A list of received invitations.
     */
    @GetMapping("/invites")
    public ResponseEntity<List<CoupleRequest>> getInvites(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleService.getReceivedInvites(user));
    }

    /**
     * Get the current partner of the authenticated user.
     *
     * @param user The authenticated user.
     * @return The partner user details, if connected.
     */
    @GetMapping("/partner")
    public ResponseEntity<User> getPartner(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.of(Objects.requireNonNull(coupleService.getPartner(user)));
    }

    /**
     * Break the couple link.
     */
    @PostMapping("/break")
    public ResponseEntity<Map<String, Object>> breakCouple(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        coupleService.breakCouple(user);
        return ResponseEntity.ok(Map.of("message", "Couple link broken successfully"));
    }
}
