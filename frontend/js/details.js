document.addEventListener("DOMContentLoaded", async () => {
  const loadingEl = document.getElementById("loading");
  const contentEl = document.getElementById("movieContent");

  // Re-use the API_BASE from your main script if possible, or define it again
  

  // Get the movie ID from the URL query parameter
  const params = new URLSearchParams(window.location.search);
  const tmdbId = params.get("id");

  if (!tmdbId) {
    loadingEl.textContent = "Error: No movie ID provided.";
    return;
  }

  try {
    const response = await fetch(`/api/ml/movie/details/${tmdbId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Movie not found");
    }
    const data = await response.json();

    // Populate the page with the fetched data
    document.getElementById("movieTitle").textContent = data.Title;
    document.getElementById("moviePoster").src = data.Poster;
    document.getElementById("movieYear").textContent = `Year: ${data.Year}`;
    document.getElementById("movieRated").textContent = `Rated: ${data.Rated}`;
    document.getElementById(
      "movieRuntime"
    ).textContent = `Runtime: ${data.Runtime}`;
    document.getElementById("moviePlot").textContent = data.Plot;
    document.getElementById("movieActors").textContent = data.Actors;
    document.getElementById("movieDirector").textContent = data.Director;

    const ratingsContainer = document.getElementById("movieRatings");
    ratingsContainer.innerHTML = ""; // Clear previous ratings
    if (data.Ratings && data.Ratings.length > 0) {
      data.Ratings.forEach((rating) => {
        const ratingEl = document.createElement("div");
        ratingEl.className = "rating-item";
        ratingEl.innerHTML = `<span>${rating.Source}</span><strong>${rating.Value}</strong>`;
        ratingsContainer.appendChild(ratingEl);
      });
    }

    // Hide loading and show content
    loadingEl.style.display = "none";
    contentEl.style.display = "grid";
  } catch (error) {
    loadingEl.textContent = `Error: ${error.message}`;
    console.error("Failed to fetch movie details:", error);
  }
});
