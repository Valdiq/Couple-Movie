package vladyslav.stasyshyn.couple_movie;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
import jakarta.servlet.http.Cookie;
import vladyslav.stasyshyn.couple_movie.dto.RegisterRequest;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.repository.MovieRepository;
import vladyslav.stasyshyn.couple_movie.service.EmailService;
import vladyslav.stasyshyn.couple_movie.service.MovieSearchService;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Objects;

import vladyslav.stasyshyn.couple_movie.service.OmdbService;

@SpringBootTest(properties = {
        "DATASOURCE_URL=jdbc:postgresql://localhost:5433/couple_movie_test",
        "DATASOURCE_USERNAME=test",
        "DATASOURCE_PASSWORD=test",
        "MAIL_USERNAME=test",
        "MAIL_PASSWORD=test",
        "GOOGLE_CLIENT_ID=test",
        "GOOGLE_CLIENT_SECRET=test",
        "MEILISEARCH_URL=http://localhost:7700",
        "MEILISEARCH_API_KEY=testApiKey",
        "JWT_SECRET=1234567890123456789012345678901212345678901234567890123456789012",
        "JWT_EXPIRATION_MS=604800000",
        "OMDB_API_KEY=testApiKey",
        "OMDB_URL=http://www.omdbapi.com/",
        "TMDB_API_KEY=testApiKey",
        "AI_API_KEY=testApiKey"
})
@Testcontainers
@AutoConfigureMockMvc
class CoupleMovieApplicationTests {

    @MockBean
    private MovieSearchService movieSearchService;

    @MockBean
    private OmdbService omdbService;

    @MockBean
    private EmailService emailService;

    @Autowired
    private MovieRepository movieRepository;

    @BeforeEach
    void setUpMovies() {
        if (movieRepository.findById("tt1375666").isEmpty()) {
            movieRepository.save(Movie.builder()
                    .imdbId("tt1375666")
                    .title("Inception")
                    .build());
        }
        if (movieRepository.findById("tt0816692").isEmpty()) {
            movieRepository.save(Movie.builder()
                    .imdbId("tt0816692")
                    .title("Interstellar")
                    .build());
        }
    }

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("couple_movie_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
        Assertions.assertTrue(postgres.isRunning());
    }

    @Test
    void testAuthenticationController() throws Exception {
        String email = "auth_test@example.com";
        String password = "password123";
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Auth")
                .lastName("Test")
                .username("authtest")
                .email(email)
                .password(password)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(Objects
                                .requireNonNull(objectMapper.writeValueAsString(registerRequest))))
                .andExpect(status().isOk());

        AuthenticationRequest authRequest = new AuthenticationRequest(email, password);
        MvcResult authResult = mockMvc.perform(post("/api/v1/auth/authenticate")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects
                                .requireNonNull(objectMapper.writeValueAsString(authRequest))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie jwtCookie = authResult.getResponse().getCookie("jwt");
        Assertions.assertNotNull(jwtCookie);
        Assertions.assertNotNull(jwtCookie.getValue());
    }

    @Test
    void testMovieController() throws Exception {
        mockMvc.perform(get("/api/v1/movies/search")
                        .param("title", "Inception"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/movies/tt1375666"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/movies/advanced-search")
                        .param("query", "Inception"))
                .andExpect(status().isOk());
    }

    @Test
    void testCoupleController() throws Exception {
        Cookie tokenA = createAndAuthenticateUser("user1@example.com", "passwordA", "user1");
        Cookie tokenB = createAndAuthenticateUser("user2@example.com", "passwordB", "user2");

        MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                        .cookie(tokenA)
                        .param("username", "user2"))
                .andExpect(status().isOk())
                .andReturn();

        String inviteResponse = inviteResult.getResponse().getContentAsString();
        long requestId = objectMapper.readTree(inviteResponse).get("id").asLong();

        mockMvc.perform(get("/api/v1/couple/invites")
                        .cookie(tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/couple/accept/" + requestId)
                        .cookie(tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/couple/partner")
                        .cookie(tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/couple/movies")
                        .cookie(tokenA))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());
    }

    @Test
    void testCoupleRejection() throws Exception {
        Cookie tokenC = createAndAuthenticateUser("userC@example.com", "passwordC", "userC");
        Cookie tokenD = createAndAuthenticateUser("userD@example.com", "passwordD", "userD");

        MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                        .cookie(tokenC)
                        .param("username", "userD"))
                .andExpect(status().isOk())
                .andReturn();

        String inviteResponse = inviteResult.getResponse().getContentAsString();
        long requestId = objectMapper.readTree(inviteResponse).get("id").asLong();

        mockMvc.perform(post("/api/v1/couple/reject/" + requestId)
                        .cookie(tokenD))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/couple/partner")
                        .cookie(tokenC))
                .andExpect(status().isNotFound());
    }

    @Test
    void testFavoritesFlow() throws Exception {
        Cookie token = createAndAuthenticateUser("fav_tester@example.com", "password123", "favtester");

        mockMvc.perform(post("/api/v1/favorites")
                        .cookie(token)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull("{\"imdb_id\": \"tt1375666\"}")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/favorites")
                        .cookie(token)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull("{\"imdb_id\": \"tt1375666\"}")))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/favorites/tt1375666")
                        .cookie(token)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull(
                                "{\"watch_status\": \"WATCHED\", \"user_rating\": 4.5}")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/favorites")
                        .cookie(token))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/favorites/tt1375666")
                        .cookie(token))
                .andExpect(status().isOk());
    }

    @Test
    void testCoupleSharedMoviesFlow() throws Exception {
        Cookie tokenA = createAndAuthenticateUser("couple_test_A@example.com", "passwordA", "coupleA");
        Cookie tokenB = createAndAuthenticateUser("couple_test_B@example.com", "passwordB", "coupleB");

        MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                        .cookie(tokenA)
                        .param("username", "coupleB"))
                .andExpect(status().isOk())
                .andReturn();
        long requestId = objectMapper.readTree(inviteResult.getResponse().getContentAsString()).get("id")
                .asLong();
        mockMvc.perform(post("/api/v1/couple/accept/" + requestId)
                        .cookie(tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/couple/movies")
                        .cookie(tokenA)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull("{\"imdb_id\": \"tt0816692\"}")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/couple/movies")
                        .cookie(tokenB)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull("{\"imdb_id\": \"tt0816692\"}")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/couple/movies")
                        .cookie(tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/couple/movies/tt0816692")
                        .cookie(tokenB)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull("{\"watch_status\": \"WATCHLIST\"}")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/couple/movies/tt0816692/rate")
                        .cookie(tokenA)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull("{\"rating\": 4.0}")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/couple/movies/stats")
                        .cookie(tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/couple/movies/tt0816692")
                        .cookie(tokenA))
                .andExpect(status().isOk());
    }

    private Cookie createAndAuthenticateUser(String email, String password, String username) throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Test")
                .lastName("User")
                .username(username)
                .email(email)
                .password(password)
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects
                                .requireNonNull(objectMapper.writeValueAsString(registerRequest))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie jwtCookie = registerResult.getResponse().getCookie("jwt");
        Assertions.assertNotNull(jwtCookie);
        return jwtCookie;
    }
}
