package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class AiVectorizationService {

    private final VectorStore vectorStore;
    private final MovieRepository movieRepository;

    /**
     * This will iterate over all movies in the database, convert them into AI Documents,
     * and save them to the pgvector database.
     * WARNING: This should only be run ONCE to backfill the database.
     */
    public void backfillDatabaseWithEmbeddings() {
        log.info("Starting AI Vectorization backfill...");

        List<Movie> allMovies = movieRepository.findAll();
        log.info("Found {} movies to vectorize.", allMovies.size());

        // We process in batches of 100 to avoid memory issues and API rate limits
        final int batchSize = 100;
        for (int i = 0; i < allMovies.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, allMovies.size());
            List<Movie> batch = allMovies.subList(i, endIndex);

            List<Document> documents = batch.stream()
                    .map(this::createDocumentFromMovie)
                    .collect(Collectors.toList());

            log.info("Sending batch {} to {} to Vertex AI for embedding...", i, endIndex);
            vectorStore.add(documents);
            log.info("Batch embedded and saved to pgvector database successfully!");
        }

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
