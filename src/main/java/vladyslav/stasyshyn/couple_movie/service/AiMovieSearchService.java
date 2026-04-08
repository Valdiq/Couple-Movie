package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.dto.SearchPageResponse;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class AiMovieSearchService {

    private final VectorStore vectorStore;
    private final MovieRepository movieRepository;

    /**
     * Searches for movies using AI semantic embeddings.
     * Takes a natural language query and returns movies that match conceptually.
     */
    public SearchPageResponse search(String query, int page, int size) {
        log.info("Performing AI semantic search for: '{}'", query);

        // Calculate the maximum number of results we might need across all pages up to this one
        int topK = (page + 1) * size;
        
        // Search the pgvector database for closest semantic matches
        // Similarity threshold could be tweaked depending on model behavior
        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.query(query).withTopK(topK)
        );

        // Extract Imdb Ids from the Document metadata
        List<String> imdbIds = documents.stream()
                .map(doc -> (String) doc.getMetadata().get("imdb_id"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (imdbIds.isEmpty()) {
            return new SearchPageResponse(List.of(), 0, page, size);
        }

        // Fetch movies from Postgres DB matching the extracted IDs
        List<Movie> allFoundMovies = movieRepository.findByImdbIdIn(imdbIds);

        // movieRepository.findByImdbIdIn returns unsorted results. We MUST map them back
        // to the exact order from `imdbIds` because that reflects the AI similarity score ranking!
        Map<String, Movie> movieMap = allFoundMovies.stream()
                .collect(Collectors.toMap(Movie::getImdbId, m -> m));

        List<Movie> orderedMovies = imdbIds.stream()
                .map(movieMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Handle generic manual pagination over the ordered list
        int start = Math.min(page * size, orderedMovies.size());
        int end = Math.min((page + 1) * size, orderedMovies.size());
        List<Movie> pageContent = orderedMovies.subList(start, end);

        // In a vector store without pre-calculating distance, total elements is ambiguous.
        // We'll return topK as total elements to mimic standard paged responses.
        return new SearchPageResponse(
                pageContent,
                documents.size(),
                page,
                size
        );
    }
}
