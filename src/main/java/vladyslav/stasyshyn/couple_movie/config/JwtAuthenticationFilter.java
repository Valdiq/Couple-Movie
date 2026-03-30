package vladyslav.stasyshyn.couple_movie.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        log.info("Processing request: {} {}", request.getMethod(), request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        String jwt = null;
        String userEmail = null;

        if (request.getCookies() != null) {
            log.info("Request contains {} cookies", request.getCookies().length);
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                log.info("Found cookie: {}", cookie.getName());
                if ("jwt".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    log.info("Extracted JWT from cookie");
                    break;
                }
            }
        } else {
            log.info("Request contains no cookies");
        }

        if (jwt == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            log.info("Extracted JWT from Authorization header");
        }

        if (jwt == null) {
            log.info("No JWT found, continuing filter chain");
            filterChain.doFilter(request, response);
            return;
        }

        userEmail = jwtService.extractUsername(jwt);
        if (userEmail != null) {
            log.info("Extracted user email from JWT: {}", userEmail);
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.info("Successfully authenticated user in SecurityContext: {}", userEmail);
            } else {
                log.info("JWT token is invalid for user: {}", userEmail);
            }
        }
        filterChain.doFilter(request, response);
    }
}
