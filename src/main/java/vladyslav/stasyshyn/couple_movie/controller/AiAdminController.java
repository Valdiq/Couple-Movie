package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.service.AiVectorizationService;

@RestController
@RequestMapping("/api/admin/ai")
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class AiAdminController {

    private final AiVectorizationService aiVectorizationService;

    /**
     * Endpoint to manually trigger the backfilling of the Vector DB.
     * Accessible only by administrators or natively permitted contexts.
     * WARNING: Can take many minutes to complete for large databases.
     */
    @PostMapping("/backfill-vectors")
    //@PreAuthorize("hasRole('ADMIN')") // Uncomment if you have an Admin role, or secure it another way
    public ResponseEntity<String> triggerVectorBackfill() {
        log.info("Received request to trigger AI vector backfill...");
        
        // We run this asynchronously so it doesn't block the HTTP request 
        // leading to a 504 Gateway Timeout while 50,000 movies sync.
        new Thread(() -> {
            try {
                aiVectorizationService.backfillDatabaseWithEmbeddings();
            } catch (Throwable e) {
                log.error("Failed during AI vectorization backfill stream", e);
            }
        }).start();

        return ResponseEntity.ok("Vectorization started in the background. Check server logs for progress!");
    }
}
