package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@Service
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class AiVectorizationService {

    private final VectorStore vectorStore;
    private final MovieRepository movieRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * This will iterate over all movies in the database, convert them into AI Documents,
     * and save them to the pgvector database.
     * WARNING: This should only be run ONCE to backfill the database.
     */
    public void backfillDatabaseWithEmbeddings() {
        log.info("Starting AI Vectorization backfill...");

        // Fix: Drop and recreate existing vector table to 384 dimensions (Alter fails if indexed)
        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS vector_store");
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
            jdbcTemplate.execute("CREATE TABLE vector_store (id uuid PRIMARY KEY, content text, metadata jsonb, embedding vector(384))");
            jdbcTemplate.execute("CREATE INDEX ON vector_store USING HNSW (embedding vector_cosine_ops)");
            log.info("Successfully dropped and recreated vector_store with 384 dimensions.");
        } catch (Exception e) {
            log.warn("Failed to recreate vector_store schema correctly.", e);
        }

        final int batchSize = 100;
        int pageNumber = 0;
        Page<Movie> page;

        do {
            page = movieRepository.findAll(PageRequest.of(pageNumber, batchSize));
            List<Movie> batch = page.getContent();

            if (batch.isEmpty()) {
                break; // Safety check
            }

            List<Document> documents = batch.stream()
                    .map(this::createDocumentFromMovie)
                    .collect(Collectors.toList());

            log.info("Sending batch {} (movies {} to {}) to Vertex AI for embedding...", 
                     pageNumber + 1, 
                     pageNumber * batchSize, 
                     (pageNumber * batchSize) + batch.size());
            
            vectorStore.add(documents);
            log.info("Batch {} embedded and saved to pgvector database successfully!", pageNumber + 1);

            pageNumber++;
        } while (page.hasNext());

        log.info("AI Vectorization backfill COMPLETE!");
    }

    private Document createDocumentFromMovie(Movie movie) {
        // The text content is what the AI will read to understand the movie
        String aiContent = String.format(
                "Title: %s\nYear: %s\nGenres: %s\nDirector: %s\nActors: %s\nPlot: %s",
                movie.getTitle(),
                movie.getYear(),
                movie.getGenre(),
                movie.getDirector(),
                movie.getActors(),
                movie.getPlot()
        );

        // Metadata is crucial so that when the AI finds this vector, we know WHICH movie it is!
        Map<String, Object> metadata = Map.of(
                "imdb_id", movie.getImdbId(),
                "title", movie.getTitle(),
                "year_val", movie.getYear() != null ? movie.getYear() : "N/A"
        );

        // Uses a UUID based on the IMDB string so it's deterministic and updates existing rows
        return new Document(
                java.util.UUID.nameUUIDFromBytes(movie.getImdbId().getBytes()).toString(),
                aiContent,
                metadata
        );
    }
}
