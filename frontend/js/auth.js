// CodeRabbit Integration
console.log("CodeRabbit: Active - Monitoring code quality in background")

// --- Removed: Globe Canvas Setup & Animation ---
// const canvas = document.getElementById("globeCanvas")
// const ctx = canvas.getContext("2d")
// function resizeCanvas() { ... }
// class Globe { ... }
// const globe = new Globe(); globe.animate();

// Tab Switching
const tabBtns = document.querySelectorAll(".tab-btn")
const authForms = document.querySelectorAll(".auth-form")

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.getAttribute("data-tab")

    // Update active states
    tabBtns.forEach((b) => b.classList.remove("active"))
    authForms.forEach((f) => f.classList.remove("active"))

    btn.classList.add("active")
    document.getElementById(targetTab + "Form").classList.add("active")
  })
})

// Password Toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", function () {
    const input = this.parentElement.querySelector(".form-input")
    const type = input.getAttribute("type") === "password" ? "text" : "password"
    input.setAttribute("type", type)

    // Update icon
    const svg = this.querySelector("svg")
    if (type === "text") {
      svg.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `
    } else {
      svg.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `
    }
  })
})

// Password Strength Checker
const signupPassword = document.getElementById("signupPassword")
const passwordStrength = document.querySelector(".password-strength")
const strengthProgress = document.querySelector(".strength-progress")
const strengthText = document.querySelector(".strength-text")

signupPassword?.addEventListener("input", function () {
  const password = this.value
  let strength = 0

  if (password.length > 0) {
    passwordStrength.classList.add("show")
  } else {
    passwordStrength.classList.remove("show")
    return
  }

  if (password.length >= 8) strength += 25
  if (password.match(/[a-z]+/)) strength += 25
  if (password.match(/[A-Z]+/)) strength += 25
  if (password.match(/[0-9]+/)) strength += 25
  if (password.match(/[$@#&!]+/)) strength += 25
  strength = Math.min(strength, 100)

  strengthProgress.style.width = strength + "%"

  if (strength < 40) {
    strengthText.textContent = "Weak password"
    strengthProgress.style.background = "#ff4444"
  } else if (strength < 70) {
    strengthText.textContent = "Medium strength"
    strengthProgress.style.background = "#ffaa00"
  } else {
    strengthText.textContent = "Strong password"
    strengthProgress.style.background = "#00ff00"
  }
})

// Form Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function showError(input, message) {
  input.classList.add("invalid")
  input.classList.remove("valid")

  let errorElement = input.parentElement.querySelector(".error-message")
  if (!errorElement) {
    errorElement = document.createElement("div")
    errorElement.className = "error-message"
    input.parentElement.appendChild(errorElement)
  }
  errorElement.textContent = message
  errorElement.classList.add("show")
}

function showSuccess(input) {
  input.classList.add("valid")
  input.classList.remove("invalid")

  const errorElement = input.parentElement.querySelector(".error-message")
  if (errorElement) {
    errorElement.classList.remove("show")
  }
}

// Email validation on input
document.querySelectorAll('input[type="email"]').forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.value && !validateEmail(this.value)) {
      showError(this, "Please enter a valid email address")
    } else if (this.value) {
      showSuccess(this)
    }
  })
})

// Utilities for banner messages
function showBanner(message, type = "info") {
  const banner = document.getElementById("authBanner")
  if (!banner) return
  banner.textContent = message
  banner.style.display = "block"
  banner.className = `auth-banner ${type}`
}
function hideBanner() {
  const banner = document.getElementById("authBanner")
  if (!banner) return
  banner.style.display = "none"
  banner.textContent = ""
  banner.className = "auth-banner"
}

// Token helpers
const TOKEN_KEY = "auth_token"
function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

const MAIN_PAGE = window.MAIN_PAGE || "index.html"
const API_BASE = (window.AUTH_API_BASE || "http://54.221.61.226:8081").replace(/\/$/, "")

document.addEventListener("DOMContentLoaded", () => {
  // --- Get all HTML elements ---
  const tabButtons = document.querySelectorAll(".tab-btn")
  const authForms = document.querySelectorAll(".auth-form")
  const signinForm = document.getElementById("signinForm")
  const signupForm = document.getElementById("signupForm")
  const successMessage = document.getElementById("successMessage")
  const authBanner = document.getElementById("authBanner")

  // --- Helper function to show messages ---
  function showBanner(message, type = "error") {
    if (!authBanner) return
    authBanner.textContent = message
    authBanner.className = `auth-banner ${type}`
    authBanner.style.display = "block"
  }

  // --- Tab Switching Logic ---
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")
      const tab = button.dataset.tab
      authForms.forEach((form) => {
        form.classList.toggle("active", form.id === `${tab}Form`)
      })
    })
  })
  // Check if user is already signed in
  ;(async function checkSignedIn() {
    const token = getToken()
    if (!token) return
    try {
      const resp = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        showBanner("You are already signed in.", "info")
        setTimeout(() => (window.location.href = MAIN_PAGE), 1000)
      }
    } catch {}
  })()

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      hideBanner()

      const name = document.getElementById("signupName").value.trim()
      const email = document.getElementById("signupEmail").value.trim()
      const password = document.getElementById("signupPassword").value
      const confirmPassword = document.getElementById("confirmPassword")?.value

      if (confirmPassword && password !== confirmPassword) {
        showBanner("Passwords do not match.", "error")
        return
      }

      const submitBtn = signupForm.querySelector(".auth-btn")
      submitBtn.classList.add("loading")
      submitBtn.disabled = true

      try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() || ""}` },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 409) {
            showBanner(data.msg || "Email already registered. Please sign in.", "error")
          } else if (response.status === 422) {
            showBanner(data.errors?.[0]?.msg || data.msg || "Please check your inputs.", "error")
          } else {
            showBanner(data.msg || "Registration failed. Please try again.", "error")
          }
        } else {
          if (data?.msg === "You are already signed in") {
            showBanner("You are already signed in.", "info")
            setTimeout(() => (window.location.href = MAIN_PAGE), 800)
            return
          }
          if (data.token) setToken(data.token)
          showBanner("Account created successfully! Redirecting...", "success")
          setTimeout(() => (window.location.href = MAIN_PAGE), 800)
        }
      } catch (error) {
        console.error("Error during registration:", error)
        showBanner("Could not connect to the registration server.", "error")
      } finally {
        submitBtn.classList.remove("loading")
        submitBtn.disabled = false
      }
    })
  }

  if (signinForm) {
    signinForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      hideBanner()

      const email = document.getElementById("signinEmail").value.trim()
      const password = document.getElementById("signinPassword").value

      const submitBtn = signinForm.querySelector(".auth-btn")
      submitBtn.classList.add("loading")
      submitBtn.disabled = true

      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            showBanner("Invalid email or password.", "error")
          } else if (response.status === 422) {
            showBanner(data.errors?.[0]?.msg || "Please check your inputs.", "error")
          } else {
            showBanner(data.msg || "Login failed. Check your credentials.", "error")
          }
        } else {
          if (data.token) setToken(data.token)
          showBanner("Login successful! Redirecting...", "success")
          setTimeout(() => (window.location.href = MAIN_PAGE), 600)
        }
      } catch (error) {
        console.error("Error during login:", error)
        showBanner("Could not connect to the login server. Ensure it is running.", "error")
      } finally {
        submitBtn.classList.remove("loading")
        submitBtn.disabled = false
      }
    })
  }

  // Social Login Handlers
  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const ripple = document.createElement("span")
      ripple.className = "btn-glow"
      this.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
      console.log("Social login clicked")
    })
  })

  // Forgot Password Handler
  document.querySelector(".forgot-link")?.addEventListener("click", (e) => {
    e.preventDefault()
    window.location.href = "forgot-password.html"
  })

  // (removed setInterval(createParticle, 500) and related DOM)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      console.log("CodeRabbit: Pausing background tasks")
    } else {
      console.log("CodeRabbit: Resuming background tasks")
    }
  })

  window.addEventListener("load", () => {
    console.log("Authentication UI Initialized")
  })
})
