package vladyslav.stasyshyn.couple_movie.dto;

import lombok.Builder;

@Builder
public record AuthenticationResponse(
        String token) {
}
