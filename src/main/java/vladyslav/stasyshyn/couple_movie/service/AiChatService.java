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
import vladyslav.stasyshyn.couple_movie.repository.UserRepository;

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
    private final UserRepository userRepository;
    private final ChatClient chatClient;

    public AiChatService(VectorStore vectorStore,
                         MovieRepository movieRepository,
                         UserFavoriteRepository userFavoriteRepository,
                         CoupleMovieRepository coupleMovieRepository,
                         UserRepository userRepository,
                         ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.movieRepository = movieRepository;
        this.userFavoriteRepository = userFavoriteRepository;
        this.coupleMovieRepository = coupleMovieRepository;
        this.userRepository = userRepository;
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
                You are 'Movie Concierge', a world-class AI cinematic expert and friendly companion for the CoupleMovie app.
                You are warm, witty, highly expressive, and deeply knowledgeable about the art of cinema. Imagine you are grabbing coffee with the user and discussing films with sheer passion.
                
                ═══════════════════════════════════
                USER PROFILE (for understanding exactly what they love):
                ═══════════════════════════════════
                %s
                
                ═══════════════════════════════════
                NEW MOVIE DISCOVERIES (your pool of recommendations):
                ═══════════════════════════════════
                %s
                
                ═══════════════════════════════════
                MOVIES USER ALREADY KNOWS (DO NOT recommend these to them):
                ═══════════════════════════════════
                %s
                
                ═══════════════════════════════════
                YOUR BEHAVIOR RULES (FOLLOW STRICTLY):
                ═══════════════════════════════════
                
                1. INTELLIGENCE & SYNERGY:
                - Analyze the USER PROFILE deeply. Look at their "Masterpieces" (high-rated movies) to understand what perfection looks like to them.
                - Look at their "Recent Obsessions" to see what mood they are currently in.
                - If they have a partner, explicitly acknowledge the partner by name in your logic. Look at their Couple Watchlist and find a bridging recommendation that satisfies both of their vibes.
                - NEVER just spit back their favorite movies. You must use their favorites ONLY as justification for NEW DISCOVERIES.
                
                2. CHAIN-OF-THOUGHT REASONING:
                - Always begin your response by briefly "thinking out loud" about why you are picking these movies based on their profile.
                - Example: "Seeing how much you adored the visual scale of Interstellar, and knowing you both recently agreed on matching Dune, I'm digging into some truly atmospheric Sci-Fi for you..."
                
                3. STRICT FILTERING:
                - ONLY recommend movies from the "NEW MOVIE DISCOVERIES" section.
                - NEVER recommend movies from the "MOVIES USER ALREADY KNOWS" section.
                - NEVER hallucinate titles not present in your discovery pool. If there isn't a good match, tell them playfully that they've exhausted this niche and suggest a pivot.
                
                4. FORMATTING:
                - You MUST use this exact hyperlink format for movie titles: [Movie Title](movie://IMDB_ID)
                  Example: [Blade Runner 2049](movie://tt1856101)
                - Use emojis generously to set the mood (🎬🍿✨🌙🔥🧠).
                - Use **bold** for emphasis, bullet lists, and clean paragraph breaks.
                - Include the year and a brief, captivating pitch describing WHY it fits them (not just a generic plot summary).
                
                5. CONVERSATIONAL CLOSURE:
                - End your message by actively asking a follow-up question to keep the chat rolling.
                - Example: "Are you feeling something more fast-paced tonight, or do you want to sink into a slow burn?"
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
        String currentUserName = user.getFirstName() != null ? user.getFirstName() : "User";
        profile.append("Name: ").append(currentUserName).append("\n");

        // --- Favorites ---
        List<UserFavorite> favorites = userFavoriteRepository.findByUser(user);
        if (!favorites.isEmpty()) {
            profile.append("\nFAVORITE MOVIES (").append(favorites.size()).append(" total):\n");

            // Split into Masterpieces (Rated >= 4.5) and Recent Obsessions
            List<UserFavorite> masterpieces = favorites.stream()
                    .filter(f -> f.getUserRating() != null && f.getUserRating() >= 4.5)
                    .limit(10)
                    .collect(Collectors.toList());

            if (!masterpieces.isEmpty()) {
                profile.append("\n⭐ USER'S ALL-TIME MASTERPIECES (Core taste anchors):\n");
                masterpieces.forEach(fav -> {
                    profile.append("  - ").append(fav.getTitle() != null ? fav.getTitle() : "Unknown");
                    profile.append(" [Rating: ").append(fav.getUserRating()).append("/5.0] ");
                    if (fav.getGenre() != null) profile.append(" Genres: ").append(fav.getGenre());
                    profile.append("\n");
                });
            }

            // Recent Obsessions (sort by ID descending, representing newest additions)
            List<UserFavorite> recents = favorites.stream()
                    .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                    .limit(10)
                    .collect(Collectors.toList());

            profile.append("\n🔥 RECENT OBSESSIONS (Currently into):\n");
            recents.forEach(fav -> {
                profile.append("  - ").append(fav.getTitle() != null ? fav.getTitle() : "Unknown");
                if (fav.getGenre() != null) profile.append(" Genres: ").append(fav.getGenre());
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
            String partnerName = "Partner";
            try {
                User partnerOpt = userRepository.findById(user.getPartnerId()).orElse(null);
                if (partnerOpt != null && partnerOpt.getFirstName() != null) {
                    partnerName = partnerOpt.getFirstName();
                }
            } catch (Exception ignored) {}

            profile.append("\nHAS PARTNER OR IS IN A COUPLE SPACE: Yes\n");
            profile.append("PARTNER NAME: ").append(partnerName).append("\n");
            
            final String finalPartnerName = partnerName;
            try {
                String coupleKey = CoupleMovie.buildCoupleKey(user.getId(), user.getPartnerId());
                List<CoupleMovie> coupleMovies = coupleMovieRepository.findByCoupleKey(coupleKey);

                if (!coupleMovies.isEmpty()) {
                    long matches = coupleMovies.stream()
                            .filter(m -> m.isUserYouAdded() && m.isPartnerAdded())
                            .count();

                    profile.append("COUPLE WATCHLIST (").append(coupleMovies.size()).append(" movies, ")
                            .append(matches).append(" mutual matches):\n");

                    coupleMovies.stream().limit(15).forEach(cm -> {
                        profile.append("  - ").append(cm.getTitle() != null ? cm.getTitle() : "Unknown");
                        if (cm.isUserYouAdded() && cm.isPartnerAdded()) {
                            profile.append(" ❤️ MATCH (Both ").append(currentUserName).append(" and ").append(finalPartnerName).append(" want to watch this)");
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
            profile.append("\nHAS PARTNER OR IS IN A COUPLE SPACE: No\n");
        }

        return profile.toString();
    }
}
