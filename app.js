const BASE_URL = "https://api.jikan.moe/v4";

let currentPage = 1;
let currentQuery = "";
let currentGenreId = null;

let heroList = [];
let heroIndex = 0;
let heroInterval;

let learningMode = localStorage.getItem("learningMode") === "true";
let showTrailers = localStorage.getItem("showTrailers") !== "false";
let currentTheme = localStorage.getItem("theme") || "dark";
let currentLanguage = localStorage.getItem("language") || "en";

// =========================
// 🔒 AUTH GATE
// =========================
function isAuthenticated() {
  try {
    const raw = localStorage.getItem("hikariCurrentUser");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.email);
  } catch {
    return false;
  }
}

function getCurrentPageName() {
  const last = (window.location.pathname || "").split("/").pop();
  return last && last.length ? last : "index.html";
}

function applyNavAuthVisibility() {
  const authed = isAuthenticated();
  document.querySelectorAll(".nav-links a[data-i18n]").forEach(a => {
    const key = a.dataset.i18n;
    const allowWhenLoggedOut = key === "nav.home" || key === "nav.login" || key === "nav.signup";
    if (!authed && !allowWhenLoggedOut) a.style.display = "none";
    if (authed) a.style.display = "";
  });
}

function applyLoggedOutLinkGuard() {
  const authed = isAuthenticated();
  if (authed) return;

  const protectedPages = new Set([
    "anime.html",
    "manga.html",
    "favorites.html",
    "details.html",
    "manga-details.html",
    "trending.html",
    "upcoming.html",
    "settings.html"
  ]);

  document.addEventListener("click", event => {
    const a = event.target?.closest?.("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const dest = href.split("#")[0].split("?")[0];
    if (protectedPages.has(dest)) {
      event.preventDefault();
      window.location.href = "login.html";
    }
  });
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("hikariCurrentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Only allow landing/login/signup while logged out
(() => {
  const authed = isAuthenticated();
  const page = getCurrentPageName().toLowerCase();
  const allowlist = new Set(["index.html", "login.html", "signup.html"]);
  if (!authed && !allowlist.has(page)) {
    window.location.replace("index.html");
  }
})();

// Page detection
const isHome = document.getElementById("grid");
const isTrending = document.getElementById("trendingGrid");
const isUpcoming = document.getElementById("upcomingGrid");
const isDetails = document.getElementById("details");
const isFavorites = document.getElementById("favGrid");
const isLoginPage = document.getElementById("loginForm");
const isSignupPage = document.getElementById("signupForm");
const isSettingsPage = document.getElementById("settingsForm");
const isAnimePage = document.getElementById("hero") && document.getElementById("search") && document.getElementById("grid");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

applyTheme(currentTheme);
applyNavAuthVisibility();
applyLoggedOutLinkGuard();

const translations = {
  en: {
    "nav.home": "Home",
    "nav.trending": "Trending 🔥",
    "nav.upcoming": "Upcoming ⏳",
    "nav.anime": "Anime 🎬",
    "nav.manga": "Manga 📚",
    "nav.favorites": "Favorites ⭐",
    "nav.login": "Login",
    "nav.signup": "Sign Up",
    "nav.settings": "Settings",
    "trending.title": "Trending Now",
    "trending.subtitle": "The most popular anime airing right now.",
    "upcoming.title": "Upcoming Releases",
    "upcoming.subtitle": "Future anime and manga, sorted from the closest release date.",
    "home.title": "Welcome to Hikari Anime",
    "home.subtitle": "Discover top anime, explore manga, and personalize your watch journey.",
    "home.browseAnime": "Browse Anime",
    "home.browseManga": "Browse Manga",
    "home.whatYouCanDo": "What you can do",
    "home.infoOne": "Use the Anime page for search, top lists, favorites, and learning mode.",
    "home.infoTwo": "Use the Settings page to control theme, trailers, and account preferences.",
    "anime.search": "Search anime...",
    "manga.search": "Search manga...",
    "anime.learningModeButton": "🇯🇵 Learning Mode",
    "settings.title": "Settings",
    "settings.subtitle": "Customize your Hikari Anime experience.",
    "settings.learningMode": "Enable Learning Mode (show Japanese titles)",
    "settings.trailers": "Show trailer preview on anime cards",
    "settings.lightTheme": "Use Light Theme",
    "settings.language": "App Language",
    "settings.languageEnglish": "English",
    "settings.languageJapanese": "Japanese",
    "settings.languageSpanish": "Spanish",
    "settings.languageFrench": "French",
    "settings.languageSwahili": "Swahili",
    "settings.save": "Save Settings",
    "settings.clearFavorites": "Clear Favorites",
    "settings.logout": "Logout"
  },
  ja: {
    "nav.home": "ホーム",
    "nav.trending": "トレンド 🔥",
    "nav.upcoming": "今後 ⏳",
    "nav.anime": "アニメ 🎬",
    "nav.manga": "マンガ 📚",
    "nav.favorites": "お気に入り ⭐",
    "nav.login": "ログイン",
    "nav.signup": "新規登録",
    "nav.settings": "設定",
    "trending.title": "いま話題",
    "trending.subtitle": "今放送中の人気アニメをチェック。",
    "upcoming.title": "今後のリリース",
    "upcoming.subtitle": "公開（発売）日の近い順に並べた、これからのアニメ・マンガ。",
    "home.title": "Hikari Animeへようこそ",
    "home.subtitle": "人気アニメを見つけて、マンガを探して、視聴体験をカスタマイズしましょう。",
    "home.browseAnime": "アニメを見る",
    "home.browseManga": "マンガを見る",
    "home.whatYouCanDo": "できること",
    "home.infoOne": "Animeページでは検索、ランキング、お気に入り、学習モードが使えます。",
    "home.infoTwo": "Settingsページではテーマ、トレーラー、アカウント設定を変更できます。",
    "anime.search": "アニメを検索...",
    "manga.search": "マンガを検索...",
    "anime.learningModeButton": "🇯🇵 学習モード",
    "settings.title": "設定",
    "settings.subtitle": "Hikari Animeの体験をカスタマイズしましょう。",
    "settings.learningMode": "学習モードを有効化（日本語タイトルを表示）",
    "settings.trailers": "アニメカードに予告編プレビューを表示",
    "settings.lightTheme": "ライトテーマを使用",
    "settings.language": "アプリの言語",
    "settings.languageEnglish": "英語",
    "settings.languageJapanese": "日本語",
    "settings.languageSpanish": "スペイン語",
    "settings.languageFrench": "フランス語",
    "settings.languageSwahili": "スワヒリ語",
    "settings.save": "設定を保存",
    "settings.clearFavorites": "お気に入りをクリア",
    "settings.logout": "ログアウト"
  },
  es: {
    "nav.home": "Inicio",
    "nav.trending": "Tendencias 🔥",
    "nav.upcoming": "Próximamente ⏳",
    "nav.anime": "Anime 🎬",
    "nav.manga": "Manga 📚",
    "nav.favorites": "Favoritos ⭐",
    "nav.login": "Iniciar sesion",
    "nav.signup": "Registrarse",
    "nav.settings": "Configuracion",
    "trending.title": "Tendencias",
    "trending.subtitle": "Los animes más populares que se están emitiendo ahora.",
    "upcoming.title": "Próximos estrenos",
    "upcoming.subtitle": "Anime y manga futuros, ordenados por la fecha más cercana.",
    "home.title": "Bienvenido a Hikari Anime",
    "home.subtitle": "Descubre animes populares, explora manga y personaliza tu experiencia.",
    "home.browseAnime": "Explorar Anime",
    "home.browseManga": "Explorar Manga",
    "home.whatYouCanDo": "Que puedes hacer",
    "home.infoOne": "Usa la pagina Anime para buscar, ver rankings, favoritos y modo aprendizaje.",
    "home.infoTwo": "Usa Configuracion para cambiar tema, avances y preferencias de cuenta.",
    "anime.search": "Buscar anime...",
    "manga.search": "Buscar manga...",
    "anime.learningModeButton": "🇯🇵 Modo Aprendizaje",
    "settings.title": "Configuracion",
    "settings.subtitle": "Personaliza tu experiencia en Hikari Anime.",
    "settings.learningMode": "Activar modo aprendizaje (mostrar titulos japoneses)",
    "settings.trailers": "Mostrar vista previa de trailers en tarjetas de anime",
    "settings.lightTheme": "Usar tema claro",
    "settings.language": "Idioma de la aplicacion",
    "settings.languageEnglish": "Ingles",
    "settings.languageJapanese": "Japones",
    "settings.languageSpanish": "Espanol",
    "settings.languageFrench": "Frances",
    "settings.languageSwahili": "Suajili",
    "settings.save": "Guardar ajustes",
    "settings.clearFavorites": "Limpiar favoritos",
    "settings.logout": "Cerrar sesion"
  },
  fr: {
    "nav.home": "Accueil",
    "nav.trending": "Tendance 🔥",
    "nav.upcoming": "À venir ⏳",
    "nav.anime": "Anime 🎬",
    "nav.manga": "Manga 📚",
    "nav.favorites": "Favoris ⭐",
    "nav.login": "Connexion",
    "nav.signup": "Inscription",
    "nav.settings": "Parametres",
    "trending.title": "Tendance",
    "trending.subtitle": "Les animes les plus populaires en diffusion actuellement.",
    "upcoming.title": "À venir",
    "upcoming.subtitle": "Anime et manga à venir, triés par date la plus proche.",
    "home.title": "Bienvenue sur Hikari Anime",
    "home.subtitle": "Decouvrez les meilleurs animes, explorez le manga et personnalisez votre experience.",
    "home.browseAnime": "Voir les animes",
    "home.browseManga": "Voir les mangas",
    "home.whatYouCanDo": "Ce que vous pouvez faire",
    "home.infoOne": "Utilisez la page Anime pour la recherche, les tops, les favoris et le mode apprentissage.",
    "home.infoTwo": "Utilisez Parametres pour gerer le theme, les bandes-annonces et le compte.",
    "anime.search": "Rechercher un anime...",
    "manga.search": "Rechercher un manga...",
    "anime.learningModeButton": "🇯🇵 Mode Apprentissage",
    "settings.title": "Parametres",
    "settings.subtitle": "Personnalisez votre experience Hikari Anime.",
    "settings.learningMode": "Activer le mode apprentissage (afficher les titres japonais)",
    "settings.trailers": "Afficher l'aperçu des bandes-annonces sur les cartes anime",
    "settings.lightTheme": "Utiliser le theme clair",
    "settings.language": "Langue de l'application",
    "settings.languageEnglish": "Anglais",
    "settings.languageJapanese": "Japonais",
    "settings.languageSpanish": "Espagnol",
    "settings.languageFrench": "Francais",
    "settings.languageSwahili": "Swahili",
    "settings.save": "Enregistrer",
    "settings.clearFavorites": "Vider les favoris",
    "settings.logout": "Se deconnecter"
  },
  sw: {
    "nav.home": "Nyumbani",
    "nav.trending": "Maarufu 🔥",
    "nav.upcoming": "Zinazokuja ⏳",
    "nav.anime": "Anime 🎬",
    "nav.manga": "Manga 📚",
    "nav.favorites": "Vipendwa ⭐",
    "nav.login": "Ingia",
    "nav.signup": "Jisajili",
    "nav.settings": "Mipangilio",
    "trending.title": "Maarufu Sasa",
    "trending.subtitle": "Anime zinazopendwa zaidi zinazoendelea kuonyeshwa sasa.",
    "upcoming.title": "Zinazokuja",
    "upcoming.subtitle": "Anime na manga zijazo, zimepangwa kuanzia tarehe ya karibu.",
    "home.title": "Karibu Hikari Anime",
    "home.subtitle": "Gundua anime maarufu, chunguza manga, na boresha uzoefu wako.",
    "home.browseAnime": "Vinjari Anime",
    "home.browseManga": "Vinjari Manga",
    "home.whatYouCanDo": "Unachoweza kufanya",
    "home.infoOne": "Tumia ukurasa wa Anime kwa utafutaji, orodha bora, vipendwa na hali ya kujifunza.",
    "home.infoTwo": "Tumia Mipangilio kubadilisha mandhari, trela na mapendeleo ya akaunti.",
    "anime.search": "Tafuta anime...",
    "manga.search": "Tafuta manga...",
    "anime.learningModeButton": "🇯🇵 Hali ya Kujifunza",
    "settings.title": "Mipangilio",
    "settings.subtitle": "Binafsisha matumizi yako ya Hikari Anime.",
    "settings.learningMode": "Washa hali ya kujifunza (onyesha majina ya Kijapani)",
    "settings.trailers": "Onyesha muhtasari wa trela kwenye kadi za anime",
    "settings.lightTheme": "Tumia mandhari nyepesi",
    "settings.language": "Lugha ya Programu",
    "settings.languageEnglish": "Kiingereza",
    "settings.languageJapanese": "Kijapani",
    "settings.languageSpanish": "Kihispania",
    "settings.languageFrench": "Kifaransa",
    "settings.languageSwahili": "Kiswahili",
    "settings.save": "Hifadhi Mipangilio",
    "settings.clearFavorites": "Futa Vipendwa",
    "settings.logout": "Toka"
  }
};

function applyLanguage(lang) {
  const language = translations[lang] ? lang : "en";
  const dictionary = translations[language];
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.dataset.i18n;
    if (dictionary[key]) node.textContent = dictionary[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    const key = node.dataset.i18nPlaceholder;
    if (dictionary[key]) node.placeholder = dictionary[key];
  });
}

applyLanguage(currentLanguage);

function escapeHtml(value) {
  if (typeof value !== "string") return "";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// =========================
// 🔐 AUTH HELPERS
// =========================
function getUsers() {
  return JSON.parse(localStorage.getItem("hikariUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("hikariUsers", JSON.stringify(users));
}

function setAuthMessage(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
  el.classList.toggle("success", !isError);
}

if (isSignupPage) {
  const signupForm = document.getElementById("signupForm");
  const signupMessage = document.getElementById("signupMessage");

  signupForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim().toLowerCase();
    const password = signupForm.password.value;

    if (!name || !email || !password) {
      setAuthMessage(signupMessage, "Please fill in all fields.", true);
      return;
    }

    const users = getUsers();
    const alreadyExists = users.some(user => user.email === email);

    if (alreadyExists) {
      setAuthMessage(signupMessage, "An account with that email already exists.", true);
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    localStorage.setItem("hikariCurrentUser", JSON.stringify({ name, email }));

    setAuthMessage(signupMessage, "Account created! Redirecting to home...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}

if (isLoginPage) {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      setAuthMessage(loginMessage, "Invalid email or password.", true);
      return;
    }

    localStorage.setItem(
      "hikariCurrentUser",
      JSON.stringify({ name: user.name, email: user.email })
    );

    setAuthMessage(loginMessage, "Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}

if (isSettingsPage) {
  const settingsForm = document.getElementById("settingsForm");
  const learningModeInput = document.getElementById("settingLearningMode");
  const trailersInput = document.getElementById("settingTrailers");
  const lightThemeInput = document.getElementById("settingLightTheme");
  const languageSelect = document.getElementById("settingLanguage");
  const profileEmail = document.getElementById("profileEmail");
  const profileUsername = document.getElementById("profileUsername");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileBio = document.getElementById("profileBio");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileAvatarPreview = document.getElementById("profileAvatarPreview");
  const removeAvatarBtn = document.getElementById("removeAvatarBtn");
  const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsMessage = document.getElementById("settingsMessage");

  const user = getCurrentUser();
  const email = user?.email || "";
  const profileKey = email ? `hikariProfile:${email}` : null;
  let avatarDataUrl = "";

  learningModeInput.checked = learningMode;
  trailersInput.checked = showTrailers;
  lightThemeInput.checked = currentTheme === "light";
  languageSelect.value = currentLanguage;

  if (profileEmail) {
    profileEmail.textContent = email ? `Signed in as ${email}` : "";
  }

  if (profileKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
      if (saved && typeof saved === "object") {
        if (profileUsername) profileUsername.value = saved.username || "";
        if (profileDisplayName) profileDisplayName.value = saved.displayName || "";
        if (profileBio) profileBio.value = saved.bio || "";
        avatarDataUrl = saved.avatarDataUrl || "";
      }
    } catch {
      // ignore invalid profile data
    }
  }

  const defaultAvatarSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#52e6ff" stop-opacity="0.65"/>
          <stop offset="1" stop-color="#b055ff" stop-opacity="0.65"/>
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="28" fill="url(#g)"/>
      <circle cx="160" cy="132" r="54" fill="rgba(255,255,255,0.7)"/>
      <path d="M64 286c22-58 70-86 96-86s74 28 96 86" fill="rgba(255,255,255,0.7)"/>
    </svg>`
  )}`;

  function syncAvatarPreview() {
    if (!profileAvatarPreview) return;
    profileAvatarPreview.src = avatarDataUrl || defaultAvatarSvg;
  }

  syncAvatarPreview();

  if (profileAvatar) {
    profileAvatar.addEventListener("change", () => {
      const file = profileAvatar.files && profileAvatar.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        avatarDataUrl = typeof reader.result === "string" ? reader.result : "";
        syncAvatarPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", () => {
      avatarDataUrl = "";
      if (profileAvatar) profileAvatar.value = "";
      syncAvatarPreview();
    });
  }

  settingsForm.addEventListener("submit", event => {
    event.preventDefault();
    localStorage.setItem("learningMode", learningModeInput.checked);
    localStorage.setItem("showTrailers", trailersInput.checked);
    currentTheme = lightThemeInput.checked ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
    currentLanguage = languageSelect.value;
    localStorage.setItem("language", currentLanguage);
    applyLanguage(currentLanguage);

    if (profileKey) {
      const username = (profileUsername?.value || "").trim();
      const displayName = (profileDisplayName?.value || "").trim();
      const bio = (profileBio?.value || "").trim();

      const safeUsername = username.replace(/[^\w.-]/g, "").slice(0, 24);
      const safeDisplayName = displayName.slice(0, 40);
      const safeBio = bio.slice(0, 180);

      localStorage.setItem(
        profileKey,
        JSON.stringify({
          username: safeUsername,
          displayName: safeDisplayName,
          bio: safeBio,
          avatarDataUrl
        })
      );
    }

    setAuthMessage(settingsMessage, "Settings saved successfully.");
  });

  clearFavoritesBtn.addEventListener("click", () => {
    localStorage.removeItem("favorites");
    setAuthMessage(settingsMessage, "Favorites cleared.");
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("hikariCurrentUser");
    setAuthMessage(settingsMessage, "Logged out.");
    window.location.href = "index.html";
  });
}

// =========================
// 🇯🇵 LEARNING MODE
// =========================
function toggleLearningMode() {
  learningMode = !learningMode;
  localStorage.setItem("learningMode", learningMode);
  location.reload();
}

// =========================
// 🏠 HOME PAGE
// =========================
if (isHome) {
  const grid = document.getElementById("grid");
  const searchInput = document.getElementById("search");
  const genreChips = document.getElementById("genreChips");
  const clearGenreBtn = document.getElementById("clearGenreBtn");

  const pagination = document.createElement("div");
  pagination.classList.add("pagination");
  document.body.appendChild(pagination);

  fetchAnime();
  initAnimeGenres();

  searchInput.addEventListener("input", () => {
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    fetchAnime();
  });

  if (clearGenreBtn) {
    clearGenreBtn.addEventListener("click", () => {
      currentGenreId = null;
      currentPage = 1;
      updateGenreSelectionUI();
      fetchAnime();
    });
  }

  async function fetchAnime() {
    try {
      showLoading();

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      if (currentQuery) params.set("q", currentQuery);
      if (currentGenreId) params.set("genres", String(currentGenreId));

      const url = currentQuery || currentGenreId
        ? `${BASE_URL}/anime?${params.toString()}`
        : `${BASE_URL}/top/anime?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);

      const data = await res.json();
      const animeList = Array.isArray(data.data) ? data.data : [];

      displayAnime(animeList);

      heroList = animeList.slice(0, 5);
      startHeroSlider();

      setupPagination(data.pagination);
    } catch (error) {
      grid.innerHTML = `<h2 class="loading">Could not load anime. Please try again.</h2>`;
      pagination.innerHTML = "";
      const hero = document.getElementById("hero");
      if (hero) {
        hero.style.backgroundImage = "none";
        hero.innerHTML = `<div class="hero-content"><h2>Failed to load highlights</h2></div>`;
      }
      console.error(error);
    }
  }

  function showLoading() {
    grid.innerHTML = `<h2 class="loading">Loading anime... ⏳</h2>`;
  }

  function updateGenreSelectionUI() {
    if (!genreChips) return;
    genreChips.querySelectorAll("button.genre-chip").forEach(btn => {
      const isSelected = btn.dataset.genreId === String(currentGenreId);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
    if (clearGenreBtn) clearGenreBtn.hidden = !currentGenreId;
  }

  async function initAnimeGenres() {
    if (!genreChips) return;
    genreChips.innerHTML = `<span class="loading" style="padding: 6px 0;">Loading genres...</span>`;

    try {
      const res = await fetch(`${BASE_URL}/genres/anime`);
      if (!res.ok) throw new Error(`Genre request failed: ${res.status}`);
      const data = await res.json();
      const genres = Array.isArray(data.data) ? data.data : [];

      genres.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      genreChips.innerHTML = "";
      for (const genre of genres) {
        if (!genre?.mal_id || !genre?.name) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "genre-chip";
        btn.textContent = genre.name;
        btn.dataset.genreId = String(genre.mal_id);
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", () => {
          const clickedId = Number(btn.dataset.genreId);
          currentGenreId = currentGenreId === clickedId ? null : clickedId;
          currentPage = 1;
          updateGenreSelectionUI();
          fetchAnime();
        });
        genreChips.appendChild(btn);
      }

      updateGenreSelectionUI();
    } catch (error) {
      console.error(error);
      genreChips.innerHTML = `<span class="loading" style="padding: 6px 0;">Could not load genres.</span>`;
      if (clearGenreBtn) clearGenreBtn.hidden = true;
    }
  }

  function displayAnime(list) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    grid.innerHTML = "";

    list.forEach(anime => {
      const isFav = favorites.includes(anime.mal_id);

      const title = learningMode
        ? `
          <h3>${anime.title_japanese || anime.title}</h3>
          <small>${anime.title}</small>
        `
        : `<h3>${anime.title}</h3>`;

      const trailer = showTrailers ? anime.trailer?.embed_url : null;

      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <div class="card-media">
          <img src="${anime.images.jpg.image_url}" alt="${escapeHtml(anime.title)} cover image" />
          ${trailer ? `<iframe src="${trailer}" allowfullscreen></iframe>` : ""}
        </div>

        ${title}
        <p>⭐ ${anime.score || "N/A"}</p>
        <p>${anime.genres.map(g => g.name).join(", ")}</p>

        <button onclick="viewDetails(${anime.mal_id})">Details</button>
        <button class="fav-btn" onclick="toggleFavorite(${anime.mal_id})">
          ${isFav ? "❤️" : "🤍"}
        </button>
      `;

      grid.appendChild(card);
    });
  }

  function setupPagination(paginationData) {
    if (!paginationData) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = `
      <button ${!paginationData.has_previous_page ? "disabled" : ""}
        onclick="changePage(-1)">⬅ Prev</button>

      <span>Page ${currentPage}</span>

      <button ${!paginationData.has_next_page ? "disabled" : ""}
        onclick="changePage(1)">Next ➡</button>
    `;
  }

  window.changePage = function (direction) {
    currentPage += direction;
    fetchAnime();
  };

  // 🎬 HERO SLIDER
  function startHeroSlider() {
    if (heroInterval) clearInterval(heroInterval);
    if (!heroList.length) {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.style.backgroundImage = "none";
        hero.innerHTML = `<div class="hero-content"><h2>No anime found</h2></div>`;
      }
      return;
    }

    heroIndex = 0;
    showHero(heroList[0]);

    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroList.length;
      showHero(heroList[heroIndex]);
    }, 4000);
  }

  function showHero(anime) {
    if (!anime) return;
    const hero = document.getElementById("hero");

    hero.style.backgroundImage = `url(${anime.images.jpg.large_image_url})`;

    hero.innerHTML = `
      <div class="hero-content fade">
        <h2>${anime.title}</h2>
        <h3>${anime.title_japanese || ""}</h3>
        <p>⭐ ${anime.score || "N/A"}</p>
        <button onclick="viewDetails(${anime.mal_id})">▶ Watch Info</button>
      </div>
    `;
  }
}

// =========================
// 🔥 TRENDING PAGE
// =========================
if (isTrending) {
  const grid = document.getElementById("trendingGrid");
  const hero = document.getElementById("trendingHero");

  let trendingPage = 1;

  const pagination = document.createElement("div");
  pagination.classList.add("pagination");
  document.body.appendChild(pagination);

  fetchTrending();

  async function fetchTrending() {
    try {
      grid.innerHTML = `<h2 class="loading">Loading trending anime... ⏳</h2>`;

      const res = await fetch(`${BASE_URL}/top/anime?filter=airing&page=${trendingPage}`);
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];

      displayTrending(list);
      setupTrendingPagination(data.pagination);

      heroList = list.slice(0, 5);
      startTrendingHeroSlider();
    } catch (error) {
      grid.innerHTML = `<h2 class="loading">Could not load trending anime. Please try again.</h2>`;
      pagination.innerHTML = "";
      if (hero) {
        hero.style.backgroundImage = "none";
      }
      console.error(error);
    }
  }

  function displayTrending(list) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    grid.innerHTML = "";

    list.forEach(anime => {
      const isFav = favorites.includes(anime.mal_id);

      const title = learningMode
        ? `
          <h3>${anime.title_japanese || anime.title}</h3>
          <small>${anime.title}</small>
        `
        : `<h3>${anime.title}</h3>`;

      const trailer = showTrailers ? anime.trailer?.embed_url : null;

      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <div class="card-media">
          <img src="${anime.images.jpg.image_url}" alt="${escapeHtml(anime.title)} cover image" />
          ${trailer ? `<iframe src="${trailer}" allowfullscreen></iframe>` : ""}
        </div>

        ${title}
        <p>⭐ ${anime.score || "N/A"}</p>
        <p>${anime.genres.map(g => g.name).join(", ")}</p>

        <button onclick="viewDetails(${anime.mal_id})">Details</button>
        <button class="fav-btn" onclick="toggleFavorite(${anime.mal_id})">
          ${isFav ? "❤️" : "🤍"}
        </button>
      `;

      grid.appendChild(card);
    });
  }

  function setupTrendingPagination(paginationData) {
    if (!paginationData) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = `
      <button ${!paginationData.has_previous_page ? "disabled" : ""}
        onclick="changeTrendingPage(-1)">⬅ Prev</button>

      <span>Page ${trendingPage}</span>

      <button ${!paginationData.has_next_page ? "disabled" : ""}
        onclick="changeTrendingPage(1)">Next ➡</button>
    `;
  }

  window.changeTrendingPage = function (direction) {
    trendingPage += direction;
    fetchTrending();
  };

  function startTrendingHeroSlider() {
    if (!hero) return;
    if (heroInterval) clearInterval(heroInterval);
    if (!heroList.length) {
      hero.style.backgroundImage = "none";
      return;
    }

    heroIndex = 0;
    showTrendingHero(heroList[0]);

    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroList.length;
      showTrendingHero(heroList[heroIndex]);
    }, 4000);
  }

  function showTrendingHero(anime) {
    if (!hero || !anime) return;
    hero.style.backgroundImage = `url(${anime.images.jpg.large_image_url})`;
    hero.innerHTML = `
      <div class="hero-content fade">
        <h2>${anime.title}</h2>
        <h3>${anime.title_japanese || ""}</h3>
        <p>⭐ ${anime.score || "N/A"}</p>
        <button onclick="viewDetails(${anime.mal_id})">▶ Watch Info</button>
      </div>
    `;
  }
}

// =========================
// ⏳ UPCOMING PAGE (ANIME + MANGA)
// =========================
if (isUpcoming) {
  const grid = document.getElementById("upcomingGrid");
  const hero = document.getElementById("upcomingHero");

  const pagination = document.createElement("div");
  pagination.classList.add("pagination");
  document.body.appendChild(pagination);

  let upcomingAnimePage = 1;
  let upcomingMangaPage = 1;

  fetchUpcoming();

  function parseStartDate(item) {
    const raw = item?.type === "manga" ? item?.published?.from : item?.aired?.from;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDate(d) {
    if (!d) return "TBA";
    try {
      return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }

  async function fetchUpcoming() {
    try {
      grid.innerHTML = `<h2 class="loading">Loading upcoming releases... ⏳</h2>`;
      pagination.innerHTML = "";

      const [animeRes, mangaRes] = await Promise.all([
        fetch(`${BASE_URL}/seasons/upcoming?page=${upcomingAnimePage}`),
        fetch(`${BASE_URL}/top/manga?filter=upcoming&page=${upcomingMangaPage}`)
      ]);

      if (!animeRes.ok) throw new Error(`Upcoming anime request failed: ${animeRes.status}`);
      if (!mangaRes.ok) throw new Error(`Upcoming manga request failed: ${mangaRes.status}`);

      const [animeJson, mangaJson] = await Promise.all([animeRes.json(), mangaRes.json()]);

      const animeListRaw = Array.isArray(animeJson.data) ? animeJson.data : [];
      const mangaListRaw = Array.isArray(mangaJson.data) ? mangaJson.data : [];

      const animeList = animeListRaw.map(a => ({ ...a, type: "anime" }));
      const mangaList = mangaListRaw.map(m => ({ ...m, type: "manga" }));

      const combined = [...animeList, ...mangaList]
        .map(item => ({ item, start: parseStartDate(item) }))
        .sort((a, b) => {
          const at = a.start ? a.start.getTime() : Number.POSITIVE_INFINITY;
          const bt = b.start ? b.start.getTime() : Number.POSITIVE_INFINITY;
          if (at !== bt) return at - bt;
          return (a.item?.title || "").localeCompare(b.item?.title || "");
        })
        .map(x => x.item);

      displayUpcoming(combined);
      setupUpcomingPagination(animeJson.pagination, mangaJson.pagination);

      heroList = combined
        .filter(x => x.type === "anime")
        .slice(0, 5);
      startUpcomingHeroSlider();
    } catch (error) {
      grid.innerHTML = `<h2 class="loading">Could not load upcoming releases. Please try again.</h2>`;
      pagination.innerHTML = "";
      if (hero) hero.style.backgroundImage = "none";
      console.error(error);
    }
  }

  function displayUpcoming(list) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    grid.innerHTML = "";

    list.forEach(entry => {
      const isAnime = entry.type === "anime";
      const startDate = parseStartDate(entry);

      const title = learningMode
        ? `
          <h3>${entry.title_japanese || entry.title}</h3>
          <small>${entry.title}</small>
        `
        : `<h3>${entry.title}</h3>`;

      const trailer = isAnime && showTrailers ? entry.trailer?.embed_url : null;
      const isFav = isAnime ? favorites.includes(entry.mal_id) : false;

      const card = document.createElement("div");
      card.classList.add("card");

      const imageUrl = entry?.images?.jpg?.image_url || entry?.images?.webp?.image_url || "";

      card.innerHTML = `
        <div class="card-media">
          <img src="${imageUrl}" alt="${escapeHtml(entry.title)} cover image" />
          ${trailer ? `<iframe src="${trailer}" allowfullscreen></iframe>` : ""}
        </div>

        ${title}

        <div class="meta-row">
          <span class="type-badge ${isAnime ? "anime" : "manga"}">${isAnime ? "Anime" : "Manga"}</span>
          <span class="date-pill">📅 ${formatDate(startDate)}</span>
        </div>

        <p>⭐ ${entry.score || "N/A"}</p>
        <p>${(entry.genres || []).map(g => g.name).join(", ")}</p>

        ${
          isAnime
            ? `
              <button onclick="viewDetails(${entry.mal_id})">Details</button>
              <button class="fav-btn" onclick="toggleFavorite(${entry.mal_id})">
                ${isFav ? "❤️" : "🤍"}
              </button>
            `
            : `<a href="${entry.url}" target="_blank" rel="noopener noreferrer"><button type="button">Open</button></a>`
        }
      `;

      grid.appendChild(card);
    });
  }

  function setupUpcomingPagination(animePagination, mangaPagination) {
    const canPrev = (animePagination?.has_previous_page && upcomingAnimePage > 1) || (mangaPagination?.has_previous_page && upcomingMangaPage > 1);
    const canNext = (animePagination?.has_next_page) || (mangaPagination?.has_next_page);

    pagination.innerHTML = `
      <button ${!canPrev ? "disabled" : ""} onclick="changeUpcomingPage(-1)">⬅ Prev</button>
      <span>Page A${upcomingAnimePage} / M${upcomingMangaPage}</span>
      <button ${!canNext ? "disabled" : ""} onclick="changeUpcomingPage(1)">Next ➡</button>
    `;
  }

  window.changeUpcomingPage = function (direction) {
    upcomingAnimePage = Math.max(1, upcomingAnimePage + direction);
    upcomingMangaPage = Math.max(1, upcomingMangaPage + direction);
    fetchUpcoming();
  };

  function startUpcomingHeroSlider() {
    if (!hero) return;
    if (heroInterval) clearInterval(heroInterval);
    if (!heroList.length) {
      hero.style.backgroundImage = "none";
      return;
    }

    heroIndex = 0;
    showUpcomingHero(heroList[0]);

    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroList.length;
      showUpcomingHero(heroList[heroIndex]);
    }, 4000);
  }

  function showUpcomingHero(anime) {
    if (!hero || !anime) return;
    hero.style.backgroundImage = `url(${anime.images.jpg.large_image_url})`;
    hero.innerHTML = `
      <div class="hero-content fade">
        <h2>${anime.title}</h2>
        <h3>${anime.title_japanese || ""}</h3>
        <p>⭐ ${anime.score || "N/A"}</p>
        <button onclick="viewDetails(${anime.mal_id})">▶ Watch Info</button>
      </div>
    `;
  }
}

// =========================
// 📄 DETAILS PAGE
// =========================
if (isDetails) {
  const details = document.getElementById("details");
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    details.innerHTML = "<h2 class='loading'>No anime selected.</h2>";
  } else {
    fetchDetails(id);
  }

  async function fetchDetails(id) {
    try {
      details.innerHTML = "<h2 class='loading'>Loading... ⏳</h2>";

      const res = await fetch(`${BASE_URL}/anime/${id}`);
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);

      const data = await res.json();
      const anime = data.data;

      const titleBlock = learningMode
        ? `
        <h2>${anime.title_japanese || anime.title}</h2>
        <h3>${anime.title}</h3>
      `
        : `<h2>${anime.title}</h2>`;

      details.innerHTML = `
      ${titleBlock}
      <img src="${anime.images.jpg.large_image_url}" alt="${escapeHtml(anime.title)} cover image" />

      <p><strong>⭐ Score:</strong> ${anime.score || "N/A"}</p>
      <p><strong>Genres:</strong> ${anime.genres.map(g => g.name).join(", ")}</p>

      <p>${anime.synopsis || "No synopsis available."}</p>

      ${
        anime.trailer?.embed_url
          ? `<iframe width="100%" height="300" src="${anime.trailer.embed_url}" allowfullscreen></iframe>`
          : "<p>No trailer available</p>"
      }

      <button onclick="toggleFavorite(${anime.mal_id})">❤️ Toggle Favorite</button>
    `;
    } catch (error) {
      details.innerHTML = "<h2 class='loading'>Could not load anime details.</h2>";
      console.error(error);
    }
  }
}

// =========================
// ⭐ FAVORITES PAGE
// =========================
if (isFavorites) {
  const favGrid = document.getElementById("favGrid");

  loadFavorites();

  async function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.length === 0) {
      favGrid.innerHTML = "<h2>No favorites yet 😢</h2>";
      return;
    }

    let html = "";

    for (let id of favorites) {
      const res = await fetch(`${BASE_URL}/anime/${id}`);
      if (!res.ok) continue;
      const data = await res.json();
      const anime = data.data;

      html += `
        <div class="card">
          <img src="${anime.images.jpg.image_url}" alt="${escapeHtml(anime.title)} cover image" />
          <h3>${anime.title}</h3>
          <button onclick="viewDetails(${anime.mal_id})">Details</button>
          <button onclick="toggleFavorite(${anime.mal_id})">❌ Remove</button>
        </div>
      `;
    }

    favGrid.innerHTML = html;
  }
}

// =========================
// ⭐ FAVORITES
// =========================
function toggleFavorite(id) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  location.reload();
}

// =========================
// 🔗 NAVIGATION
// =========================
function viewDetails(id) {
  window.location.href = `details.html?id=${id}`;
}

// =========================
// 📚 MANGA PAGE
// =========================
const isManga = document.getElementById("mangaGrid");
const isMangaDetails = document.getElementById("mangaDetails");

if (isManga) {
  const grid = document.getElementById("mangaGrid");
  const searchInput = document.getElementById("searchManga");
  const genreChips = document.getElementById("mangaGenreChips");
  const clearGenreBtn = document.getElementById("clearMangaGenreBtn");

  let page = 1;
  let query = "";
  let mangaGenreId = null;

  fetchManga();
  initMangaGenres();

  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim();
    page = 1;
    fetchManga();
  });

  if (clearGenreBtn) {
    clearGenreBtn.addEventListener("click", () => {
      mangaGenreId = null;
      page = 1;
      updateMangaGenreSelectionUI();
      fetchManga();
    });
  }

  async function fetchManga() {
    try {
      grid.innerHTML = "<h2 class='loading'>Loading manga... ⏳</h2>";

      const params = new URLSearchParams();
      params.set("page", String(page));
      if (query) params.set("q", query);
      if (mangaGenreId) params.set("genres", String(mangaGenreId));

      const url = query || mangaGenreId
        ? `${BASE_URL}/manga?${params.toString()}`
        : `${BASE_URL}/top/manga?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);

      const data = await res.json();
      const mangaList = Array.isArray(data.data) ? data.data : [];
      displayManga(mangaList);
    } catch (error) {
      grid.innerHTML = "<h2 class='loading'>Could not load manga. Please try again.</h2>";
      console.error(error);
    }
  }

  function updateMangaGenreSelectionUI() {
    if (!genreChips) return;
    genreChips.querySelectorAll("button.genre-chip").forEach(btn => {
      const isSelected = btn.dataset.genreId === String(mangaGenreId);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
    if (clearGenreBtn) clearGenreBtn.hidden = !mangaGenreId;
  }

  async function initMangaGenres() {
    if (!genreChips) return;
    genreChips.innerHTML = `<span class="loading" style="padding: 6px 0;">Loading genres...</span>`;

    try {
      const res = await fetch(`${BASE_URL}/genres/manga`);
      if (!res.ok) throw new Error(`Genre request failed: ${res.status}`);
      const data = await res.json();
      const genres = Array.isArray(data.data) ? data.data : [];

      genres.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      genreChips.innerHTML = "";
      for (const genre of genres) {
        if (!genre?.mal_id || !genre?.name) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "genre-chip";
        btn.textContent = genre.name;
        btn.dataset.genreId = String(genre.mal_id);
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", () => {
          const clickedId = Number(btn.dataset.genreId);
          mangaGenreId = mangaGenreId === clickedId ? null : clickedId;
          page = 1;
          updateMangaGenreSelectionUI();
          fetchManga();
        });
        genreChips.appendChild(btn);
      }

      updateMangaGenreSelectionUI();
    } catch (error) {
      console.error(error);
      genreChips.innerHTML = `<span class="loading" style="padding: 6px 0;">Could not load genres.</span>`;
      if (clearGenreBtn) clearGenreBtn.hidden = true;
    }
  }

  function displayManga(list) {
    grid.innerHTML = "";

    list.forEach(manga => {
      const title = learningMode
        ? `
          <h3>${manga.title_japanese || manga.title}</h3>
          <small>${manga.title}</small>
        `
        : `<h3>${manga.title}</h3>`;

      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${manga.images.jpg.image_url}" alt="${escapeHtml(manga.title)} cover image" />
        ${title}
        <p>⭐ ${manga.score || "N/A"}</p>
        <button onclick="viewMangaDetails(${manga.mal_id})">Details</button>
      `;

      grid.appendChild(card);
    });
  }
}

// =========================
// 📄 MANGA DETAILS
// =========================
if (isMangaDetails) {
  const container = document.getElementById("mangaDetails");
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    container.innerHTML = "<h2 class='loading'>No manga selected.</h2>";
  } else {
    fetchMangaDetails(id);
  }

  async function fetchMangaDetails(id) {
    try {
      container.innerHTML = "<h2 class='loading'>Loading... ⏳</h2>";

      const res = await fetch(`${BASE_URL}/manga/${id}`);
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);

      const data = await res.json();
      const manga = data.data;

      const titleBlock = learningMode
        ? `
        <h2>${manga.title_japanese || manga.title}</h2>
        <h3>${manga.title}</h3>
      `
        : `<h2>${manga.title}</h2>`;

      container.innerHTML = `
      ${titleBlock}
      <img src="${manga.images.jpg.large_image_url}" alt="${escapeHtml(manga.title)} cover image" />

      <p><strong>⭐ Score:</strong> ${manga.score || "N/A"}</p>
      <p><strong>Chapters:</strong> ${manga.chapters || "Unknown"}</p>
      <p><strong>Status:</strong> ${manga.status || "Unknown"}</p>

      <p>${manga.synopsis || "No synopsis available."}</p>

      <a href="${manga.url}" target="_blank" rel="noopener noreferrer">
        <button>📖 Read on MyAnimeList</button>
      </a>
    `;
    } catch (error) {
      container.innerHTML = "<h2 class='loading'>Could not load manga details.</h2>";
      console.error(error);
    }
  }
}

// =========================
// 🔗 NAVIGATION (MANGA)
// =========================
function viewMangaDetails(id) {
  window.location.href = `manga-details.html?id=${id}`;
}

