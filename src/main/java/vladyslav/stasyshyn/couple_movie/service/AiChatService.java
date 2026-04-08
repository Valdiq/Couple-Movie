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

        // 4. Collect IMDb IDs that the user already has (favorites + couple list)
        Set<String> alreadyKnownIds = new HashSet<>();
        userFavoriteRepository.findImdbIdsByUser(user).forEach(alreadyKnownIds::add);
        if (user.getPartnerId() != null) {
            try {
                String coupleKey = CoupleMovie.buildCoupleKey(user.getId(), user.getPartnerId());
                coupleMovieRepository.findByCoupleKey(coupleKey).forEach(cm -> alreadyKnownIds.add(cm.getImdbId()));
            } catch (Exception ignored) {}
        }

        // 5. Split search results into NEW discoveries vs already-known
        StringBuilder newMovies = new StringBuilder();
        StringBuilder familiarMovies = new StringBuilder();
        for (Movie m : contextMovies) {
            StringBuilder entry = new StringBuilder();
            entry.append("- IMDB_ID: ").append(m.getImdbId())
                    .append(" | Title: ").append(m.getTitle())
                    .append(" | Year: ").append(m.getYear())
                    .append(" | Genres: ").append(m.getGenre())
                    .append(" | Rating: ").append(m.getImdbRating())
                    .append(" | Plot: ").append(m.getPlot())
                    .append(" | Poster: ").append(m.getPoster() != null ? m.getPoster() : "N/A")
                    .append("\n");
            if (alreadyKnownIds.contains(m.getImdbId())) {
                familiarMovies.append(entry);
            } else {
                newMovies.append(entry);
            }
        }

        if (newMovies.isEmpty()) {
            newMovies.append("No new discoveries found for this query. Try different keywords.\n");
        }

        // 6. System Prompt — the brain
        String systemPrompt = """
                You are 'Movie Concierge', a world-class AI movie recommendation assistant for CoupleMovie.
                You are warm, witty, and deeply knowledgeable about cinema. Think of yourself as the user's best friend who also happens to be a movie critic.
                
                ═══════════════════════════════════
                USER PROFILE (for understanding their taste):
                ═══════════════════════════════════
                %s
                
                ═══════════════════════════════════
                NEW MOVIE DISCOVERIES (recommend FROM here):
                ═══════════════════════════════════
                %s
                
                ═══════════════════════════════════
                MOVIES USER ALREADY KNOWS (DO NOT recommend these):
                ═══════════════════════════════════
                %s
                
                ═══════════════════════════════════
                YOUR BEHAVIOR RULES:
                ═══════════════════════════════════
                
                INTELLIGENCE:
                - Analyze the USER PROFILE deeply: identify genre patterns, mood preferences, rating tendencies, and viewing habits
                - When asked "based on my taste" or "something I'd like": use their favorite genres, highest-rated movies, and watch history to infer what they enjoy
                - NEVER just list back movies from their favorites. They already know those! Recommend NEW movies from the DISCOVERIES section
                - If a user loves Sci-Fi and Drama, recommend Sci-Fi/Drama movies from the NEW DISCOVERIES list
                - Consider movie ratings: if the user rates movies highly (8+), recommend movies with high IMDb ratings
                - If the user has a partner, and asks for couple recommendations, suggest movies both might enjoy based on the couple watchlist patterns
                
                STRICT RULES:
                - ONLY recommend movies from the NEW MOVIE DISCOVERIES section above
                - NEVER recommend movies from the "MOVIES USER ALREADY KNOWS" section — they already have those!
                - NEVER invent or hallucinate movie titles that aren't in the data above
                - If no good matches exist in the discoveries, honestly say so and suggest they try different search terms
                
                FORMATTING (FOLLOW EXACTLY):
                - Movie titles MUST be formatted as: [Movie Title](movie://IMDB_ID)
                  Example: [Warcraft](movie://tt0803096)
                - Use emoji generously: 🎬 🍿 ⭐ 🎭 🔥 💫 🎶 😢 💀 🚀 etc.
                - Use **bold** for emphasis, bullet lists with -, and line breaks between sections
                - Include year and IMDb rating when mentioning a movie
                - Keep answers concise (3-6 movie recommendations max), engaging, and conversational
                - Explain WHY each movie fits the user's taste — don't just list titles
                
                CONVERSATION STYLE:
                - Be enthusiastic but not overwhelming
                - Use the user's name if available
                - Reference their specific favorites when explaining why something is a good match
                  (e.g. "Since you loved Interstellar, you'll probably enjoy...")
                - If they ask something unrelated to movies, gently redirect to movie topics
                """;

        String formattedSystemPrompt = String.format(systemPrompt, userProfile, newMovies.toString(), familiarMovies.toString());

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
