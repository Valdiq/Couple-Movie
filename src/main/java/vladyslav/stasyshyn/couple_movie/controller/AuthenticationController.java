package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationResponse;
import vladyslav.stasyshyn.couple_movie.dto.RegisterRequest;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.repository.UserRepository;
import vladyslav.stasyshyn.couple_movie.service.AuthenticationService;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for user authentication and specific registration.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    /**
     * Get the currently authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("firstname", user.getFirstName() != null ? user.getFirstName() : "");
        response.put("lastname", user.getLastName() != null ? user.getLastName() : "");
        response.put("full_name", (user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : ""));
        response.put("role", user.getRole().name());
        response.put("avatar_url", user.getAvatarUrl());
        response.put("username", user.getDisplayUsername());
        response.put("created_date", user.getCreatedDate() != null ? user.getCreatedDate().toString() : null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User user,
            @RequestBody Map<String, String> updates) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        if (updates.containsKey("avatar_url")) {
            user.setAvatarUrl(updates.get("avatar_url"));
        }
        if (updates.containsKey("firstname")) {
            user.setFirstName(updates.get("firstname"));
        }
        if (updates.containsKey("lastname")) {
            user.setLastName(updates.get("lastname"));
        }
        if (updates.containsKey("username")) {
            user.setDisplayUsername(updates.get("username"));
        }
        userRepository.save(user);
        return getCurrentUser(user);
    }

    /**
     * Reset password: requires current password verification + new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password and new password are required"));
        }

        // Google-only users may not have a password set
        if (user.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot reset password for Google-only accounts"));
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
