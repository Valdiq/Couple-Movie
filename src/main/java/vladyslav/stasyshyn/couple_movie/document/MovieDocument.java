package vladyslav.stasyshyn.couple_movie.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Builder
@Document(indexName = "movies")
public class MovieDocument {

    @Id
    private String imdbID;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Keyword)
    private String year;

    @Field(type = FieldType.Keyword)
    private String type;

    @Field(type = FieldType.Keyword)
    private String poster;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String genre;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String director;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String plot;

    @Field(type = FieldType.Double)
    private Double imdbRating;
}
