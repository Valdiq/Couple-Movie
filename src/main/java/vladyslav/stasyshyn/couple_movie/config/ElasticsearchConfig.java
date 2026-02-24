package vladyslav.stasyshyn.couple_movie.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

import java.time.Duration;

@Configuration
public class ElasticsearchConfig extends ElasticsearchConfiguration {

    @Value("${ELASTICSEARCH_URL:localhost:9200}")
    private String elasticsearchUrl;

    @Override
    public ClientConfiguration clientConfiguration() {
        return ClientConfiguration.builder()
                .connectedTo(elasticsearchUrl)
                .withConnectTimeout(Duration.ofSeconds(5))
                .withSocketTimeout(Duration.ofSeconds(5))
                .build();
    }
}
