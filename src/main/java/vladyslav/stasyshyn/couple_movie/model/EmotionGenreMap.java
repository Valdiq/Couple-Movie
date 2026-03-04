package vladyslav.stasyshyn.couple_movie.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "emotion_genre_maps")
public class EmotionGenreMap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String emotion;

    @ElementCollection
    @CollectionTable(name = "emotion_genres", joinColumns = @JoinColumn(name = "emotion_genre_map_id"))
    @Column(name = "genre")
    private List<String> genres;
}
