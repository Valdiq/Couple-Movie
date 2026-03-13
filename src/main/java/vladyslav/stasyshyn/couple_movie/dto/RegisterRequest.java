package vladyslav.stasyshyn.couple_movie.dto;

import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import vladyslav.stasyshyn.couple_movie.validation.ValidName;
import vladyslav.stasyshyn.couple_movie.validation.ValidUsername;

@Builder
public record RegisterRequest(
                @NotBlank(message = "First name is required")
                @ValidName(message = "First name must contain only letters")
                String firstName,

                @NotBlank(message = "Last name is required")
                @ValidName(message = "Last name must contain only letters")
                String lastName,

                @NotBlank(message = "Username is required")
                @ValidUsername
                String username,

                @NotBlank(message = "Email is required")
                @Email(message = "Email must be valid")
                String email,

                @NotBlank(message = "Password is required")
                @Size(min = 8, message = "Password must be at least 8 characters long")
                String password) {
}
