document.addEventListener("DOMContentLoaded", () => {
  // Password toggle functionality
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target
      const input = document.getElementById(targetId)
      const svg = btn.querySelector("svg")

      if (input.getAttribute('type') === "password") {
        input.setAttribute('type', 'text')
        svg.innerHTML = `
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
              `
      } else {
        input.setAttribute('type', 'password')
        svg.innerHTML = `
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
              `
      }
    })
  })

  // Password strength indicator (only on signup page)
  const signupPassword = document.getElementById("signupPassword")
  const strengthContainer = document.getElementById("passwordStrength")
  const strengthProgress = document.getElementById("strengthProgress")
  const strengthText = document.getElementById("strengthText")

  if (signupPassword && strengthContainer) {
    signupPassword.addEventListener("input", (e) => {
      const password = e.target.value

      if (password.length === 0) {
        strengthContainer.style.display = "none"
        return
      }

      strengthContainer.style.display = "block"

      let strength = 0
      if (password.length >= 8) strength += 25
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
      if (/\d/.test(password)) strength += 25
      if (/[^a-zA-Z0-9]/.test(password)) strength += 25

      strengthProgress.style.width = strength + "%"

      if (strength <= 25) {
        strengthText.textContent = "Weak password"
        strengthProgress.style.background = "#ff4444"
      } else if (strength <= 50) {
        strengthText.textContent = "Fair password"
        strengthProgress.style.background = "#ffaa00"
      } else if (strength <= 75) {
        strengthText.textContent = "Good password"
        strengthProgress.style.background = "#4ecdc4"
      } else {
        strengthText.textContent = "Strong password"
        strengthProgress.style.background = "#00ff00"
      }
    })
  }

  // Confirm password validation (only on signup page)
  const confirmPassword = document.getElementById("confirmPassword")
  if (confirmPassword && signupPassword) {
    confirmPassword.addEventListener("blur", () => {
      if (confirmPassword.value && confirmPassword.value !== signupPassword.value) {
        confirmPassword.style.borderColor = "#ff4444"
      } else if (confirmPassword.value) {
        confirmPassword.style.borderColor = "rgba(78, 205, 196, 0.6)"
      }
    })
  }

  // Social login handlers
  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("Social login clicked:", this.title)
      // Add your social login logic here
    })
  })
})
