// Profile Page JavaScript

const AUTH_API_BASE = (window.AUTH_API_BASE || "").replace(/\/$/, "")

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
    const res = await fetch(`/api/auth/me`, {
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
    console.error("[Profile] Auth check failed:", e)
    clearAuth()
    window.location.href = "login.html"
    return null
  }
}

// Load user info
async function loadUserInfo() {
  const user = await checkAuth()
  if (!user) return

  document.getElementById("userName").textContent = user.name || "User"
  document.getElementById("userEmail").textContent = user.email || ""
}

// Change password
document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const currentPassword = document.getElementById("currentPassword").value
  const newPassword = document.getElementById("newPassword").value
  const confirmNewPassword = document.getElementById("confirmNewPassword").value
  const messageEl = document.getElementById("passwordMessage")

  if (newPassword !== confirmNewPassword) {
    messageEl.textContent = "New passwords do not match"
    messageEl.className = "message error"
    messageEl.style.display = "block"
    return
  }

  if (newPassword.length < 6) {
    messageEl.textContent = "Password must be at least 6 characters"
    messageEl.className = "message error"
    messageEl.style.display = "block"
    return
  }

  const token = getAuthToken()
  if (!token) return

  try {
    const res = await fetch(`/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()

    if (res.ok) {
      messageEl.textContent = "Password changed successfully!"
      messageEl.className = "message success"
      messageEl.style.display = "block"
      document.getElementById("changePasswordForm").reset()
    } else {
      messageEl.textContent = data.msg || "Failed to change password"
      messageEl.className = "message error"
      messageEl.style.display = "block"
    }
  } catch (e) {
    console.error("[Profile] Password change failed:", e)
    messageEl.textContent = "Failed to change password. Please try again."
    messageEl.className = "message error"
    messageEl.style.display = "block"
  }
})

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearAuth()
  window.location.href = "login.html"
})

// Initialize profile page
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserInfo()
})
