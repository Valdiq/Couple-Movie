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
import java.util.ArrayList;
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

        // Fetch a large pool of contextual matches (e.g., top 150) to allow sorting by popularity
        int poolSize = 150;
        
        List<Document> documents = vectorStore.similaritySearch(
                // You can tweak similarityThreshold in the request if you want "strict" matching
                SearchRequest.query(query).withTopK(poolSize).withSimilarityThreshold(0.70)
        );

        List<String> imdbIds = documents.stream()
                .map(doc -> (String) doc.getMetadata().get("imdb_id"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (imdbIds.isEmpty()) {
            return new SearchPageResponse(List.of(), 0, page, size);
        }

        List<Movie> allFoundMovies = movieRepository.findByImdbIdIn(imdbIds);

        // Sorting algorithm: 
        // We want highly relevant (early in the AI list) AND highly popular movies to bubble up.
        // The original `imdbIds` list is already sorted purely by AI Semantic distance.
        // We can create a hybrid score: Position penalty + Popularity bonus.
        
        Map<String, Movie> movieMap = allFoundMovies.stream()
                .collect(Collectors.toMap(Movie::getImdbId, m -> m));

        List<Movie> validMovies = new ArrayList<>();
        for (String id : imdbIds) {
            if (movieMap.containsKey(id)) {
                validMovies.add(movieMap.get(id));
            }
        }

        // Sort by hybrid score:
        // Position natively gives lower index = better relevance.
        // We can sort them to prioritize movies with substantial votes (e.g. >10,000) that are also semantically relevant.
        validMovies.sort((m1, m2) -> {
            long votes1 = parseVotes(m1.getImdbVotes());
            long votes2 = parseVotes(m2.getImdbVotes());
            
            // To favor very popular movies within the semantically valid pool
            return Long.compare(votes2, votes1); 
        });

        int start = Math.min(page * size, validMovies.size());
        int end = Math.min((page + 1) * size, validMovies.size());
        List<Movie> pageContent = validMovies.subList(start, end);

        return new SearchPageResponse(
                pageContent,
                validMovies.size(),
                page,
                size
        );
    }

    private long parseVotes(String votesStr) {
        if (votesStr == null || votesStr.equalsIgnoreCase("N/A") || votesStr.isEmpty()) return 0L;
        try {
            return Long.parseLong(votesStr.replace(",", ""));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
