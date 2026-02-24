package vladyslav.stasyshyn.couple_movie.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "couple_movies", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "couple_key", "imdb_id" })
})
public class CoupleMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * A normalized key representing the couple. Always "min_id:max_id" for
     * consistency.
     */
    @Column(name = "couple_key", nullable = false)
    private String coupleKey;

    @Column(name = "imdb_id", nullable = false)
    private String imdbId;

    @Column(name = "title")
    private String title;

    @Column(name = "poster", length = 1000)
    private String poster;

    @Column(name = "year_val")
    private String year;

    @Column(name = "genre")
    private String genre;

    @Column(name = "added_by_user_id")
    private Long addedByUserId;

    @Column(name = "watch_status")
    @Builder.Default
    private String watchStatus = "WATCHLIST";

    @Column(name = "user_you_added")
    @Builder.Default
    private boolean userYouAdded = false;

    @Column(name = "partner_added")
    @Builder.Default
    private boolean partnerAdded = false;

    @Column(name = "user1_id")
    private Long user1Id;

    @Column(name = "user1_rating")
    private Double user1Rating;

    @Column(name = "user2_id")
    private Long user2Id;

    @Column(name = "user2_rating")
    private Double user2Rating;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Create a normalized couple key from two user IDs.
     */
    public static String buildCoupleKey(Long userId1, Long userId2) {
        long min = Math.min(userId1, userId2);
        long max = Math.max(userId1, userId2);
        return min + ":" + max;
    }
}
