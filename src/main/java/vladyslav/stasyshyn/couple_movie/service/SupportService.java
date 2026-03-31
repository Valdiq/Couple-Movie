package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.dto.FeedbackRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportService {

    private final JavaMailSender mailSender;

    public void sendFeedback(FeedbackRequest request, String userEmail) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("couplemovie.info@gmail.com");
            message.setSubject("New Feedback: " + request.topic());
            
            String body = "You have received new feedback from a user via the CoupleMovie App.\n\n" +
                          "User Email: " + userEmail + "\n" +
                          "Topic: " + request.topic() + "\n\n" +
                          "Message:\n" + request.message() + "\n\n" +
                          "-----------------------------------------\n" +
                          "You can reply directly to this email to respond to the user.";
                          
            message.setText(body);
            message.setReplyTo(userEmail);
            
            mailSender.send(message);
            log.info("Feedback successfully routed to support email from {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to route feedback email", e);
            throw new RuntimeException("Failed to send feedback mail. Please try again later.");
        }
    }
}
