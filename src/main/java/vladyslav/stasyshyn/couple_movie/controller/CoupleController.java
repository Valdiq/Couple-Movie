package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.service.CoupleService;

/**
 * Controller for managing couple connections and invitations.
 */
@RestController
@RequestMapping("/api/couple")
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
    public ResponseEntity<?> sendInvite(@AuthenticationPrincipal User user, @RequestParam("email") String email) {
        try {
            return ResponseEntity.ok(coupleService.sendInvite(user, email));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred while sending invite.");
        }
    }

    /**
     * Accept a received couple invitation.
     *
     * @param user      The authenticated user accepting the invite.
     * @param requestId The ID of the invitation request.
     * @return A success message.
     */
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptInvite(@AuthenticationPrincipal User user,
            @PathVariable("requestId") Long requestId) {
        try {
            coupleService.acceptInvite(user, requestId);
            return ResponseEntity.ok("Invite accepted");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred while accepting invite.");
        }
    }

    /**
     * Reject a received couple invitation.
     *
     * @param user      The authenticated user rejecting the invite.
     * @param requestId The ID of the invitation request.
     * @return A success message.
     */
    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectInvite(@AuthenticationPrincipal User user,
            @PathVariable("requestId") Long requestId) {
        try {
            coupleService.rejectInvite(user, requestId);
            return ResponseEntity.ok("Invite rejected");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred while rejecting invite.");
        }
    }

    /**
     * Get all received couple invitations for the authenticated user.
     *
     * @param user The authenticated user.
     * @return A list of received invitations.
     */
    @GetMapping("/invites")
    public ResponseEntity<?> getInvites(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(coupleService.getReceivedInvites(user));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving invites: " + e.getMessage());
        }
    }

    /**
     * Get the current partner of the authenticated user.
     *
     * @param user The authenticated user.
     * @return The partner user details, if connected.
     */
    @GetMapping("/partner")
    public ResponseEntity<?> getPartner(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.of(coupleService.getPartner(user));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving partner: " + e.getMessage());
        }
    }
}
