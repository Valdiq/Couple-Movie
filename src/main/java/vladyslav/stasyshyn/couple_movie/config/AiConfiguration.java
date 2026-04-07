package vladyslav.stasyshyn.couple_movie.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * AI Configuration placeholder.
 * Spring AI auto-configuration is excluded by default in application.yml.
 * Once pgvector extension and Vertex AI credentials are set up,
 * remove the exclusions from application.yml and set app.ai.enabled=true.
 */
@Configuration
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
public class AiConfiguration {
}
