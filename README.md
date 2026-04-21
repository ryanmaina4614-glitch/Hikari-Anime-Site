# Hikari v2

Hikari v2 is a static, client-side web platform for discovering anime, manga, movies, and TV shows.  
It runs entirely in the browser, stores user preferences in `localStorage`, and fetches media data from public APIs.

## Project Overview

- Multi-page web app with shared `app.js` logic and `style.css` styling.
- Personalized experience with authentication, settings, favorites, language switching, and profile customization.
- Content discovery across anime, manga, trending/upcoming releases, plus trending movies and TV shows.
- Family Mode support to hide age-restricted content.

## Features

### Authentication (Client-Side)

- Sign up and login flows from `signup.html` and `login.html`.
- Session tracking via `hikariCurrentUser` in `localStorage`.
- Logout from `settings.html`.
- Logged-out users are restricted from protected content pages.
- Settings page acts as the auth entry point when logged out.

### Settings and Personalization

- Learning Mode (prefer Japanese titles).
- Trailer preview toggle on anime cards.
- Family Mode (age-restricted filtering).
- Theme toggle (dark/light).
- Language selector (EN, JA, ES, FR, SW).
- Profile options:
  - username
  - display name
  - bio
  - avatar upload (stored as Data URL)
- Favorites clearing and account logout actions.

### Content Modules

- `index.html`: home/landing page with quick navigation options.
- `anime.html`: anime search, genre filter chips, pagination, hero slider.
- `trending.html`: currently airing anime highlights with pagination and hero.
- `upcoming.html`: combined upcoming anime and manga feed, sorted by nearest release date.
- `details.html`: anime detail page with synopsis, rating, genres, trailer, and favorite action.
- `manga.html`: manga search, genre filters, and list browsing.
- `manga-details.html`: manga detail page with key metadata and external read link.
- `favorites.html`: saved anime favorites from local storage.
- `movies.html`: trending movies feed.
- `tv-shows.html`: trending TV shows feed.

## Family Mode (Age Restriction)

When enabled, Family Mode filters out restricted items across listings and detail pages.

- Anime filtering checks:
  - maturity-related ratings/markers (for example `PG-13`, `R`, `R+`, `Rx`, `17+`)
  - restricted themes/terms (for example nudity/hentai markers)
- Manga filtering checks restricted genre/theme/demographic labels.
- Restricted entries are hidden from:
  - anime/trending/upcoming lists
  - manga/upcoming lists
  - favorites view
  - details pages (shows a hidden-by-family-mode message)

## Data Sources

### Anime/Manga

- Source: [Jikan API v4](https://docs.api.jikan.moe/)
- Base URL in app: `https://api.jikan.moe/v4`
- Used for:
  - top anime/manga
  - search
  - genres
  - details
  - airing and upcoming feeds

### Movies/TV

- Source: iTunes RSS JSON feeds
- Used feeds:
  - `topmovies`
  - `toptvepisodes`

## Local Storage Keys

The app persists state in browser `localStorage` using:

- `hikariUsers`: registered user records (client-side only)
- `hikariCurrentUser`: active logged-in user
- `hikariProfile:<email>`: per-user profile settings
- `favorites`: saved anime favorites
- `learningMode`: learning mode toggle
- `showTrailers`: trailer preview toggle
- `familyMode`: age restriction toggle
- `theme`: light/dark mode
- `language`: selected UI language

## Project Structure

Top-level files in this repo:

- `app.js`: core app logic (routing guards, i18n, API calls, rendering, settings/auth/family mode).
- `style.css`: global styles and responsive layout.
- `index.html`: landing page.
- `anime.html`: anime browsing page.
- `trending.html`: trending anime page.
- `upcoming.html`: upcoming releases page.
- `details.html`: anime details page.
- `manga.html`: manga browsing page.
- `manga-details.html`: manga details page.
- `favorites.html`: favorites page.
- `movies.html`: trending movies page.
- `tv-shows.html`: trending TV shows page.
- `login.html`: login page.
- `signup.html`: signup page.
- `settings.html`: settings/profile/auth-entry page.
- `README.md`: project documentation.

## Run Locally

No build tooling is required.

1. Clone or download the repository.
2. Open the project folder.
3. Serve files with a local static server (recommended) or open `index.html` directly.
4. Start from `index.html`.

Example static server options:

- VS Code Live Server extension
- Python: `python -m http.server`

## Notes and Limitations

- Authentication is client-side only and not secure for production.
- Passwords are stored in browser storage (plaintext in current implementation).
- Favorites are stored globally (`favorites`) rather than scoped per user account.
- App behavior depends on third-party APIs (availability and rate limits may affect results).
- There is no backend/database in this version.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Browser `localStorage`
- Public REST/RSS APIs (Jikan + iTunes)
