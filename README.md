# 🎬 CoupleMovie

CoupleMovie is a modern, full-stack web application designed to solve the age-old problem: *"What should we watch tonight?"* 

By combining individual movie preferences, mood-based filtering, and a dedicated **Couple Space**, this platform allows partners and friends to seamlessly discover, match, and track their shared movie-watching journey. The application leverages cutting-edge Artificial Intelligence to analyze both users' tastes and provide hyper-personalized recommendations that satisfy both viewers.

## ✨ Features

### 💑 The Couple Space
- **Partner Linking:** Send and accept invitations to connect your account with a partner or friend.
- **Mutual Matchmaking:** Swipe or select movies you want to watch. When both partners select the same film, it's a **Match**!
- **Shared Watchlists & History:** Maintain a synchronized watchlist and track the movies you've watched together.
- **Dual Ratings:** Both partners can independently rate a shared movie after watching it.

### 🧠 AI-Powered Discovery
- **Natural Language Search:** Skip the generic genre filters. Search for exactly what you want: *"A visually stunning sci-fi thriller with a philosophical twist."*
- **Couple Consensus AI:** The recommendation engine analyzes the combined watch history, ratings, and active moods of *both* users to suggest the statistically perfect movie for your movie night, minimizing compromises.
- **Emotion & Mood Filtering:** Tell the AI how you're feeling, and it will curate a dynamic list of movies tailored to your emotional state.

### 🔐 Secure & Seamless Experience
- **Frictionless Onboarding:** Standard Email/Password registration or instant 1-click **Google OAuth2** login.
- **Stateless JWT Security:** Fully robust, scalable Bearer token authentication architecture designed for the cloud.
- **Responsive UI:** A gorgeous, glassmorphic interface powered by React, Tailwind CSS, and Framer Motion for buttery-smooth animations on both mobile and desktop.

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS (with `shadcn/ui` components)
- Framer Motion (Animations)
- React Router DOM
- Axios (API Client)

**Backend:**
- Java 21 + Spring Boot 3
- Spring Security (OAuth2 Client, JWT Filters)
- Spring Data JPA
- PostgreSQL Database
- Meilisearch (Lightning-fast search engine)
- External APIs: OMDb / TMDB API integration

**Deployment & DevOps:**
- Google Cloud Run (Serverless containerized hosting)
- Google Cloud SQL
- Docker

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Java JDK 21
- PostgreSQL
- Meilisearch instance (Optional, for advanced search)

### Backend Setup
1. Navigate to the root directory.
2. Ensure PostgreSQL is running and update `src/main/resources/application-local.yml` with your database credentials.
3. Configure your environment variables for OAuth2 and AI integrations:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET`
   - `AI_API_KEY`
   - `OMDB_API_KEY`
4. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file based on `.env.example`, pointing `VITE_API_BASE_URL` to your local Spring Boot server (usually `http://localhost:8080/api/v1`).
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 

## 📝 License
This project is licensed under the MIT License.
