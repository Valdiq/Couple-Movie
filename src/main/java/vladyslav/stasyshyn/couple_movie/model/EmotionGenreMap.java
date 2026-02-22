package vladyslav.stasyshyn.couple_movie.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "emotion_genre_map")
public class EmotionGenreMap {

    @Id
    private String id;

    private String emotion;

    private List<String> genres;
}
