package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationResponse;
import jakarta.validation.Valid;
import vladyslav.stasyshyn.couple_movie.dto.RegisterRequest;
import vladyslav.stasyshyn.couple_movie.dto.UpdatePasswordRequest;
import vladyslav.stasyshyn.couple_movie.dto.UserProfileResponse;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.dto.ResetPasswordTokenRequest;
import vladyslav.stasyshyn.couple_movie.exception.UnauthorizedException;
import vladyslav.stasyshyn.couple_movie.service.AuthenticationService;
import java.util.Map;

/**
 * Controller for user authentication and specific registration.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    /**
     * Get the currently authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(UserProfileResponse.fromUser(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, String> request) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(service.updateProfile(user, request));
    }

    /**
     * Reset password: requires current password verification + new password.
     */
    @PostMapping("/update-password")
    public ResponseEntity<Map<String, Object>> updatePassword(@AuthenticationPrincipal User user, @Valid @RequestBody UpdatePasswordRequest request) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        service.updatePassword(user, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        service.verifyEmail(request);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@RequestBody Map<String, String> request) {
        service.resendVerification(request);
        return ResponseEntity.ok(Map.of("message", "Verification email sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        service.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
    }

    @PostMapping("/forgot-password-token")
    public ResponseEntity<Map<String, Object>> forgotPasswordToken(@Valid @RequestBody ResetPasswordTokenRequest request) {
        service.forgotPasswordToken(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
