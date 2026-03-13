package vladyslav.stasyshyn.couple_movie.dto;

import lombok.Builder;

@Builder
public record AuthenticationRequest(
        String email,
        String password) {
}
