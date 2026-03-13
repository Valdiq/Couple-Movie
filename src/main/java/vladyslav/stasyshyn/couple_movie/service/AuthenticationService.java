package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vladyslav.stasyshyn.couple_movie.config.JwtService;
import vladyslav.stasyshyn.couple_movie.dto.*;
import vladyslav.stasyshyn.couple_movie.entity.AuthToken;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.exception.UnauthorizedException;
import vladyslav.stasyshyn.couple_movie.model.Role;
import vladyslav.stasyshyn.couple_movie.repository.AuthTokenRepository;
import vladyslav.stasyshyn.couple_movie.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final AuthTokenRepository authTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        if (repository.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Email is already registered");
        }
        if (repository.findByDisplayUsername(request.username()).isPresent()) {
            throw new RuntimeException("Username is already taken");
        }

        var user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .displayUsername(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .isVerified(false)
                .build();
        repository.save(Objects.requireNonNull(user));

        String verifyToken = UUID.randomUUID().toString();
        AuthToken authToken = AuthToken.builder()
                .token(verifyToken)
                .user(user)
                .type(AuthToken.TokenType.VERIFY_EMAIL)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        authTokenRepository.save(Objects.requireNonNull(authToken));

        emailService.sendVerificationEmail(user.getEmail(), verifyToken);

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()));
        var user = repository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException(
                        "Invalid email or password"));
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    @Transactional
    public void verifyEmail(Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }

        AuthToken authToken = authTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        if (authToken.getType() != AuthToken.TokenType.VERIFY_EMAIL) {
            throw new IllegalArgumentException("Invalid token type");
        }

        if (authToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        User user = authToken.getUser();
        user.setVerified(true);
        repository.save(user);

        authTokenRepository.delete(authToken);
    }

    @Transactional
    public void resendVerification(Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        User user = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isVerified()) {
            throw new IllegalArgumentException("User is already verified");
        }

        String verifyToken = UUID.randomUUID().toString();
        AuthToken authToken = AuthToken.builder()
                .token(verifyToken)
                .user(user)
                .type(AuthToken.TokenType.VERIFY_EMAIL)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        authTokenRepository.save(Objects.requireNonNull(authToken));

        emailService.sendVerificationEmail(user.getEmail(), verifyToken);
    }

    @Transactional
    public void forgotPassword(Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        User user = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String resetToken = UUID.randomUUID().toString();
        AuthToken authToken = AuthToken.builder()
                .token(resetToken)
                .user(user)
                .type(AuthToken.TokenType.RESET_PASSWORD)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        authTokenRepository.save(Objects.requireNonNull(authToken));

        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
    }

    @Transactional
    public void forgotPasswordToken(ResetPasswordTokenRequest request) {
        String token = request.token();
        String newPassword = request.newPassword();

        AuthToken authToken = authTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        if (authToken.getType() != AuthToken.TokenType.RESET_PASSWORD) {
            throw new IllegalArgumentException("Invalid token type");
        }

        if (authToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        User user = authToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        repository.save(user);

        authTokenRepository.delete(authToken);
    }

    @Transactional
    public UserProfileResponse updateProfile(User user, Map<String, String> request) {
        if (request.containsKey("avatar_url") && request.get("avatar_url") != null) {
            user.setAvatarUrl(request.get("avatar_url"));
        }
        repository.save(Objects.requireNonNull(user));
        return UserProfileResponse.fromUser(user);
    }

    @Transactional
    public void updatePassword(User user, UpdatePasswordRequest request) {
        if (request.currentPassword() == null || request.newPassword() == null
                || request.newPassword().isBlank()) {
            throw new IllegalArgumentException("Current password and new password are required");
        }

        if (user.getPassword() == null) {
            throw new IllegalArgumentException("Cannot reset password for Google-only accounts");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        repository.save(user);
    }
}
