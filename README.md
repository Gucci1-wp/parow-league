# Parow Social League 🎱

A comprehensive Pool League Management System designed to manage social pool leagues with ease.

## 🚀 Features

*   **Tournament Management**: Create and manage Round Robin and Single Elimination tournaments using the "Circle Method" and standard brackets.
*   **Live Scoring**: specialized "Matches" tab for tracking frames, lags, and runouts.
*   **Real-time Standings**: Automated ranking calculation based on Wins, Frame Difference, and Points.
*   **Player & Team Management**: Database of players and teams with fast search and management.
*   **SaaS Ready**: Architecture ready for scaling to multiple leagues (Subscription model planned).

## 🛠️ Tech Stack

*   **Frontend**: Next.js (React), Tailwind CSS
*   **Backend**: Node.js, Express
*   **Database**: PostgreSQL
*   **Authentication**: JWT-based Auth

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Gucci1-wp/parow-league.git
    cd parow-league
    ```

2.  **Install dependencies**
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```

3.  **Setup Database**
    *   Ensure PostgreSQL is running.
    *   Create a database named `pool_league`.
    *   Import schema (if provided) or let migrations run.

4.  **Run Development Servers**
    *   Frontend: `npm run dev` (starts on localhost:3000)
    *   Backend: `npm run dev` (starts on localhost:5000)

## 🔜 Roadmap

*   [ ] **SaaS Transformation**: Role-based access for League Owners vs Players.
*   [ ] **Subscription Integration**: Gated access for premium league features.
*   [ ] **Public deployment**: Hosting on VPS.
