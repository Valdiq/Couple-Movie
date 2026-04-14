package vladyslav.stasyshyn.couple_movie.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class CacheConfiguration {

    private final CacheManager cacheManager;

    @Scheduled(cron = "0 0 0 * * *")
    public void evictRecommendationsCache() {
        var cache = cacheManager.getCache("recommendations");
        if (cache != null) {
            cache.clear();
            log.info("AI Recommendations cache cleared (daily scheduled eviction).");
        }
    }
}
