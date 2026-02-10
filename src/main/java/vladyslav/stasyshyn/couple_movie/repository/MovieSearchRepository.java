package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.document.MovieDocument;

import java.util.List;

@Repository
public interface MovieSearchRepository extends ElasticsearchRepository<MovieDocument, String> {
    List<MovieDocument> findByTitleContaining(String title);

    List<MovieDocument> findByPlotContaining(String plot);
}
