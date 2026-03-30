package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
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
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        String token = service.register(request);
        setJwtCookie(response, token);
        return ResponseEntity.ok(Map.of("message", "Registered successfully"));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<Map<String, String>> authenticate(@RequestBody AuthenticationRequest request, HttpServletResponse response) {
        log.info("Authenticating user: {}", request.email());
        String token = service.authenticate(request);
        setJwtCookie(response, token);
        return ResponseEntity.ok(Map.of("message", "Authenticated successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        clearJwtCookie(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        boolean isSecure = frontendUrl != null && frontendUrl.startsWith("https");
        log.info("Setting JWT cookie. frontendUrl: {}, isSecure: {}", frontendUrl, isSecure);
        cookie.setSecure(isSecure);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60); // 1 day
        cookie.setAttribute("SameSite", isSecure ? "None" : "Lax");
        response.addCookie(cookie);
    }

    private void clearJwtCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        boolean isSecure = frontendUrl != null && frontendUrl.startsWith("https");
        cookie.setSecure(isSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", isSecure ? "None" : "Lax");
        response.addCookie(cookie);
    }

    /**
     * Get the currently authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        log.info("Processing /me request. AuthenticationPrincipal is: {}", user != null ? user.getEmail() : "null");
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
