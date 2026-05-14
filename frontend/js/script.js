import feather from "feather-icons"

document.addEventListener("DOMContentLoaded", () => {
  // --- INITIALIZE UI LIBRARIES ---
  feather.replace()
  // VANTA.GLOBE({
  //     el: ".vanta-background",
  //     mouseControls: true, touchControls: true, gyroControls: false,
  //     minHeight: 200.00, minWidth: 200.00, scale: 1.00,
  //     scaleMobile: 1.00, color: 0x3a86ff, backgroundColor: 0x0
  // });

  // --- VIDEO INTRO LOGIC ---
  const introContainer = document.getElementById("intro-container")
  const introVideo = document.getElementById("intro-video")
  if (introVideo) {
    introVideo.addEventListener("ended", () => {
      introContainer.classList.add("fade-out")
      setTimeout(() => {
        introContainer.style.display = "none"
      }, 1000)
    })
  }

  // --- GET RECOMMENDER HTML ELEMENTS ---
  const movieInput = document.getElementById("movie-input")
  const movieSuggestionsBox = document.getElementById("movie-suggestions-box")
  const movieRecommendBtn = document.getElementById("movie-recommend-btn")

  const bookInput = document.getElementById("book-input")
  const bookSuggestionsBox = document.getElementById("book-suggestions-box")
  const bookRecommendBtn = document.getElementById("book-recommend-btn")

  const musicInput = document.getElementById("music-input")
  const musicSuggestionsBox = document.getElementById("music-suggestions-box")
  const musicRecommendBtn = document.getElementById("music-recommend-btn")

  const resultsGrid = document.getElementById("results-grid")
  const explanationContainer = document.getElementById("explanation-container")
  const loader = document.getElementById("loader")
  const timerSpan = document.getElementById("timer")
  const statusMessage = document.getElementById("status-message")

  let timerInterval

  // --- HELPER FUNCTIONS ---
  function debounce(func, delay = 300) {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }

  function startLoading() {
    let seconds = 0
    timerSpan.textContent = "0s"
    loader.classList.remove("d-none")
    resultsGrid.innerHTML = ""
    explanationContainer.style.display = "none"
    statusMessage.innerHTML = ""
    timerInterval = setInterval(() => {
      seconds++
      timerSpan.textContent = `${seconds}s`
    }, 1000)
    return timerInterval
  }

  function stopLoading(intervalId) {
    clearInterval(intervalId)
    loader.classList.add("d-none")
  }

  function displayResults(items) {
    resultsGrid.innerHTML = ""
    if (!Array.isArray(items) || items.length === 0) {
      resultsGrid.innerHTML = `<div class="col-12"><p class="text-muted text-center">No results to display.</p></div>`
      return
    }
    items.forEach((item) => {
      const col = document.createElement("div")
      col.className = "col"
      const card = document.createElement("div")
      card.className = "card h-100 bg-dark-subtle text-white"
      const poster = document.createElement("img")
      poster.src = item.posterUrl || item.coverUrl || "https://via.placeholder.com/500x750.png?text=No+Image"
      poster.className = "card-img-top"
      poster.alt = item.title || item.track_name
      const cardBody = document.createElement("div")
      cardBody.className = "card-body"
      const title = document.createElement("h6")
      title.className = "card-title"
      title.textContent = item.title || item.track_name
      const genres = document.createElement("p")
      genres.className = "card-text small text-muted"
      genres.textContent = item.genres || item.authors || item.artist_name || ""
      cardBody.appendChild(title)
      cardBody.appendChild(genres)
      card.appendChild(poster)
      card.appendChild(cardBody)
      col.appendChild(card)
      resultsGrid.appendChild(col)
    })
  }

  // --- REUSABLE AUTOCOMPLETE FUNCTION ---
  function setupAutocomplete(inputEl, suggestionsBoxEl, type) {
    let activeIndex = -1

    const handleInput = async (event) => {
      const query = event.target.value
      if (query.length < 2) {
        suggestionsBoxEl.innerHTML = ""
        return
      }
      try {
        // --- THIS IS THE FIX ---
        // Use port 8001 for all fetch calls
        const response = await fetch(`/api/ml/search/${type}/${query}`)
        const data = await response.json()
        const suggestions = data.results || []
        suggestionsBoxEl.innerHTML = ""
        activeIndex = -1
        if (suggestions.length > 0) {
          suggestions.forEach((title) => {
            const item = document.createElement("div")
            item.className = "suggestion-item"
            item.textContent = title
            item.addEventListener("click", () => {
              inputEl.value = title
              suggestionsBoxEl.innerHTML = ""
              if (type === "movie") movieRecommendBtn.click()
              if (type === "book") bookRecommendBtn.click()
            })
            suggestionsBoxEl.appendChild(item)
          })
        }
      } catch (error) {
        console.error(`Error fetching ${type} suggestions:`, error)
      }
    }

    inputEl.addEventListener("input", debounce(handleInput))

    inputEl.addEventListener("keydown", (e) => {
      const items = suggestionsBoxEl.querySelectorAll(".suggestion-item")
      if (items.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        activeIndex = (activeIndex + 1) % items.length
        updateActiveSuggestion(items)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        activeIndex = (activeIndex - 1 + items.length) % items.length
        updateActiveSuggestion(items)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (activeIndex > -1 && items[activeIndex]) {
          items[activeIndex].click()
        }
      }
    })

    function updateActiveSuggestion(items) {
      items.forEach((item, index) => {
        if (index === activeIndex) {
          item.classList.add("active")
        } else {
          item.classList.remove("active")
        }
      })
    }
  }

  // --- SETUP AUTOCOMPLETE FOR EACH TAB ---
  setupAutocomplete(movieInput, movieSuggestionsBox, "movie")
  setupAutocomplete(bookInput, bookSuggestionsBox, "book")
  // We will set up music later

  // --- REUSABLE RECOMMENDATION LOGIC ---
  async function fetchAndDisplayMovieRecs(movieTitle) {
    if (!movieTitle) return

    const timer = startLoading()
    let finalSeconds = 0
    try {
      // --- THIS IS THE FIX ---
      const response = await fetch(`/api/ml/recommend/movie/${movieTitle}`)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const data = await response.json()
      if (data.error) {
        resultsGrid.innerHTML = `<div class="col-12"><p class="error-message">${data.error}</p></div>`
      } else {
        if (data.explanation) {
          explanationContainer.innerHTML = `<p>${data.explanation}</p>`
          explanationContainer.style.display = "block"
        }
        displayResults(data.recommendations)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      resultsGrid.innerHTML = `<div class="col-12"><p class="error-message">Could not connect to or process data from the API server.</p></div>`
    } finally {
      finalSeconds = Number.parseInt(timerSpan.textContent) || 0
      stopLoading(timer)
      if (!resultsGrid.innerHTML.includes("error-message")) {
        statusMessage.textContent = `Recommendations loaded in ${finalSeconds} seconds.`
      }
    }
  }

  // --- MOVIE RECOMMENDATION BUTTON ---
  movieRecommendBtn.addEventListener("click", () => {
    fetchAndDisplayMovieRecs(movieInput.value)
  })

  // --- NEW: BOOK RECOMMENDATION BUTTON (LIVE) ---
  bookRecommendBtn.addEventListener("click", async () => {
    const bookTitle = bookInput.value
    if (!bookTitle) return alert("Please enter a book title.")

    const timer = startLoading()
    let finalSeconds = 0
    try {
      // --- THIS IS THE FIX ---
      const response = await fetch(`/api/ml/recommend/book/${bookTitle}`)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const data = await response.json()

      if (data.error) {
        resultsGrid.innerHTML = `<p class="error-message">${data.error}</p>`
      } else {
        // --- SHOW EXPLANATION FOR BOOKS ---
        if (data.explanation) {
          explanationContainer.innerHTML = `<div class="alert alert-info">${data.explanation}</div>`
          explanationContainer.style.display = "block"
        }
        displayResults(data.recommendations)
      }
    } catch (error) {
      console.error("Error fetching book recommendations:", error)
      resultsGrid.innerHTML = `<p class="error-message">Could not connect to API server.</p>`
    } finally {
      finalSeconds = parseInt(timerSpan.textContent) || 0
      stopLoading(timer)
      statusMessage.textContent = `✨ Book recommendations loaded in ${finalSeconds} seconds.`
    }
  })

  // --- DUMMY DATA ---
  // (Already declared above, so this block is removed to avoid duplication)
  // --- MUSIC LOGIC (using dummy data for now) ---
  // (Already declared above, so this block is removed to avoid duplication)

  // --- MOVIE LOGIC (LIVE API) ---
  const handleMovieInput = async (event) => {
    const query = event.target.value
    if (query.length < 2) {
      movieSuggestionsBox.innerHTML = ""
      return
    }
    try {
      const response = await fetch(`/api/ml/search/movie/${query}`)
      const data = await response.json()
      movieSuggestionsBox.innerHTML = ""
      if (data.results) {
        data.results.forEach((title) => {
          const item = document.createElement("div")
          item.className = "suggestion-item"
          item.textContent = title
          item.addEventListener("click", () => {
            movieInput.value = title
            movieSuggestionsBox.innerHTML = ""
            movieRecommendBtn.click() // Automatically trigger recommendation
          })
          movieSuggestionsBox.appendChild(item)
        })
      }
    } catch (error) {
      console.error("Error fetching movie suggestions:", error)
    }
  }
  movieInput.addEventListener("input", debounce(handleMovieInput))

  movieRecommendBtn.addEventListener("click", async () => {
    const movieTitle = movieInput.value
    if (!movieTitle) return alert("Please enter a movie title.")

    const timer = startLoading()
    let finalSeconds = 0
    try {
      const response = await fetch(`/api/ml/recommend/movie/${movieTitle}`)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const data = await response.json()

      if (data.error) {
        resultsGrid.innerHTML = `<div class="col-12"><p class="error-message">${data.error}</p></div>`
      } else {
        if (data.explanation) {
          explanationContainer.innerHTML = `<p>${data.explanation}</p>`
          explanationContainer.style.display = "block"
        }
        displayResults(data.recommendations)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      resultsGrid.innerHTML = `<div class="col-12"><p class="error-message">Could not connect to or process data from the API server.</p></div>`
    } finally {
      finalSeconds = Number.parseInt(timerSpan.textContent) || 0
      stopLoading(timer)
      if (!resultsGrid.innerHTML.includes("error-message")) {
        statusMessage.textContent = `Recommendations loaded in ${finalSeconds} seconds.`
      }
    }
  })

  // --- BOOK LOGIC (NOW LIVE!) ---
  const handleBookInput = async (event) => {
    const query = event.target.value
    if (query.length < 2) {
      bookSuggestionsBox.innerHTML = ""
      return
    }
    try {
      const response = await fetch(`/api/ml/search/book/${query}`)
      const data = await response.json()
      bookSuggestionsBox.innerHTML = ""
      if (data.results) {
        data.results.forEach((title) => {
          const item = document.createElement("div")
          item.className = "suggestion-item"
          item.textContent = title
          item.addEventListener("click", () => {
            bookInput.value = title
            bookSuggestionsBox.innerHTML = ""
            bookRecommendBtn.click() // Automatically trigger recommendation
          })
          bookSuggestionsBox.appendChild(item)
        })
      }
    } catch (error) {
      console.error("Error fetching book suggestions:", error)
    }
  }
  bookInput.addEventListener("input", debounce(handleBookInput))

  bookRecommendBtn.addEventListener("click", async () => {
    const bookTitle = bookInput.value
    if (!bookTitle) return alert("Please enter a book title.")

    const timer = startLoading()
    let finalSeconds = 0
    try {
      const response = await fetch(`/api/ml/recommend/book/${bookTitle}`)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const data = await response.json()

      if (data.error) {
        resultsGrid.innerHTML = `<p class="error-message">${data.error}</p>`
      } else {
        // Check if there's an explanation and display it
        if (data.explanation) {
          explanationContainer.innerHTML = `<div class="alert alert-info">${data.explanation}</div>`
          explanationContainer.style.display = "block"
        }
        displayResults(data.recommendations)
      }
    } catch (error) {
      console.error("Error fetching book recommendations:", error)
      resultsGrid.innerHTML = `<p class="error-message">Could not connect to API server.</p>`
    } finally {
      finalSeconds = parseInt(timerSpan.textContent) || 0
      stopLoading(timer)
      statusMessage.textContent = `✨ Book recommendations loaded in ${finalSeconds} seconds.`
    }
  })

  // --- HIDE SUGGESTIONS WHEN CLICKING ELSEWHERE ---
  document.addEventListener("click", (e) => {
    if (!movieInput.parentElement.contains(e.target)) movieSuggestionsBox.innerHTML = ""
    if (!bookInput.parentElement.contains(e.target)) bookSuggestionsBox.innerHTML = ""
    if (!musicInput.parentElement.contains(e.target)) musicSuggestionsBox.innerHTML = ""
  })
})
