// Favorites Page JavaScript

const AUTH_API_BASE = (window.AUTH_API_BASE || "http://54.221.61.226:8081").replace(/\/$/, "")
const DEFAULT_API_BASE = "http://54.221.61.226:8000"
const RAW_API_BASE = (typeof window !== "undefined" && window.API_BASE) || ""
const API_BASE = /^https?:\/\//.test(RAW_API_BASE) ? RAW_API_BASE.replace(/\/$/, "") : DEFAULT_API_BASE

function getAuthToken() {
  try {
    return localStorage.getItem("auth_token")
  } catch {
    return null
  }
}

function clearAuth() {
  try {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("currentUser")
  } catch {}
}

// Check if user is logged in
async function checkAuth() {
  const token = getAuthToken()
  if (!token) {
    window.location.href = "login.html"
    return null
  }

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      clearAuth()
      window.location.href = "login.html"
      return null
    }

    const user = await res.json()
    return user
  } catch (e) {
    console.error("[Favorites] Auth check failed:", e)
    clearAuth()
    window.location.href = "login.html"
    return null
  }
}

// Update header with user info
function updateHeaderForUser() {
  const user = getCurrentUser()
  const navLinks = document.querySelector(".nav-links")

  if (user && navLinks) {
    navLinks.innerHTML = `
      <a href="index.html" class="nav-link">Home</a>
      <a href="favorites.html" class="nav-link active">Favorites</a>
      <div class="user-profile-nav" style="display: flex; align-items: center; gap: 12px;">
        <span style="color: rgba(226, 232, 240, 0.8); font-size: 0.95rem;">Hi, ${user.name || user.email}</span>
        <a href="profile.html" class="nav-link" style="display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-user-circle" style="font-size: 1.5rem;"></i>
          <span>Profile</span>
        </a>
      </div>
    `
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem("currentUser")
  return userStr ? JSON.parse(userStr) : null
}

// Load favorites
async function loadFavorites(filter = "all") {
  const token = getAuthToken()
  if (!token) return

  const grid = document.getElementById("favoritesGrid")
  const countEl = document.getElementById("favoritesCount")

  grid.innerHTML =
    '<div class="loading-favorites"><i class="fas fa-spinner fa-spin"></i><p>Loading your favorites...</p></div>'

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      throw new Error("Failed to load favorites")
    }

    const data = await res.json()
    let favorites = data.favorites || []

    // Filter favorites
    if (filter !== "all") {
      favorites = favorites.filter((fav) => fav.itemType === filter)
    }

    // Sort by most recent
    favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))

    // Update count
    countEl.textContent = favorites.length

    // Render favorites
    if (favorites.length === 0) {
      grid.innerHTML = `
        <div class="empty-favorites">
          <i class="fas fa-heart-broken"></i>
          <h3>No favorites yet</h3>
          <p>Start exploring and add items to your favorites!</p>
          <a href="index.html" class="explore-btn">
            <i class="fas fa-compass"></i>
            <span>Explore Now</span>
          </a>
        </div>
      `
      return
    }

    grid.innerHTML = ""
    favorites.forEach((fav, index) => {
      const card = createFavoriteCard(fav)
      card.style.animationDelay = `${index * 0.1}s`
      grid.appendChild(card)
    })
  } catch (e) {
    console.error("[Favorites] Failed to load favorites:", e)
    grid.innerHTML = `
      <div class="empty-favorites">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Failed to load favorites</h3>
        <p>Please try again later</p>
      </div>
    `
  }
}

// Create favorite card
function createFavoriteCard(fav) {
  const card = document.createElement("div")
  card.className = "favorite-card"
  card.dataset.type = fav.itemType

  const metadata = fav.metadata || {}
  const imageUrl = fav.itemType === "movie" ? metadata.posterUrl : fav.itemType === "book" ? metadata.coverUrl : ""
  const icon = fav.itemType === "movie" ? "fas fa-film" : fav.itemType === "book" ? "fas fa-book" : "fas fa-music"

  // Format date
  const addedDate = new Date(fav.addedAt)
  const formattedDate = addedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  card.innerHTML = `
    <div class="favorite-image" style="${imageUrl ? `background-image: url('${imageUrl}');` : ""}">
      ${!imageUrl ? `<i class="${icon}"></i>` : ""}
      <button class="remove-favorite-btn" data-id="${fav._id}">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="favorite-content">
      <h3 class="favorite-title">${fav.title}</h3>
      <div class="favorite-meta">
        <span class="favorite-type">
          <i class="${icon}"></i>
          ${fav.itemType}
        </span>
        <span class="favorite-date">${formattedDate}</span>
      </div>
    </div>
  `

  // Remove favorite handler
  const removeBtn = card.querySelector(".remove-favorite-btn")
  removeBtn.addEventListener("click", async (e) => {
    e.stopPropagation()
    await removeFavorite(fav._id)
    card.style.opacity = "0"
    card.style.transform = "scale(0.8)"
    setTimeout(() => {
      card.remove()
      // Check if grid is empty
      const remaining = document.querySelectorAll(".favorite-card")
      if (remaining.length === 0) {
        const currentFilter = document.querySelector(".filter-btn.active").dataset.filter
        loadFavorites(currentFilter)
      } else {
        // Update count
        const countEl = document.getElementById("favoritesCount")
        countEl.textContent = remaining.length
      }
    }, 300)
  })

  return card
}

// Remove favorite
async function removeFavorite(id) {
  const token = getAuthToken()
  if (!token) return

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      console.log("[Favorites] Removed from favorites")
      showToast("Removed from favorites", true)
    }
  } catch (e) {
    console.error("[Favorites] Failed to remove favorite:", e)
  }
}

// Show toast notification
function showToast(message, isRemoved = false) {
  const toast = document.createElement("div")
  toast.className = `toast-notification ${isRemoved ? "removed-toast" : ""}`
  toast.innerHTML = `
    <i class="fas ${isRemoved ? "fa-heart-broken" : "fa-heart"}"></i>
    <span>${message}</span>
  `
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    background: ${isRemoved ? "rgba(255, 107, 107, 0.95)" : "rgba(78, 205, 196, 0.95)"};
    color: #ffffff;
    padding: 16px 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// Add toast animations
const style = document.createElement("style")
style.textContent = `
@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}
`
document.head.appendChild(style)

// Helper to build simple recommendation cards in favorites page
function createPersonalizedCard(rec, type) {
  const card = document.createElement("div")
  card.className = "personalized-card"

  let mediaUrl = ""
  let title = ""
  let sub = ""

  if (type === "movie") {
    title = rec.title || "Untitled"
    mediaUrl = rec.posterUrl || ""
    sub = rec.genres || ""
  } else if (type === "book") {
    title = rec.title || "Untitled"
    mediaUrl = rec.coverUrl || ""
    sub = rec.authors || rec.category || ""
  } else if (type === "music") {
    // API returns 'title' (renamed from track_name)
    title = rec.title || rec.track_name || "Untitled"
    mediaUrl = "" // music doesn't have cover images
    sub = [rec.artist_name, rec.genre].filter(Boolean).join(" • ")
  }

  const icon = type === "movie" ? "fa-film" : type === "book" ? "fa-book" : "fa-music"

  card.innerHTML = `
    <div class="personalized-media" style="${mediaUrl ? `background-image:url('${mediaUrl}')` : ""}">
      ${!mediaUrl ? `<i class="fas ${icon}"></i>` : ""}
    </div>
    <div class="personalized-body">
      <div class="personalized-title">${title}</div>
      <div class="personalized-sub">${sub || "AI-picked just for you"}</div>
      <button class="add-fav-btn"><i class="fas fa-heart"></i> Add to Favorites</button>
    </div>
  `

  card.querySelector(".add-fav-btn").addEventListener("click", async (e) => {
    e.stopPropagation()
    const token = getAuthToken()
    if (!token) {
      window.location.href = "login.html"
      return
    }

    // Extract the correct itemId based on type
    let itemId = ""
    if (type === "movie") {
      itemId = String(rec.tmdbId || "")
    } else if (type === "book") {
      itemId = String(rec.isbn || "")
    } else if (type === "music") {
      itemId = String(rec.track_id || "")
    }

    if (!itemId) {
      console.error("[Favorites] No valid itemId found for:", rec)
      showToast("Failed to add to favorites", true)
      return
    }

    try {
      const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemType: type,
          itemId: itemId,
          title: title,
          posterUrl: mediaUrl || "",
        }),
      })
      if (res.ok) {
        showToast("Added to favorites!")
        // Update the button to show it's added
        e.target.innerHTML = '<i class="fas fa-check"></i> Added!'
        e.target.disabled = true
        e.target.style.opacity = "0.6"
      } else {
        const errorData = await res.json()
        console.error("[Favorites] Add failed:", errorData)
        showToast("Failed to add to favorites", true)
      }
    } catch (err) {
      console.error("[Favorites] quick add failed:", err)
      showToast("Failed to add to favorites", true)
    }
  })

  return card
}

// Filter favorites
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    loadFavorites(btn.dataset.filter)

    const container = document.getElementById("personalizedResults")
    if (container) container.style.display = "none"
  })
})

// Click handler for Personalized Picks
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("personalizedBtn")
  const container = document.getElementById("personalizedResults")
  if (!btn || !container) return

  btn.addEventListener("click", async () => {
    const token = getAuthToken()
    if (!token) {
      window.location.href = "login.html"
      return
    }

    // Get current filter; default to movies
    let active = document.querySelector(".filter-btn.active")?.dataset.filter || "movie"
    if (active === "all") active = "movie"

    container.style.display = "grid"
    container.innerHTML = `
      <div class="personalized-card" style="grid-column: 1/-1; text-align:center; padding:20px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: rgba(78,205,196,0.9)"></i>
        <div style="margin-top:8px;color:rgba(226,232,240,0.75)">Curating personalized ${active} picks...</div>
      </div>
    `

    try {
      const res = await fetch(`${API_BASE}/recommend/favorites/random/${active}?token=${encodeURIComponent(token)}`)

      if (!res.ok && res.status !== 404) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        container.innerHTML = `
          <div style="grid-column:1/-1; color: rgba(226,232,240,0.8); padding: 20px; text-align: center;">
            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>${data.error}</p>
            <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">Add more ${active}s to your favorites to get personalized recommendations!</p>
          </div>
        `
        return
      }

      const recs = data.recommendations || []

      if (recs.length === 0) {
        container.innerHTML = `
          <div style="grid-column:1/-1; color: rgba(226,232,240,0.8); padding: 20px; text-align: center;">
            <i class="fas fa-heart-broken" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>No recommendations available yet.</p>
            <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">Add more ${active}s to your favorites first!</p>
          </div>
        `
        return
      }

      container.innerHTML = ""
      recs.forEach((rec) => {
        try {
          const card = createPersonalizedCard(rec, active)
          container.appendChild(card)
        } catch (err) {
          console.error("[Favorites] Failed to create card for:", rec, err)
        }
      })
    } catch (e) {
      console.error("[Favorites] personalized picks error:", e)
      container.innerHTML = `
        <div style="grid-column:1/-1; color: rgba(226,232,240,0.8); padding: 20px; text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>Failed to load recommendations.</p>
          <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">Please try again later.</p>
        </div>
      `
    }
  })
})

// Initialize favorites page
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth()
  updateHeaderForUser()
  await loadFavorites("all")
})
