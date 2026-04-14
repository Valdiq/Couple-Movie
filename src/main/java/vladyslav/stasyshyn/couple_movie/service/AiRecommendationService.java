package vladyslav.stasyshyn.couple_movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import vladyslav.stasyshyn.couple_movie.dto.RecommendationResponse;
import vladyslav.stasyshyn.couple_movie.dto.RecommendationResponse.RecommendationGroup;
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
public class AiRecommendationService {

    private final VectorStore vectorStore;
    private final MovieRepository movieRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final CoupleMovieRepository coupleMovieRepository;

    public AiRecommendationService(VectorStore vectorStore,
                                   MovieRepository movieRepository,
                                   UserFavoriteRepository userFavoriteRepository,
                                   CoupleMovieRepository coupleMovieRepository) {
        this.vectorStore = vectorStore;
        this.movieRepository = movieRepository;
        this.userFavoriteRepository = userFavoriteRepository;
        this.coupleMovieRepository = coupleMovieRepository;
    }

    @Cacheable(value = "recommendations", key = "#user.id")
    public RecommendationResponse getRecommendations(User user) {
        log.info("Generating AI recommendations for user '{}' (ID: {})", user.getEmail(), user.getId());

        List<UserFavorite> favorites = userFavoriteRepository.findByUser(user);
        List<CoupleMovie> coupleMovies = getCoupleMovies(user);

        Set<String> knownImdbIds = new HashSet<>();
        favorites.forEach(f -> knownImdbIds.add(f.getImdbId()));
        coupleMovies.forEach(cm -> knownImdbIds.add(cm.getImdbId()));

        int totalKnown = knownImdbIds.size();
        if (totalKnown < 3) {
            return new RecommendationResponse(List.of(),
                    "Add at least 3 movies to your favorites or couple list to get personalized recommendations.");
        }

        List<String> seedImdbIds = pickSeedMovies(favorites, coupleMovies, 3);
        List<Movie> seedMovies = movieRepository.findByImdbIdIn(seedImdbIds);

        if (seedMovies.isEmpty()) {
            return new RecommendationResponse(List.of(), "Unable to analyze your taste profile. Try adding more movies.");
        }

        List<RecommendationGroup> groups = new ArrayList<>();
        Set<String> alreadyRecommendedIds = new HashSet<>();

        for (Movie seed : seedMovies) {
            String queryText = buildQueryForSeed(seed);
            List<Document> documents = vectorStore.similaritySearch(
                    SearchRequest.query(queryText).withTopK(50)
            );

            List<String> foundImdbIds = documents.stream()
                    .map(doc -> (String) doc.getMetadata().get("imdb_id"))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<Movie> validFoundMovies = movieRepository.findByImdbIdIn(foundImdbIds);
            Map<String, Movie> movieMap = validFoundMovies.stream()
                    .collect(Collectors.toMap(Movie::getImdbId, m -> m, (a, b) -> a));

            List<Movie> candidates = new ArrayList<>();
            for (String id : foundImdbIds) {
                if (!knownImdbIds.contains(id) && !alreadyRecommendedIds.contains(id) && movieMap.containsKey(id)) {
                    candidates.add(movieMap.get(id));
                }
            }

            candidates.sort((m1, m2) -> {
                double r1 = m1.getImdbRating() != null ? m1.getImdbRating() : 0.0;
                double r2 = m2.getImdbRating() != null ? m2.getImdbRating() : 0.0;
                return Double.compare(r2, r1);
            });

            List<Movie> top4 = candidates.stream().limit(4).collect(Collectors.toList());
            if (!top4.isEmpty()) {
                groups.add(new RecommendationGroup("Because you loved " + seed.getTitle(), top4));
                top4.forEach(m -> alreadyRecommendedIds.add(m.getImdbId()));
            }
        }

        if (groups.isEmpty()) {
             return new RecommendationResponse(List.of(), "You've already discovered all similar movies! Try branching out.");
        }

        return new RecommendationResponse(groups, null);
    }

    private List<String> pickSeedMovies(List<UserFavorite> favorites, List<CoupleMovie> coupleMovies, int maxSeeds) {
        List<UserFavorite> rated = favorites.stream()
                .filter(f -> f.getUserRating() != null && f.getUserRating() > 0)
                .sorted(Comparator.comparingDouble(UserFavorite::getUserRating).reversed())
                .collect(Collectors.toList());

        List<String> seedIds = new ArrayList<>();
        for (UserFavorite f : rated) {
            if (seedIds.size() >= maxSeeds) break;
            seedIds.add(f.getImdbId());
        }

        if (seedIds.size() < maxSeeds) {
            List<UserFavorite> recent = favorites.stream()
                    .sorted(Comparator.comparing(UserFavorite::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());
            for (UserFavorite f : recent) {
                if (seedIds.size() >= maxSeeds) break;
                if (!seedIds.contains(f.getImdbId())) seedIds.add(f.getImdbId());
            }
        }

        if (seedIds.size() < maxSeeds) {
            for (CoupleMovie cm : coupleMovies) {
                if (seedIds.size() >= maxSeeds) break;
                if (!seedIds.contains(cm.getImdbId())) seedIds.add(cm.getImdbId());
            }
        }

        return seedIds;
    }

    private String buildQueryForSeed(Movie movie) {
        StringBuilder query = new StringBuilder();
        if (movie.getGenre() != null && !movie.getGenre().equalsIgnoreCase("N/A")) {
            query.append(movie.getGenre().replace(",", " ")).append(" ");
        }
        if (movie.getPlot() != null && !movie.getPlot().equalsIgnoreCase("N/A")) {
            String plot = movie.getPlot();
            if (plot.length() > 200) {
                plot = plot.substring(0, 200);
            }
            query.append(plot).append(" ");
        }
        if (movie.getDirector() != null && !movie.getDirector().equalsIgnoreCase("N/A")) {
            query.append(movie.getDirector()).append(" ");
        }
        if (movie.getActors() != null && !movie.getActors().equalsIgnoreCase("N/A")) {
            query.append(movie.getActors()).append(" ");
        }
        return query.toString().trim();
    }

    private List<CoupleMovie> getCoupleMovies(User user) {
        if (user.getPartnerId() == null) return List.of();
        try {
            String coupleKey = CoupleMovie.buildCoupleKey(user.getId(), user.getPartnerId());
            return coupleMovieRepository.findByCoupleKey(coupleKey);
        } catch (Exception e) {
            return List.of();
        }
    }
}
