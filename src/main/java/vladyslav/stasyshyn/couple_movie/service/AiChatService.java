package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.entity.CoupleMovie;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.entity.UserFavorite;
import vladyslav.stasyshyn.couple_movie.repository.CoupleMovieRepository;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;
import vladyslav.stasyshyn.couple_movie.repository.UserFavoriteRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true", matchIfMissing = false)
@Slf4j
public class AiChatService {

    private final VectorStore vectorStore;
    private final MovieRepository movieRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final CoupleMovieRepository coupleMovieRepository;
    private final ChatClient chatClient;

    public AiChatService(VectorStore vectorStore,
                         MovieRepository movieRepository,
                         UserFavoriteRepository userFavoriteRepository,
                         CoupleMovieRepository coupleMovieRepository,
                         ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.movieRepository = movieRepository;
        this.userFavoriteRepository = userFavoriteRepository;
        this.coupleMovieRepository = coupleMovieRepository;
        this.chatClient = chatClientBuilder.build();
    }

    public String generateChatResponse(String userMessage, User user) {
        log.info("Processing AI Chat request from user '{}': '{}'", user.getEmail(), userMessage);

        // 1. Perform semantic vector search - top 10 for richer context
        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.query(userMessage).withTopK(10)
        );

        List<String> imdbIds = documents.stream()
                .map(doc -> (String) doc.getMetadata().get("imdb_id"))
                .collect(Collectors.toList());

        List<Movie> contextMovies = movieRepository.findByImdbIdIn(imdbIds);

        // 2. Build the RAG context payload
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
            contextText.append("No specific movies found in the database for this query.");
        }

        // 3. Build user profile context
        String userProfile = buildUserProfile(user);

        // 4. System Prompt with personal context + formatting rules
        String systemPrompt = """
                You are 'Movie Concierge', a friendly and enthusiastic AI movie assistant for CoupleMovie.
                You help users find movies and series from our database, personalized to their taste.
                
                USER PROFILE:
                ----------------
                %s
                ----------------
                
                SEARCH RESULTS FROM DATABASE:
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
                6. Recommend movies ONLY from the SEARCH RESULTS or USER PROFILE data above. Never invent titles.
                7. If the user asks for personal recommendations (e.g. "based on my taste", "similar to my favorites"), use their USER PROFILE to understand their preferences, then recommend from SEARCH RESULTS.
                8. If the user asks about their couple/partner watchlist, reference the COUPLE WATCHLIST from USER PROFILE.
                9. If nothing matches well, be honest and suggest trying different keywords.
                """;

        String formattedSystemPrompt = String.format(systemPrompt, userProfile, contextText.toString());

        // 5. Send to LLM
        return chatClient.prompt()
                .system(formattedSystemPrompt)
                .user(userMessage)
                .call()
                .content();
    }

    private String buildUserProfile(User user) {
        StringBuilder profile = new StringBuilder();
        profile.append("Name: ").append(user.getFirstName() != null ? user.getFirstName() : "User").append("\n");

        // --- Favorites ---
        List<UserFavorite> favorites = userFavoriteRepository.findByUser(user);
        if (!favorites.isEmpty()) {
            profile.append("\nFAVORITE MOVIES (").append(favorites.size()).append(" total):\n");

            // Show up to 20 most recent favorites with details
            favorites.stream().limit(20).forEach(fav -> {
                profile.append("  - ").append(fav.getTitle() != null ? fav.getTitle() : "Unknown");
                if (fav.getImdbId() != null) profile.append(" (IMDB_ID: ").append(fav.getImdbId()).append(")");
                if (fav.getYear() != null) profile.append(" [").append(fav.getYear()).append("]");
                if (fav.getGenre() != null) profile.append(" Genres: ").append(fav.getGenre());
                if (fav.getUserRating() != null) profile.append(" | User Rating: ").append(fav.getUserRating());
                if (fav.getWatchStatus() != null) profile.append(" | Status: ").append(fav.getWatchStatus());
                profile.append("\n");
            });

            // Analyze genre preferences
            Map<String, Long> genreCounts = favorites.stream()
                    .filter(f -> f.getGenre() != null)
                    .flatMap(f -> Arrays.stream(f.getGenre().split(",")))
                    .map(String::trim)
                    .filter(g -> !g.isEmpty())
                    .collect(Collectors.groupingBy(g -> g, Collectors.counting()));

            if (!genreCounts.isEmpty()) {
                profile.append("\nFAVORITE GENRES (ranked): ");
                genreCounts.entrySet().stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(5)
                        .forEach(e -> profile.append(e.getKey()).append(" (").append(e.getValue()).append("), "));
                profile.append("\n");
            }
        } else {
            profile.append("\nFAVORITE MOVIES: None yet\n");
        }

        // --- Couple watchlist ---
        if (user.getPartnerId() != null) {
            profile.append("\nHAS PARTNER: Yes\n");
            try {
                String coupleKey = CoupleMovie.buildCoupleKey(user.getId(), user.getPartnerId());
                List<CoupleMovie> coupleMovies = coupleMovieRepository.findByCoupleKey(coupleKey);

                if (!coupleMovies.isEmpty()) {
                    long matches = coupleMovies.stream()
                            .filter(m -> m.isUserYouAdded() && m.isPartnerAdded())
                            .count();

                    profile.append("COUPLE WATCHLIST (").append(coupleMovies.size()).append(" movies, ")
                            .append(matches).append(" matches):\n");

                    coupleMovies.stream().limit(15).forEach(cm -> {
                        profile.append("  - ").append(cm.getTitle() != null ? cm.getTitle() : "Unknown");
                        if (cm.getImdbId() != null) profile.append(" (IMDB_ID: ").append(cm.getImdbId()).append(")");
                        if (cm.isUserYouAdded() && cm.isPartnerAdded()) {
                            profile.append(" ❤️ MATCH");
                        }
                        profile.append("\n");
                    });
                } else {
                    profile.append("COUPLE WATCHLIST: Empty\n");
                }
            } catch (Exception e) {
                profile.append("COUPLE WATCHLIST: Unable to load\n");
            }
        } else {
            profile.append("\nHAS PARTNER: No\n");
        }

        return profile.toString();
    }
}
