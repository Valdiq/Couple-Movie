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
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationRequest;
import vladyslav.stasyshyn.couple_movie.dto.AuthenticationResponse;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieRequest;
import vladyslav.stasyshyn.couple_movie.dto.RegisterRequest;
import vladyslav.stasyshyn.couple_movie.model.MovieStatus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
class CoupleMovieApplicationTests {

        @Container
        @SuppressWarnings("resource")
        static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
                        .withDatabaseName("couple_movie_test")
                        .withUsername("test")
                        .withPassword("test");

        @Container
        @SuppressWarnings("resource")
        static GenericContainer<?> elasticsearch = new GenericContainer<>(
                        "docker.elastic.co/elasticsearch/elasticsearch:7.17.10")
                        .withEnv("discovery.type", "single-node")
                        .withEnv("xpack.security.enabled", "false")
                        .withExposedPorts(9200);

        @DynamicPropertySource
        static void configureProperties(DynamicPropertyRegistry registry) {
                registry.add("spring.datasource.url", mysql::getJdbcUrl);
                registry.add("spring.datasource.username", mysql::getUsername);
                registry.add("spring.datasource.password", mysql::getPassword);
                registry.add("spring.data.elasticsearch.client.reactive.endpoints",
                                () -> elasticsearch.getHost() + ":" + elasticsearch.getMappedPort(9200));
        }

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void contextLoads() {
                Assertions.assertTrue(mysql.isRunning());
                Assertions.assertTrue(elasticsearch.isRunning());
        }

        @Test
        void testAuthenticationController() throws Exception {
                String email = "auth_test@example.com";
                String password = "password123";
                RegisterRequest registerRequest = new RegisterRequest();
                registerRequest.setFirstName("Auth");
                registerRequest.setLastName("Test");
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
                String token = createAndAuthenticateUser("user_movie_test@example.com", "password123");
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
                String tokenA = createAndAuthenticateUser("userA@example.com", "passwordA");
                String tokenB = createAndAuthenticateUser("userB@example.com", "passwordB");

                MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                                .header("Authorization", "Bearer " + tokenA)
                                .param("email", "userB@example.com"))
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
                String tokenC = createAndAuthenticateUser("userC@example.com", "passwordC");
                String tokenD = createAndAuthenticateUser("userD@example.com", "passwordD");

                MvcResult inviteResult = mockMvc.perform(post("/api/v1/couple/invite")
                                .header("Authorization", "Bearer " + tokenC)
                                .param("email", "userD@example.com"))
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

        private String createAndAuthenticateUser(String email, String password) throws Exception {
                RegisterRequest registerRequest = new RegisterRequest();
                registerRequest.setFirstName("Test");
                registerRequest.setLastName("User");
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
