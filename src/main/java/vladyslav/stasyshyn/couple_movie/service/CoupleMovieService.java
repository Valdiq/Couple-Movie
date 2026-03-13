package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vladyslav.stasyshyn.couple_movie.repository.CoupleMovieRepository;
import vladyslav.stasyshyn.couple_movie.model.WatchStatus;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;
import vladyslav.stasyshyn.couple_movie.entity.CoupleMovie;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.dto.CoupleMovieResponse;
import vladyslav.stasyshyn.couple_movie.dto.GetStatusResponse;

import java.util.stream.Collectors;
import java.util.*;

import vladyslav.stasyshyn.couple_movie.dto.AddMovieResponse;
import vladyslav.stasyshyn.couple_movie.dto.UpdateMovieStatusResponse;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieResponse;
import vladyslav.stasyshyn.couple_movie.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class CoupleMovieService {

    private final CoupleMovieRepository coupleMovieRepository;
    private final MovieRepository movieRepository;

    private String getCoupleKey(User user) {
        if (user.getPartnerId() == null) {
            throw new IllegalStateException("You don't have a partner.");
        }
        return CoupleMovie.buildCoupleKey(user.getId(), user.getPartnerId());
    }

    @Transactional(readOnly = true)
    public List<CoupleMovieResponse> getSharedMovies(User user) {
        String coupleKey = getCoupleKey(user);
        var movies = coupleMovieRepository.findByCoupleKeyWithDetails(coupleKey, user.getId());

        return movies.stream().map(CoupleMovieResponse::fromProjection).collect(Collectors.toList());
    }

    @Transactional
    public AddMovieResponse addMovie(User user, Map<String, Object> movieData) {
        String coupleKey = getCoupleKey(user);
        String imdbId = movieData.get("imdb_id") != null ? String.valueOf(movieData.get("imdb_id")) : null;

        if (imdbId == null || imdbId.isBlank()) {
            throw new IllegalArgumentException("imdb_id is required");
        }

        var existing = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId);
        CoupleMovie movieToAdd;

        if (existing.isPresent()) {
            movieToAdd = existing.get();
            if (movieToAdd.getAddedByUserId().equals(user.getId())) {
                movieToAdd.setUserYouAdded(true);
            } else {
                movieToAdd.setPartnerAdded(true);
            }
        } else {
            Movie newMovieToAdd = movieRepository.findById(imdbId).orElse(null);

            movieToAdd = CoupleMovie.builder()
                    .coupleKey(coupleKey)
                    .imdbId(imdbId)
                    .title(newMovieToAdd != null && newMovieToAdd.getTitle() != null ? newMovieToAdd.getTitle() : "")
                    .poster(newMovieToAdd != null && newMovieToAdd.getPoster() != null ? newMovieToAdd.getPoster() : "")
                    .year(newMovieToAdd != null && newMovieToAdd.getYear() != null ? newMovieToAdd.getYear() : "")
                    .genre(newMovieToAdd != null && newMovieToAdd.getGenre() != null ? newMovieToAdd.getGenre() : "")
                    .addedByUserId(user.getId())
                    .userYouAdded(true)
                    .partnerAdded(false)
                    .user1Id(user.getId())
                    .build();
        }

        coupleMovieRepository.save(Objects.requireNonNull(movieToAdd));

        return new AddMovieResponse(
                movieToAdd.getId(),
                movieToAdd.getImdbId(),
                movieToAdd.getTitle(),
                "Added to shared favorites");
    }

    @Transactional
    public void removeMovie(User user, String imdbId) {
        String coupleKey = getCoupleKey(user);
        coupleMovieRepository.deleteByCoupleKeyAndImdbId(coupleKey, imdbId);
    }

    @Transactional
    public UpdateMovieStatusResponse updateMovieStatus(User user, String imdbId, Map<String, String> body) {
        WatchStatus watchStatus = WatchStatus.valueOf(body.getOrDefault("watch_status", "WATCHLIST"));
        String coupleKey = getCoupleKey(user);

        CoupleMovie movie = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found in shared list"));

        movie.setWatchStatus(watchStatus);
        coupleMovieRepository.save(movie);

        return new UpdateMovieStatusResponse(
                movie.getImdbId(),
                movie.getWatchStatus(),
                "Updated successfully");
    }

    @Transactional(readOnly = true)
    public GetStatusResponse getStats(User user) {
        String coupleKey = getCoupleKey(user);
        List<CoupleMovie> allMovies = coupleMovieRepository.findByCoupleKey(coupleKey);

        int matches = (int) allMovies.stream().filter(m -> m.isUserYouAdded() && m.isPartnerAdded()).count();
        int watchlist = (int) allMovies.stream().filter(m -> WatchStatus.WATCHLIST == m.getWatchStatus()).count();
        int watched = (int) allMovies.stream().filter(m -> WatchStatus.WATCHED == m.getWatchStatus()).count();

        return new GetStatusResponse(
                matches,
                watchlist,
                watched);
    }

    @Transactional
    public RateMovieResponse rateMovie(User user, String imdbId, Map<String, Object> body) {
        double rating = Double.parseDouble(String.valueOf(body.get("rating")));
        String coupleKey = getCoupleKey(user);

        CoupleMovie movie = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found in shared list"));

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

        coupleMovieRepository.save(movie);

        return new RateMovieResponse(
                movie.getImdbId(),
                rating,
                movie.getWatchStatus(),
                "Rated successfully");
    }

    @Transactional(readOnly = true)
    public boolean isAddedByUser(User user, String imdbId) {
        if (user.getPartnerId() == null) {
            return false;
        }

        String coupleKey = getCoupleKey(user);
        var opt = coupleMovieRepository.findByCoupleKeyAndImdbId(coupleKey, imdbId);
        if (opt.isEmpty()) {
            return false;
        }

        CoupleMovie movie = opt.get();
        return movie.getAddedByUserId() != null && movie.getAddedByUserId().equals(user.getId())
                ? movie.isUserYouAdded()
                : movie.isPartnerAdded();
    }
}
