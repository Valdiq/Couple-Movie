package vladyslav.stasyshyn.couple_movie.config;

import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MeilisearchConfig {

    @Value("${app.meilisearch.url:http://localhost:7700}")
    private String url;

    @Value("${app.meilisearch.api-key:masterKey}")
    private String apiKey;

    @Bean
    public Client meilisearchClient() {
        return new Client(new Config(url, apiKey));
    }
}
