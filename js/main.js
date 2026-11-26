// Automatically update the copyright year

const homeYear = document.getElementById("home-year");

if (homeYear) {
    homeYear.textContent = new Date().getFullYear();
}
