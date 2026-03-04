package vladyslav.stasyshyn.couple_movie;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationResponse;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieRequest;
import vladyslav.stasyshyn.couple_movie.dto.RegisterRequest;
import vladyslav.stasyshyn.couple_movie.model.MovieStatus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import vladyslav.stasyshyn.couple_movie.service.EmailService;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.test.mock.mockito.MockBean;

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
        private OmdbService omdbService;

        @MockBean
        private EmailService emailService;

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
                RegisterRequest registerRequest = new RegisterRequest();
                registerRequest.setFirstName("Auth");
                registerRequest.setLastName("Test");
                registerRequest.setUsername("authtest");
                registerRequest.setEmail(email);
                registerRequest.setPassword(password);

                mockMvc.perform(post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk());

                AuthenticationRequest authRequest = new AuthenticationRequest(email, password);
                MvcResult authResult = mockMvc.perform(post("/api/v1/auth/authenticate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(authRequest)))
                                .andExpect(status().isOk())
                                .andReturn();

                AuthenticationResponse authResponse = objectMapper.readValue(
                                authResult.getResponse().getContentAsString(), AuthenticationResponse.class);
                Assertions.assertNotNull(authResponse.getToken());
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
        void testUserMovieController() throws Exception {
                String token = createAndAuthenticateUser("user_movie_test@example.com", "password123", "usermovie");
                String imdbId = "tt1375666"; // Inception

                mockMvc.perform(post("/api/v1/user/movies/" + imdbId + "/status")
                                .header("Authorization", "Bearer " + token)
                                .param("status", MovieStatus.PLAN_TO_WATCH.name()))
                                .andExpect(status().isOk());

                RateMovieRequest rateRequest = new RateMovieRequest();
                rateRequest.setRating(9);
                rateRequest.setReview("Great movie!");
                mockMvc.perform(post("/api/v1/user/movies/" + imdbId + "/rate")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(rateRequest)))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/v1/user/movies/watchlist")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk());
        }

        @Test
        void testCoupleController() throws Exception {
                String tokenA = createAndAuthenticateUser("userA@example.com", "passwordA", "userA");
                String tokenB = createAndAuthenticateUser("userB@example.com", "passwordB", "userB");

                MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                                .header("Authorization", "Bearer " + tokenA)
                                .param("username", "userB"))
                                .andExpect(status().isOk())
                                .andReturn();

                String inviteResponse = inviteResult.getResponse().getContentAsString();
                long requestId = objectMapper.readTree(inviteResponse).get("id").asLong();

                mockMvc.perform(get("/api/v1/couple/invites")
                                .header("Authorization", "Bearer " + tokenB))
                                .andExpect(status().isOk());

                mockMvc.perform(post("/api/v1/couple/accept/" + requestId)
                                .header("Authorization", "Bearer " + tokenB))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/v1/couple/partner")
                                .header("Authorization", "Bearer " + tokenA))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/v1/user/movies/shared-watchlist")
                                .header("Authorization", "Bearer " + tokenA))
                                .andExpect(status().isOk());
        }

        @Test
        void testCoupleRejection() throws Exception {
                String tokenC = createAndAuthenticateUser("userC@example.com", "passwordC", "userC");
                String tokenD = createAndAuthenticateUser("userD@example.com", "passwordD", "userD");

                MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                                .header("Authorization", "Bearer " + tokenC)
                                .param("username", "userD"))
                                .andExpect(status().isOk())
                                .andReturn();

                String inviteResponse = inviteResult.getResponse().getContentAsString();
                long requestId = objectMapper.readTree(inviteResponse).get("id").asLong();

                mockMvc.perform(post("/api/v1/couple/reject/" + requestId)
                                .header("Authorization", "Bearer " + tokenD))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/v1/couple/partner")
                                .header("Authorization", "Bearer " + tokenC))
                                .andExpect(status().isNotFound());
        }

        private String createAndAuthenticateUser(String email, String password, String username) throws Exception {
                RegisterRequest registerRequest = new RegisterRequest();
                registerRequest.setFirstName("Test");
                registerRequest.setLastName("User");
                registerRequest.setUsername(username);
                registerRequest.setEmail(email);
                registerRequest.setPassword(password);

                MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk())
                                .andReturn();

                AuthenticationResponse authResponse = objectMapper.readValue(
                                registerResult.getResponse().getContentAsString(), AuthenticationResponse.class);
                return authResponse.getToken();
        }
}
