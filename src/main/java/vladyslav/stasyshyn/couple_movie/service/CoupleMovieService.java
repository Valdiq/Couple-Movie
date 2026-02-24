package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vladyslav.stasyshyn.couple_movie.model.CoupleMovie;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.repository.CoupleMovieRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoupleMovieService {

    private final CoupleMovieRepository coupleMovieRepository;

    private String getCoupleKey(User user) {
        if (user.getPartnerId() == null) {
            throw new IllegalStateException("You don't have a partner.");
        }
        return CoupleMovie.buildCoupleKey(user.getId(), user.getPartnerId());
    }

    public List<Map<String, Object>> getSharedMovies(User user) {
        String coupleKey = getCoupleKey(user);
        List<CoupleMovie> movies = coupleMovieRepository.findByCoupleKey(coupleKey);

        return movies.stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("imdb_id", m.getImdbId());
            map.put("title", m.getTitle());
            map.put("poster", m.getPoster());
            map.put("year", m.getYear());
            map.put("genre", m.getGenre());
            map.put("watch_status", m.getWatchStatus());
            map.put("added_by_user_id", m.getAddedByUserId());
            boolean isAdder = m.getAddedByUserId() != null && m.getAddedByUserId().equals(user.getId());
            map.put("user_you_added", isAdder ? m.isUserYouAdded() : m.isPartnerAdded());
            map.put("partner_added", isAdder ? m.isPartnerAdded() : m.isUserYouAdded());
            map.put("is_match", isMatch(coupleKey, m.getImdbId(), user));
            // Per-user ratings: figure out which slot is "you" and which is "partner"
            if (m.getUser1Id() != null && m.getUser1Id().equals(user.getId())) {
                map.put("your_rating", m.getUser1Rating());
                map.put("partner_rating", m.getUser2Rating());
            } else {
                map.put("your_rating", m.getUser2Rating());
                map.put("partner_rating", m.getUser1Rating());
            }
            map.put("created_at", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * A movie is a "match" if both users have added it (via their individual
     * favorites)
     * For simplicity, we track match status by checking if the CoupleMovie was
     * already present
     * when the second partner adds it.
     */
    private boolean isMatch(String coupleKey, String imdbId, User user) {
        // We treat movies added by different people as matches
        var opt = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId);
        return opt.map(cm -> cm.isUserYouAdded() && cm.isPartnerAdded()).orElse(false);
    }

    @Transactional
    public Map<String, Object> addMovie(User user, Map<String, String> movieData) {
        String coupleKey = getCoupleKey(user);
        String imdbId = movieData.get("imdb_id");

        if (imdbId == null || imdbId.isBlank()) {
            throw new IllegalArgumentException("imdb_id is required");
        }

        var existing = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId);
        CoupleMovie movie;

        if (existing.isPresent()) {
            movie = existing.get();
            // Mark the current user as having added it too
            if (movie.getAddedByUserId().equals(user.getId())) {
                movie.setUserYouAdded(true);
            } else {
                movie.setPartnerAdded(true);
            }
            // If both added, it's a match
            coupleMovieRepository.save(movie);
        } else {
            movie = CoupleMovie.builder()
                    .coupleKey(coupleKey)
                    .imdbId(imdbId)
                    .title(movieData.getOrDefault("title", ""))
                    .poster(movieData.getOrDefault("poster", ""))
                    .year(movieData.getOrDefault("year", ""))
                    .genre(movieData.getOrDefault("genre", ""))
                    .addedByUserId(user.getId())
                    .userYouAdded(true)
                    .partnerAdded(false)
                    .user1Id(user.getId())
                    .build();
            coupleMovieRepository.save(movie);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", movie.getId());
        result.put("imdb_id", movie.getImdbId());
        result.put("title", movie.getTitle());
        result.put("message", "Added to shared favorites");
        return result;
    }

    @Transactional
    public void removeMovie(User user, String imdbId) {
        String coupleKey = getCoupleKey(user);
        coupleMovieRepository.deleteByCoupleKeyAndImdbId(coupleKey, imdbId);
    }

    @Transactional
    public Map<String, Object> updateMovieStatus(User user, String imdbId, String watchStatus) {
        String coupleKey = getCoupleKey(user);
        var opt = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Movie not found in shared list");
        }
        CoupleMovie movie = opt.get();
        movie.setWatchStatus(watchStatus);
        coupleMovieRepository.save(movie);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("imdb_id", movie.getImdbId());
        result.put("watch_status", movie.getWatchStatus());
        result.put("message", "Updated successfully");
        return result;
    }

    public Map<String, Object> getStats(User user) {
        String coupleKey = getCoupleKey(user);
        List<CoupleMovie> all = coupleMovieRepository.findByCoupleKey(coupleKey);

        long matches = all.stream().filter(m -> m.isUserYouAdded() && m.isPartnerAdded()).count();
        long watchlist = all.stream().filter(m -> "WATCHLIST".equals(m.getWatchStatus())).count();
        long watched = all.stream().filter(m -> "WATCHED".equals(m.getWatchStatus())).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("matches", matches);
        stats.put("watchlist", watchlist);
        stats.put("watched", watched);
        return stats;
    }

    @Transactional
    public Map<String, Object> rateMovie(User user, String imdbId, double rating) {
        if (rating < 0.5 || rating > 5.0) {
            throw new IllegalArgumentException("Rating must be between 0.5 and 5");
        }
        String coupleKey = getCoupleKey(user);
        var opt = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Movie not found in shared list");
        }
        CoupleMovie movie = opt.get();

        // Store rating in the correct user slot
        if (movie.getUser1Id() != null && movie.getUser1Id().equals(user.getId())) {
            movie.setUser1Rating(rating);
        } else if (movie.getUser2Id() != null && movie.getUser2Id().equals(user.getId())) {
            movie.setUser2Rating(rating);
        } else if (movie.getUser1Id() == null) {
            movie.setUser1Id(user.getId());
            movie.setUser1Rating(rating);
        } else {
            movie.setUser2Id(user.getId());
            movie.setUser2Rating(rating);
        }

        // Auto-mark as watched when rated
        movie.setWatchStatus("WATCHED");
        coupleMovieRepository.save(movie);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("imdb_id", movie.getImdbId());
        result.put("your_rating", rating);
        result.put("watch_status", movie.getWatchStatus());
        result.put("message", "Rated successfully");
        return result;
    }
}
