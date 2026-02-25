package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.config.JwtService;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationResponse;
import vladyslav.stasyshyn.couple_movie.dto.RegisterRequest;
import vladyslav.stasyshyn.couple_movie.model.Role;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.model.AuthToken;
import vladyslav.stasyshyn.couple_movie.repository.UserRepository;
import vladyslav.stasyshyn.couple_movie.repository.AuthTokenRepository;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
        private final UserRepository repository;
        private final AuthTokenRepository authTokenRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final EmailService emailService;

        public AuthenticationResponse register(RegisterRequest request) {
                if (repository.findByEmail(request.getEmail()).isPresent()) {
                        throw new RuntimeException("Email is already registered");
                }
                if (repository.findByDisplayUsername(request.getUsername()).isPresent()) {
                        throw new RuntimeException("Username is already taken");
                }

                var user = User.builder()
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .displayUsername(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(Role.USER)
                                .isVerified(false)
                                .build();
                repository.save(user);

                String verifyToken = java.util.UUID.randomUUID().toString();
                AuthToken authToken = AuthToken.builder()
                                .token(verifyToken)
                                .user(user)
                                .type(AuthToken.TokenType.VERIFY_EMAIL)
                                .expiresAt(java.time.LocalDateTime.now().plusHours(24))
                                .build();
                authTokenRepository.save(authToken);

                emailService.sendVerificationEmail(user.getEmail(), verifyToken);

                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var user = repository.findByEmail(request.getEmail())
                                .orElseThrow();
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public void verifyEmail(String token) {
                AuthToken authToken = authTokenRepository.findByToken(token)
                                .orElseThrow(() -> new RuntimeException("Invalid token"));

                if (authToken.getType() != AuthToken.TokenType.VERIFY_EMAIL) {
                        throw new RuntimeException("Invalid token type");
                }

                if (authToken.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                        throw new RuntimeException("Token expired");
                }

                User user = authToken.getUser();
                user.setVerified(true);
                repository.save(user);

                authTokenRepository.delete(authToken);
        }

        public void resendVerification(String email) {
                User user = repository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.isVerified()) {
                        throw new RuntimeException("User is already verified");
                }

                // Optional: delete old verification tokens to prevent clutter
                // authTokenRepository.deleteByUserIdAndType(user.getId(),
                // AuthToken.TokenType.VERIFY_EMAIL);

                String verifyToken = java.util.UUID.randomUUID().toString();
                AuthToken authToken = AuthToken.builder()
                                .token(verifyToken)
                                .user(user)
                                .type(AuthToken.TokenType.VERIFY_EMAIL)
                                .expiresAt(java.time.LocalDateTime.now().plusHours(24))
                                .build();
                authTokenRepository.save(authToken);

                emailService.sendVerificationEmail(user.getEmail(), verifyToken);
        }

        public void forgotPassword(String email) {
                User user = repository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                String resetToken = java.util.UUID.randomUUID().toString();
                AuthToken authToken = AuthToken.builder()
                                .token(resetToken)
                                .user(user)
                                .type(AuthToken.TokenType.RESET_PASSWORD)
                                .expiresAt(java.time.LocalDateTime.now().plusHours(1))
                                .build();
                authTokenRepository.save(authToken);

                emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
        }

        public void resetPassword(String token, String newPassword) {
                AuthToken authToken = authTokenRepository.findByToken(token)
                                .orElseThrow(() -> new RuntimeException("Invalid token"));

                if (authToken.getType() != AuthToken.TokenType.RESET_PASSWORD) {
                        throw new RuntimeException("Invalid token type");
                }

                if (authToken.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                        throw new RuntimeException("Token expired");
                }

                User user = authToken.getUser();
                user.setPassword(passwordEncoder.encode(newPassword));
                repository.save(user);

                authTokenRepository.delete(authToken);
        }
}
