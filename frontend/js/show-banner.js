document.addEventListener("DOMContentLoaded", () => {
  // Determine which page we're on by checking for a specific form
  const isLoginPage = !!document.getElementById("signinForm")
  const isForgotPage = !!document.getElementById("forgotPasswordForm")
  const isResetPage = !!document.getElementById("resetPasswordForm")

  const authBanner = document.getElementById("authBanner")

  function showBanner(message, type = "error") {
    if (!authBanner) return
    authBanner.textContent = message
    authBanner.className = `auth-banner ${type}`
    authBanner.style.display = "block"
  }

  const API_BASE = (window.AUTH_API_BASE || "http://54.221.61.226:8081").replace(/\/$/, "")

  // --- LOGIC FOR THE MAIN LOGIN/SIGNUP PAGE ---
  if (isLoginPage) {
    const signinForm = document.getElementById("signinForm")
    const signupForm = document.getElementById("signupForm")
    // (All of your existing signin, signup, and tab-switching logic goes here)
  }

  // --- LOGIC FOR THE FORGOT PASSWORD PAGE ---
  if (isForgotPage) {
    const forgotForm = document.getElementById("forgotPasswordForm")
    forgotForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      const email = document.getElementById("resetEmail").value
      try {
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const data = await response.json()
        showBanner(data.msg, "success")
      } catch (error) {
        showBanner("Could not connect to the server.", "error")
      }
    })
  }

  // --- LOGIC FOR THE RESET PASSWORD PAGE ---
  if (isResetPage) {
    const resetForm = document.getElementById("resetPasswordForm")
    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      const newPassword = document.getElementById("newPassword").value
      const confirmPassword = document.getElementById("confirmNewPassword").value

      if (newPassword !== confirmPassword) {
        return showBanner("Passwords do not match.", "error")
      }

      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get("token")

      if (!token) {
        return showBanner("Invalid or missing reset token in the URL.", "error")
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        })
        const data = await response.json()
        if (!response.ok) {
          showBanner(data.msg, "error")
        } else {
          showBanner("Password reset successfully! Redirecting to login...", "success")
          setTimeout(() => {
            window.location.href = "login.html"
          }, 3000)
        }
      } catch (error) {
        showBanner("Could not connect to the server.", "error")
      }
    })
  }
})
