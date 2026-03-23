package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("CoupleMovie - Verify your email");

            String verificationUrl = frontendUrl + "/verify-email?token=" + token;

            message.setText("""
                    Welcome to CoupleMovie!
                    
                    Please click the link below to verify your email address:
                    %s
                    
                    Thank you!""".formatted(verificationUrl));

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", to, e);
        }
    }

    public void sendPasswordResetEmail(String to, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("CoupleMovie - Password Reset Request");

            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            message.setText("""
                    You have requested to reset your password.
                    
                    Please click the link below to set a new password:
                    %s
                    
                    If you did not request this, please ignore this email.""".formatted(resetUrl));

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", to, e);
        }
    }
}
