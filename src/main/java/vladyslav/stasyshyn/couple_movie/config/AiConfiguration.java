package vladyslav.stasyshyn.couple_movie.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@Import({
        org.springframework.ai.autoconfigure.vertexai.gemini.VertexAiGeminiAutoConfiguration.class,
        org.springframework.ai.autoconfigure.vectorstore.pgvector.PgVectorStoreAutoConfiguration.class
})
public class AiConfiguration {
}
