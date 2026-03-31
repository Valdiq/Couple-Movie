package vladyslav.stasyshyn.couple_movie.dto;

import jakarta.validation.constraints.NotBlank;

public record FeedbackRequest(
    @NotBlank(message = "Topic is required")
    String topic,
    
    @NotBlank(message = "Message is required")
    String message
) {}
