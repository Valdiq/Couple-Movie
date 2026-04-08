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

        // 1. Perform semantic vector search - top 10 for richer context
        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.query(userMessage).withTopK(10)
        );

        List<String> imdbIds = documents.stream()
                .map(doc -> (String) doc.getMetadata().get("imdb_id"))
                .collect(Collectors.toList());

        List<Movie> contextMovies = movieRepository.findByImdbIdIn(imdbIds);

        // 2. Build the context payload with IMDb IDs and poster URLs for rich cards
        StringBuilder contextText = new StringBuilder();
        for (Movie m : contextMovies) {
            contextText.append("- IMDB_ID: ").append(m.getImdbId())
                    .append(" | Title: ").append(m.getTitle())
                    .append(" | Year: ").append(m.getYear())
                    .append(" | Genres: ").append(m.getGenre())
                    .append(" | Rating: ").append(m.getImdbRating())
                    .append(" | Plot: ").append(m.getPlot())
                    .append(" | Poster: ").append(m.getPoster() != null ? m.getPoster() : "N/A")
                    .append("\n");
        }

        if (contextText.isEmpty()) {
            contextText.append("No specific movies found in the database.");
        }

        // 3. System Prompt with formatting instructions
        String systemPrompt = """
                You are 'Movie Concierge', a friendly and enthusiastic AI movie assistant for CoupleMovie.
                You help users find movies and series from our database.
                
                CONTEXT MOVIES FROM DATABASE:
                ----------------
                %s
                ----------------
                
                FORMATTING RULES (YOU MUST FOLLOW THESE EXACTLY):
                1. When you mention a movie title, ALWAYS format it exactly like this: [Movie Title](movie://IMDB_ID)
                   Example: [Warcraft](movie://tt0803096)
                2. Use emoji to make your messages fun and engaging (🎬 🍿 ⭐ 🎭 🔥 💫 etc.)
                3. Use markdown formatting: **bold** for emphasis, bullet lists with -, line breaks between sections
                4. Keep responses concise but visually appealing
                5. Include the year and rating when mentioning a movie
                6. Recommend movies ONLY from the context above. Never invent titles.
                7. If nothing matches well, be honest and suggest trying different keywords.
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
