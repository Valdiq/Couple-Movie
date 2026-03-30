package vladyslav.stasyshyn.couple_movie.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.model.Role;
import vladyslav.stasyshyn.couple_movie.repository.UserRepository;
import java.io.IOException;
import java.util.Optional;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String googleId = oAuth2User.getAttribute("sub");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String picture = oAuth2User.getAttribute("picture");

        String defaultUsername = (lastName != null && !lastName.isEmpty()) ? lastName.toLowerCase()
                : (firstName != null && !firstName.isEmpty()) ? firstName.toLowerCase()
                        : (email != null ? email.split("@")[0] : "user");

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                userRepository.save(user);
            }
        } else {
            user = User.builder()
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .displayUsername(defaultUsername)
                    .googleId(googleId)
                    .role(Role.USER)
                    .avatarUrl(picture)
                    .build();
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        
        boolean isSecure = frontendUrl != null && frontendUrl.startsWith("https");
        log.info("OAuth Login Success. frontendUrl: {}, isSecure: {}, email: {}", frontendUrl, isSecure, email);
        
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(24 * 60 * 60) // 1 day
                .sameSite(isSecure ? "None" : "Lax")
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
