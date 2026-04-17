const API_KEY = "be785968";
const BASE_URL = "https://www.omdbapi.com/";

const searchInput = document.getElementById("searchInput");
const moviesDiv = document.getElementById("movies");
const loader = document.getElementById("loader");
const errorDiv = document.getElementById("error");

let page = 1;
let currentQuery = "";

//  DEBOUNCE
function debounce(fn, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

//  FETCH MOVIES
async function fetchMovies(query, page = 1) {
  try {
    loader.classList.remove("hidden");
    errorDiv.textContent = "";
    const year = document.getElementById("yearFilter").value;

    const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}&page=${page}`);
    const data = await res.json();

    if (data.Response === "False") {
      throw new Error(data.Error);
    }

    return data.Search;
  } catch (err) {
    errorDiv.textContent = err.message;
    return [];
  } finally {
    loader.classList.add("hidden");
  }
}

//  FETCH DETAILS
async function fetchMovieDetails(id) {
  try {
    const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

//  RENDER MOVIES
async function renderMovies(movies) {
  const minRating = document.getElementById("ratingFilter").value;

  for (let movie of movies) {
    const details = await fetchMovieDetails(movie.imdbID);

    if (minRating && details.imdbRating < minRating) continue;

    const div = document.createElement("div");
    div.classList.add("movie");

    div.innerHTML = `
      <img src="${details.Poster}">
      <h3>${details.Title}</h3>
      <p>${details.Year}</p>
      <p>⭐ ${details.imdbRating}</p>
      <button onclick="addToWatchlist('${details.imdbID}')">Add</button>
    `;

    moviesDiv.appendChild(div);
  }
}

//  SEARCH HANDLER
const handleSearch = debounce(async (e) => {
  currentQuery = e.target.value;
  page = 1;
  moviesDiv.innerHTML = "";

  if (!currentQuery) return;

  const movies = await fetchMovies(currentQuery, page);
  renderMovies(movies);
});

//  INFINITE SCROLL
window.addEventListener("scroll", async () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    page++;
    const movies = await fetchMovies(currentQuery, page);
    renderMovies(movies);
  }
});

//  WATCHLIST
function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist")) || [];
}

function addToWatchlist(id) {
  const list = getWatchlist();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem("watchlist", JSON.stringify(list));
    renderWatchlist();
  }
}

async function renderWatchlist() {
  const watchlistDiv = document.getElementById("watchlist");
  watchlistDiv.innerHTML = "";

  const list = getWatchlist();

  for (let id of list) {
    const movie = await fetchMovieDetails(id);

    const div = document.createElement("div");
    div.innerHTML = `
      <p>${movie.Title}</p>
    `;
    watchlistDiv.appendChild(div);
  }
}

//  INIT
searchInput.addEventListener("input", handleSearch);
renderWatchlist();
// FILTERS EVENTS
document.getElementById("yearFilter").addEventListener("input", () => {
  searchInput.dispatchEvent(new Event("input"));
});
document.getElementById("ratingFilter").addEventListener("input", () => {
  searchInput.dispatchEvent(new Event("input"));
});