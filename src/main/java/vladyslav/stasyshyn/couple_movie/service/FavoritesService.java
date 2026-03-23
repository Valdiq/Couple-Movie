package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vladyslav.stasyshyn.couple_movie.dto.AddFavoriteResponse;
import vladyslav.stasyshyn.couple_movie.dto.FavoriteResponse;
import vladyslav.stasyshyn.couple_movie.dto.UpdateFavoriteRequest;
import vladyslav.stasyshyn.couple_movie.dto.UpdateFavoriteResponse;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.entity.UserFavorite;
import vladyslav.stasyshyn.couple_movie.exception.ResourceNotFoundException;
import vladyslav.stasyshyn.couple_movie.model.WatchStatus;
import vladyslav.stasyshyn.couple_movie.repository.UserFavoriteRepository;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoritesService {

    private final UserFavoriteRepository userFavoriteRepository;
    private final MovieRepository movieRepository;

    @Transactional(readOnly = true)
    public List<FavoriteResponse> getFavorites(User user) {
        return userFavoriteRepository.findByUserWithDetails(user.getId())
                .stream().map(FavoriteResponse::fromProjection).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getFavoriteIds(User user) {
        return userFavoriteRepository.findImdbIdsByUser(user);
    }

    @Transactional
    public AddFavoriteResponse addFavorite(User user, Map<String, String> request) {
        String imdbId = request.get("imdb_id");

        if (userFavoriteRepository.existsByUserAndImdbId(user, imdbId)) {
            return new AddFavoriteResponse(null, imdbId, null, null, "Already favorited");
        }

        Movie movie = movieRepository.findById(imdbId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        UserFavorite favorite = UserFavorite.builder()
                .user(user)
                .imdbId(imdbId)
                .title(Objects.toString(movie.getTitle(), ""))
                .poster(Objects.toString(movie.getPoster(), ""))
                .year(Objects.toString(movie.getYear(), ""))
                .genre(Objects.toString(movie.getGenre(), ""))
                .build();

        userFavoriteRepository.save(Objects.requireNonNull(favorite));

        return new AddFavoriteResponse(
                favorite.getId(),
                favorite.getImdbId(),
                favorite.getTitle(),
                favorite.getWatchStatus(),
                "Added to favorites");
    }

    @Transactional
    public UpdateFavoriteResponse updateFavorite(User user, String imdbId, UpdateFavoriteRequest request) {
        UserFavorite fav = userFavoriteRepository.findByUserAndImdbId(user, imdbId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite movie not found"));

        if (request.watchStatus() != null) {
            fav.setWatchStatus(WatchStatus.valueOf(request.watchStatus()));
        }

        if (request.userRating() != null) {
            fav.setUserRating(request.userRating());
        }

        userFavoriteRepository.save(Objects.requireNonNull(fav));

        return new UpdateFavoriteResponse(
                fav.getImdbId(),
                fav.getWatchStatus(),
                fav.getUserRating(),
                "Updated successfully");
    }

    @Transactional
    public void removeFavorite(User user, String imdbId) {
        userFavoriteRepository.deleteByUserAndImdbId(user, imdbId);
    }

    public Map<String, Object> checkFavorite(User user, String imdbId) {
        boolean isFavorite = userFavoriteRepository.existsByUserAndImdbId(user, imdbId);
        return Map.of("is_favorite", isFavorite);
    }
}
