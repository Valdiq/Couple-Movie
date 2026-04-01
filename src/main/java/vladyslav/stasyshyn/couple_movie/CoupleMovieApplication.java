package vladyslav.stasyshyn.couple_movie;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class CoupleMovieApplication {
	public static void main(String[] args) {
		SpringApplication.run(CoupleMovieApplication.class, args);
	}
}