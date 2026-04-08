package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@Slf4j
public class AiChatService {

    private final VectorStore vectorStore;
    private final MovieRepository movieRepository;
    private final ChatClient chatClient;

    public AiChatService(VectorStore vectorStore, MovieRepository movieRepository, ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.movieRepository = movieRepository;
        this.chatClient = chatClientBuilder.build();
    }

    public String generateChatResponse(String userMessage) {
        log.info("Processing AI Chat request: '{}'", userMessage);

        // 1. Perform a highly specific semantic vector search constraint
        // For context injection, we only want the absolute best ~5 matches.
        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.query(userMessage).withTopK(5)
        );

        List<String> imdbIds = documents.stream()
                .map(doc -> (String) doc.getMetadata().get("imdb_id"))
                .collect(Collectors.toList());

        List<Movie> contextMovies = movieRepository.findByImdbIdIn(imdbIds);

        // 2. Build the context payload
        StringBuilder contextText = new StringBuilder();
        for (Movie m : contextMovies) {
            contextText.append("Title: ").append(m.getTitle())
                    .append(" | Year: ").append(m.getYear())
                    .append(" | Genres: ").append(m.getGenre())
                    .append(" | Plot: ").append(m.getPlot()).append("\n");
        }

        if (contextText.isEmpty()) {
            contextText.append("No specific movies found in the database.");
        }

        // 3. System Prompt specifying constraints
        String systemPrompt = """
                You are 'Movie Concierge', a helpful AI assistant for CoupleMovie.
                You help users find movies specifically from the provided database context.
                
                CONTEXT MOVIES:
                ----------------
                %s
                ----------------
                
                Instructions:
                - Recommend movies ONLY from the context provided above.
                - If the user asks for something completely unrelated to the context, politely explain you couldn't find a matching movie.
                - Keep your answer friendly, concise, and engaging.
                """;

        String formattedSystemPrompt = String.format(systemPrompt, contextText.toString());

        // 4. Send to LLM
        return chatClient.prompt()
                .system(formattedSystemPrompt)
                .user(userMessage)
                .call()
                .content();
    }
}
