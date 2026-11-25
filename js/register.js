
document.getElementById("registerForm").addEventListener("submit", function(event) {

    event.preventDefault();

    // Get user input
    let name = document.getElementById("name").value.trim();
    let userType = document.getElementById("userType").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;
    let message = document.getElementById("message");

    // Validate full name
    if (name === "") {
        message.textContent = "Please enter your full name.";
        message.className = "error";
        return;
    }

    // Validate user type
    if (userType !== "Student" && userType !== "Teacher") {
        message.textContent = "Please select a valid user type.";
        message.className = "error";
        return;
    }

    // Validate password length
    if (password.length < 8) {
        message.textContent = "Password must have at least 8 characters.";
        message.className = "error";
        return;
    }

    // Validate matching passwords
    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.className = "error";
        return;
    }

    // Frontend validation successful
    message.textContent = "Validation successful. Backend connection required.";
    message.className = "success";

});
