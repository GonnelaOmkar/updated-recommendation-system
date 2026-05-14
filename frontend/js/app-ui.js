// DOM Elements
const loadingScreen = document.getElementById("loadingScreen");
const mainContent = document.getElementById("mainContent");
const categoryTabs = document.querySelectorAll(".category-tab");
const contentSections = document.querySelectorAll(".content-section");
const searchInput = document.getElementById("searchInput");
const recommendBtn = document.getElementById("recommendBtn");
const genreInput = document.getElementById("genreInput");
const genreRecommendBtn = document.getElementById("genreRecommendBtn");
const resultsGrid = document.getElementById("results-grid");
const suggestionsBox = document.getElementById("suggestions-box");
const explanationContainer = document.getElementById("explanation-container");

// API base with safe default and optional override via window.API_BASE
const DEFAULT_API_BASE = "http://54.221.61.226:8000";
const RAW_API_BASE = (typeof window !== "undefined" && window.API_BASE) || "";
const API_BASE = /^https?:\/\//.test(RAW_API_BASE)
  ? RAW_API_BASE.replace(/\/$/, "")
  : DEFAULT_API_BASE;

const AUTH_API_BASE = (window.AUTH_API_BASE || "http://54.221.61.226:8081").replace(/\/$/, "");

let activeCategory = "movies";
let selectedSuggestionIndex = -1;

// *** ADD THIS HELPER FUNCTION ***
// This was missing. It converts the category name for the API URL.
function categoryToPath(category) {
  if (category === "movies") return "movie";
  if (category === "books") return "book";
  if (category === "music") return "music";
  return category;
}

function showLoading() {
  document.getElementById('recommendationLoading').style.display = 'flex';
  recommendBtn.disabled = true;
  recommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  if (genreRecommendBtn) {
    genreRecommendBtn.disabled = true;
    genreRecommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  }
  searchInput.disabled = true;
  if (genreInput) genreInput.disabled = true;
}

function hideLoading() {
  setTimeout(() => {
    document.getElementById('recommendationLoading').style.display = 'none';
    recommendBtn.disabled = false;
    recommendBtn.innerHTML = '<i class="fas fa-bolt"></i> <span>Recommend</span> <div class="btn-shimmer"></div>';
    if (genreRecommendBtn) {
      genreRecommendBtn.disabled = false;
      genreRecommendBtn.innerHTML = '<i class="fas fa-random"></i> <span>Get Random Picks</span>';
    }
    searchInput.disabled = false;
    if (genreInput) genreInput.disabled = false;
  }, 1000); // Minimum 1 second to ensure visibility
}
// *** END OF ADDED FUNCTION ***

function getAuthToken() {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
}

function updateHeaderForUser() {
  const user = getCurrentUser();
  const navLinks = document.querySelector(".nav-links");

  if (user && navLinks) {
    navLinks.innerHTML = `
      <a href="index.html" class="nav-link active">Home</a>
      <a href="favorites.html" class="nav-link">Favorites</a>
      <div class="user-profile-nav" style="display: flex; align-items: center; gap: 12px;">
        <span style="color: rgba(226, 232, 240, 0.8); font-size: 0.95rem;">Hi, ${
          user.name || user.email
        }</span>
        <a href="profile.html" class="nav-link" style="display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-user-circle" style="font-size: 1.5rem;"></i>
          <span>Profile</span>
        </a>
      </div>
    `;
  }
}

function showToast(message, isRemoved = false) {
  const toast = document.createElement("div");
  toast.className = `toast-notification ${isRemoved ? "removed-toast" : ""}`;
  toast.innerHTML = `
    <i class="fas ${isRemoved ? "fa-heart-broken" : "fa-heart"}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

async function toggleFavorite(item, category) {
  const token = getAuthToken();

  if (!token) {
    alert("Please log in to save favorites!");
    window.location.href = "login.html";
    return;
  }

  const itemId =
    category === "movies"
      ? item.tmdbId
      : category === "books"
      ? item.isbn
      : item.track_id;
  const title = item.title || item.track_name || "Untitled";
  const posterUrl =
    category === "movies"
      ? item.posterUrl
      : category === "books"
      ? item.coverUrl
      : "";

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemType: categoryToPath(category),
        itemId: String(itemId || ""),
        title,
        posterUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.action === "added") {
        showToast("Added to favorites!");
        return true;
      } else {
        showToast("Removed from favorites", true);
        return false;
      }
    } else {
      console.error("[ORO] Favorite error:", await res.text());
      return null;
    }
  } catch (e) {
    console.error("[ORO] Favorite error:", e);
    return null;
  }
}

function showInputError() {
  alert("Please enter a valid query.");
}

// Loading Screen Animation
window.addEventListener("load", () => {
  updateHeaderForUser();

  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    loadingScreen.style.transform = "translateY(-100%)";

    setTimeout(() => {
      loadingScreen.style.display = "none";
      mainContent.style.display = "block";
      mainContent.style.opacity = "0";

      setTimeout(() => {
        mainContent.style.opacity = "1";
        mainContent.style.transition = "opacity 0.5s ease";
      }, 100);
    }, 500);
  }, 3000);
});

// Category Switching
categoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetCategory = tab.dataset.category;
    activeCategory = targetCategory;

    categoryTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    contentSections.forEach((section) => section.classList.remove("active"));

    const targetSection = document.getElementById(`${targetCategory}Section`);
    if (targetSection) {
      setTimeout(() => {
        targetSection.classList.add("active");
      }, 300);
    }

    updateSearchPlaceholder(targetCategory);
    triggerCategoryAnimations(targetCategory);
  });
});

function updateSearchPlaceholder(category) {
  const placeholders = {
    movies: "e.g., Inception, The Dark Knight, Interstellar...",
    books: "e.g., 1984, The Alchemist, Dune...",
    music: "e.g., Bohemian Rhapsody, Hotel California...",
  };
  searchInput.placeholder =
    placeholders[category] || "Search for recommendations...";
}

function triggerCategoryAnimations(category) {
  const animations = {
    movies: animateMovieEffects,
    books: animateBookEffects,
    music: animateMusicEffects,
  };
  if (animations[category]) animations[category]();
}

// (Animation and Particle functions remain the same)
function animateMovieEffects() {
  /*...your code...*/
}
function animateBookEffects() {
  /*...your code...*/
}
function animateMusicEffects() {
  /*...your code...*/
}
function createFilmParticles() {
  /*...your code...*/
}
function createTextParticles() {
  /*...your code...*/
}
function createMusicNotes() {
  /*...your code...*/
}
const particleFloatCSS = `@keyframes particleFloat { 0% { opacity: 0; } 100% { opacity: 0; } }`;
const style = document.createElement("style");
style.textContent = particleFloatCSS;
document.head.appendChild(style);
// (End of unchanged animation functions)

// Suggestion Helpers
function createSuggestionsEl() {
  const el = document.createElement("div");
  el.id = "searchSuggestions";
  el.className = "search-suggestions";
  Object.assign(el.style, {
    position: "fixed",
    zIndex: "10002",
    display: "none",
  });
  document.body.appendChild(el);
  return el;
}

function createGenreSuggestionsEl() {
  const el = document.createElement("div");
  el.id = "genreSuggestions";
  el.className = "genre-suggestions";
  Object.assign(el.style, {
    position: "fixed",
    zIndex: "10002",
    display: "none",
  });
  document.body.appendChild(el);
  return el;
}

function getSuggestionsEl() {
  return document.getElementById("searchSuggestions") || null;
}

function getGenreSuggestionsEl() {
  return document.getElementById("genreSuggestions") || null;
}

function hideSearchSuggestions() {
  const el = getSuggestionsEl();
  if (!el) return;
  el.style.display = "none";
  el.innerHTML = "";
  selectedSuggestionIndex = -1;
}

function hideGenreSuggestions() {
  const el = getGenreSuggestionsEl();
  if (!el) return;
  el.style.display = "none";
  el.innerHTML = "";
  selectedSuggestionIndex = -1;
}

function highlightSuggestion(index, isGenre = false) {
  const el = isGenre ? getGenreSuggestionsEl() : getSuggestionsEl();
  if (!el) return;
  const items = el.querySelectorAll(".suggestion-item");
  items.forEach((item, i) => {
    item.style.background =
      i === index ? "rgba(78,205,196,0.12)" : "transparent";
  });
}

function positionSuggestionsEl(isGenre = false) {
  const el = isGenre ? getGenreSuggestionsEl() : getSuggestionsEl();
  const input = isGenre ? genreInput : searchInput;
  if (!el || !input) return;
  const rect = input.getBoundingClientRect();
  el.style.left = `${Math.round(rect.left)}px`;
  el.style.top = `${Math.round(rect.bottom + 8)}px`;
  el.style.width = `${Math.round(rect.width)}px`;
}

async function showSearchSuggestions(query) {
  const suggestionsEl =
    document.getElementById("searchSuggestions") || createSuggestionsEl();
  positionSuggestionsEl();
  const endpoint = `${API_BASE}/search/${categoryToPath(
    activeCategory
  )}/${encodeURIComponent(query)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Suggestions fetch failed: ${res.status}`);
    const data = await res.json();
    const items = (data.results || []).slice(0, 10);
    if (!items.length) {
      hideSearchSuggestions();
      return;
    }
    suggestionsEl.innerHTML = items
      .map(
        (txt) => `<button type="button" class="suggestion-item">${txt}</button>`
      )
      .join("");
    suggestionsEl.style.display = "block";
    selectedSuggestionIndex = -1;
    suggestionsEl.querySelectorAll(".suggestion-item").forEach((btn) => {
      btn.onclick = () => {
        searchInput.value = btn.textContent;
        hideSearchSuggestions();
        recommendBtn.click();
      };
      btn.onmouseenter = () => (btn.style.background = "rgba(78,205,196,0.12)");
      btn.onmouseleave = () => (btn.style.background = "transparent");
    });
  } catch (e) {
    console.error("[ORO] suggestions error:", e);
    hideSearchSuggestions();
  }
}

async function showGenreSuggestions(query) {
  if (activeCategory === "movies") return;
  const suggestionsEl =
    document.getElementById("genreSuggestions") || createGenreSuggestionsEl();
  positionSuggestionsEl(true);
  const endpoint = `${API_BASE}/search/genre/${categoryToPath(
    activeCategory
  )}/${encodeURIComponent(query)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok)
      throw new Error(`Genre suggestions fetch failed: ${res.status}`);
    const data = await res.json();
    const items = (data.results || []).slice(0, 10);
    if (!items.length) {
      hideGenreSuggestions();
      return;
    }
    suggestionsEl.innerHTML = items
      .map(
        (txt) => `<button type="button" class="suggestion-item">${txt}</button>`
      )
      .join("");
    positionSuggestionsEl(true);
    suggestionsEl.style.display = "block";
    selectedSuggestionIndex = -1;
    suggestionsEl.querySelectorAll(".suggestion-item").forEach((btn) => {
      btn.onclick = () => {
        genreInput.value = btn.textContent;
        hideGenreSuggestions();
        genreRecommendBtn.click();
      };
      btn.onmouseenter = () => (btn.style.background = "rgba(78,205,196,0.12)");
      btn.onmouseleave = () => (btn.style.background = "transparent");
    });
  } catch (e) {
    console.error("[ORO] genre suggestions error:", e);
    hideGenreSuggestions();
  }
}

document.addEventListener("click", (e) => {
  if (e.target !== searchInput) hideSearchSuggestions();
  if (e.target !== genreInput) hideGenreSuggestions();
});

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length > 1) showSearchSuggestions(query);
  else hideSearchSuggestions();
});

genreInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length > 1 && activeCategory !== "movies")
    showGenreSuggestions(query);
  else hideGenreSuggestions();
});

searchInput.addEventListener("keydown", (e) => {
  const suggestionsEl = getSuggestionsEl();
  if (!suggestionsEl || suggestionsEl.style.display === "none") return;
  const items = suggestionsEl.querySelectorAll(".suggestion-item");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedSuggestionIndex = Math.min(
      selectedSuggestionIndex + 1,
      items.length - 1
    );
    highlightSuggestion(selectedSuggestionIndex);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
    highlightSuggestion(selectedSuggestionIndex);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0) items[selectedSuggestionIndex].click();
    else recommendBtn.click();
  } else if (e.key === "Escape") {
    hideSearchSuggestions();
  }
});

genreInput.addEventListener("keydown", (e) => {
  const suggestionsEl = getGenreSuggestionsEl();
  if (!suggestionsEl || suggestionsEl.style.display === "none") return;
  const items = suggestionsEl.querySelectorAll(".suggestion-item");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedSuggestionIndex = Math.min(
      selectedSuggestionIndex + 1,
      items.length - 1
    );
    highlightSuggestion(selectedSuggestionIndex, true);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
    highlightSuggestion(selectedSuggestionIndex, true);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0) items[selectedSuggestionIndex].click();
    else genreRecommendBtn.click();
  } else if (e.key === "Escape") {
    hideGenreSuggestions();
  }
});

recommendBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) {
    showInputError();
    return;
  }
  showLoading();
  try {
    await fetchAndRenderRecommendations(query, activeCategory);
  } finally {
    hideLoading();
  }
});

if (genreRecommendBtn) {
  genreRecommendBtn.addEventListener("click", async () => {
    const genre = genreInput.value.trim();
    if (!genre) {
      alert("Please enter a genre (e.g., Action, Romance, Jazz)");
      return;
    }
    showLoading();
    try {
      await fetchGenreRecommendations(genre, activeCategory);
    } finally {
      hideLoading();
    }
  });
}

async function fetchGenreRecommendations(genre, category) {
  const activeSection = document.querySelector(".content-section.active");
  const grid = activeSection?.querySelector(".content-grid");
  if (!grid) return;

  const endpoint = `${API_BASE}/recommend/genre/${categoryToPath(
    category
  )}/${encodeURIComponent(genre)}`;
  // Removed grid loading since we have overlay
  if (explanationContainer) explanationContainer.style.display = "none";

  try {
    const res = await fetch(endpoint, { credentials: "omit" });
    if (!res.ok) {
      showNotFoundError(`No ${category} found for genre: ${genre}.`);
      grid.innerHTML = "";
      return;
    }
    const data = await res.json();
    if (
      data.error ||
      !data.recommendations ||
      data.recommendations.length === 0
    ) {
      showNotFoundError(
        data.error || `No ${category} found for genre: ${genre}.`
      );
      grid.innerHTML = "";
      return;
    }

    grid.innerHTML = "";
    data.recommendations.forEach((rec, index) => {
      const card = createAPICard(rec, category);
      grid.appendChild(card);
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 100);
    });

    if (data.explanation && explanationContainer) {
      explanationContainer.innerHTML = `<div class="explanation-text">${data.explanation}</div>`;
      explanationContainer.style.display = "block";
    }
  } catch (e) {
    console.error("[ORO] genre recommendation error:", e);
    showNotFoundError("Failed to load genre recommendations.");
    grid.innerHTML = "";
  }
}

async function fetchAndRenderRecommendations(query, category) {
  const activeSection = document.querySelector(".content-section.active");
  const grid = activeSection?.querySelector(".content-grid");
  if (!grid) return;
  const endpoint = `${API_BASE}/recommend/${categoryToPath(
    category
  )}/${encodeURIComponent(query)}`;

  // Removed grid loading since we have overlay
  if (explanationContainer) explanationContainer.style.display = "none";

  try {
    const res = await fetch(endpoint, { credentials: "omit" });
    if (!res.ok) {
      showNotFoundError(`"${query}" not found. Try another item.`);
      grid.innerHTML = "";
      return;
    }
    const data = await res.json();
    if (
      data.error ||
      !data.recommendations ||
      data.recommendations.length === 0
    ) {
      showNotFoundError(
        data.error || `No recommendations found for "${query}".`
      );
      grid.innerHTML = "";
      return;
    }

    grid.innerHTML = "";
    data.recommendations.forEach((rec, index) => {
      const card = createAPICard(rec, category);
      grid.appendChild(card);
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 100);
    });

    if (data.explanation && explanationContainer) {
      explanationContainer.innerHTML = `<div class="explanation-text">${data.explanation}</div>`;
      explanationContainer.style.display = "block";
    }
  } catch (e) {
    console.error("[ORO] recommendation error:", e);
    showNotFoundError("Failed to load recommendations.");
    grid.innerHTML = "";
  }
}

function showNotFoundError(message) {
  const activeSection = document.querySelector(".content-section.active");
  const grid = activeSection?.querySelector(".content-grid");
  if (!grid) return;
  grid.innerHTML = `<div class="error-state">${message}</div>`; // Simplified error
}

// *** CORRECTED createAPICard FUNCTION ***
function createAPICard(rec, category) {
  const isMovie = category === "movies";

  // Create the outer column div first
  const col = document.createElement("div");
  col.className = "col-lg-4 col-md-6";
  col.style.cssText =
    "opacity:0; transform: translateY(30px); transition: all 0.5s ease;";

  const imageUrl =
    category === "movies"
      ? rec.posterUrl
      : category === "books"
      ? rec.coverUrl
      : "";
  const title =
    category === "music"
      ? rec.title || rec.track_name || "Track"
      : rec.title || "Recommendation";
  const subtitle =
    category === "movies"
      ? (rec.genres || "").toString()
      : category === "books"
      ? (rec.authors || "").toString()
      : [rec.artist_name, rec.genre].filter(Boolean).join(" • ");
  const mediaClass =
    category === "movies"
      ? "movie-poster"
      : category === "books"
      ? "book-cover"
      : "album-cover";
  const iconClass =
    category === "movies"
      ? "play-overlay"
      : category === "books"
      ? "bookmark-overlay"
      : "headphone-overlay";
  const leadingIcon =
    category === "movies"
      ? "fas fa-star"
      : category === "books"
      ? "fas fa-bookmark"
      : "fas fa-headphones";

  // Create the card's inner HTML content as a string
  const cardHTML = `
        <div class="card-glow"></div>
        <button class="favorite-btn" style="position: absolute; top: 16px; right: 16px; z-index: 10; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(4px);">
            <i class="fas fa-heart" style="color: rgba(255,107,107,0.8); font-size: 1.2rem; transition: all 0.3s;"></i>
        </button>
        <div class="card-content">
            <div class="${mediaClass}" style="${
    imageUrl
      ? `background-image:url('${imageUrl}');background-size:cover;background-position:center;`
      : ""
  }">
                <i class="${leadingIcon} ${iconClass}"></i>
            </div>
            <h3>${title}</h3>
            <p>${
              subtitle
                ? String(subtitle).slice(0, 80)
                : "AI-picked just for you."
            }</p>
            <div class="genre-tags">
                <span class="tag">AI-Powered</span>
                <span class="tag">${
                  category === "books"
                    ? "Books"
                    : category === "movies"
                    ? "Movies"
                    : "Music"
                }</span>
            </div>
        </div>
    `;

  // Create the main card element. It's an 'a' tag for movies, and a 'div' for others.
  const cardElement = document.createElement(isMovie ? "a" : "div");
  cardElement.className = "recommendation-card";
  cardElement.style.position = "relative"; // Needed for the button positioning

  if (isMovie) {
    cardElement.href = `movie-details.html?id=${rec.tmdbId}`;
    cardElement.classList.add("recommendation-link"); // Add class for styling
  }

  // Set the inner HTML
  cardElement.innerHTML = cardHTML;

  const favBtn = cardElement.querySelector(".favorite-btn");
  const heartIcon = favBtn.querySelector(".fa-heart");

  favBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await toggleFavorite(rec, category);

    if (result === true) {
      heartIcon.style.color = "rgba(255,77,77,1)";
      heartIcon.classList.add("fas");
      favBtn.style.transform = "scale(1.2)";
      setTimeout(() => (favBtn.style.transform = "scale(1)"), 200);
    } else if (result === false) {
      heartIcon.style.color = "rgba(255,107,107,0.8)";
      heartIcon.classList.remove("fas");
    }
  });

  col.appendChild(cardElement);
  return col;
}

let animationFrameId;

function optimizedAnimation() {
  if (!document.hidden) {
    // Update particle positions, etc.
  }

  animationFrameId = requestAnimationFrame(optimizedAnimation);
}

optimizedAnimation();
