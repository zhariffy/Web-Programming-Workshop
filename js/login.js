
// Get HTML elements

const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");
const message = document.getElementById("message");


// Show or Hide Password

showPassword.addEventListener("change", function() {

    if (showPassword.checked) {

        password.type = "text";

    } else {

        password.type = "password";

    }

});


// Login Form Validation

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    // Validate username

    if (username.value.trim() === "") {

        message.textContent = "Please enter your username.";
        message.className = "error";
        return;

    }

    // Validate password

    if (password.value === "") {

        message.textContent = "Please enter your password.";
        message.className = "error";
        return;

    }

    // Frontend validation successful

    message.textContent =
        "Validation successful. Backend connection required.";

    message.className = "success";

});

