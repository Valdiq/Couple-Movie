package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;

import java.util.List;

@Repository
public interface MovieSearchRepository extends ElasticsearchRepository<MovieDocument, String> {

    @Query("{\"match\": {\"title\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\"}}}")
    List<MovieDocument> searchByTitleFuzzy(String title);

    List<MovieDocument> findByGenreContaining(String genre);

    List<MovieDocument> findByGenreMatches(String genreRegex);
}
