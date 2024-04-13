$(document).ready(function() {

    Boxlayout.init();
    // Initialize the Boxlayout script
    $("#msform fieldset").hide();
    $("#msform fieldset:first").show().addClass('active');

    function goToNextFieldset(currentFieldset) {
        var nextFieldset = currentFieldset.next();

        nextFieldset.addClass('active').show();
        currentFieldset.removeClass('active').hide();
    }

    // Upload form submission
    $('#msform').on('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        // If this is the first fieldset, handle the file upload via AJAX
        if ($(this).find('fieldset:first').hasClass('active')) {
            var formData = new FormData(this);

            // AJAX request for image upload
            $.ajax({
                url: '/predict',
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                dataType: 'json', // Ensure response is treated as JSON
                success: function(data) {
                    console.log(data); // Add this line to see what 'data' contains
                
                    $('#uploadedImage').attr('src', data.imagePath).show();

                    var image = document.getElementById('uploadedImage');
                    image.src = data.uploaded_image_path; // Set the source to the image path

                    var predictedCategories = $('#predictedCategories');
                    predictedCategories.empty(); // Clear existing content
                
                    // Check if 'data.predictions' exists before trying to use it
                    if (data.predicted_categories && Array.isArray(data.predicted_categories)) {
                        data.predicted_categories.forEach(function(categoryArray, index) {
                            // Assuming the category name is the first element in the inner array
                            var categoryName = categoryArray[0]; // Adjust based on actual structure
                            var radioButton = '<input type="radio" id="prediction' + index +
                                              '" name="prediction" value="' + categoryName +
                                              '"><label for="prediction' + index + '">' + categoryName +
                                              '</label>'; // Removed the <br> tag here
                            predictedCategories.append(radioButton);
                        });
                    } else {
                        console.error('Predicted categories are undefined or not an array');
                    }
                
                    $('.prediction-section').show();

                    if (data.dominant_color_hex) {
                        $('#colorDisplay').css('background-color', data.dominant_color_hex);
                    } else {
                        console.error('Dominant color is undefined');
                    }

                    var currentStep = $("#msform fieldset.active");
                    var nextStep = currentStep.next("fieldset");
                    updateUIWithPredictionResults(data);
                    // Move to the next fieldset
                    console.log("Moving from step:", currentStep.index(), " to:", nextStep.index());

                    goToNextFieldset($('#msform fieldset.active'));
                    navigateFormSteps(currentStep, 'next');
                },
                error: function(xhr) {
                    console.log('Upload error', xhr);
                    alert('An error occurred while uploading the image. Please try again.');
                }
            });
        }
    });

    $(".next, .previous").click(function() {
        var direction = $(this).hasClass('next') ? 'next' : 'previous';
        navigateFormSteps($(this), direction);
    });

    function navigateFormSteps(button, direction) {
        var current_fs = button.closest("fieldset");
        var next_fs = direction === 'next' ? current_fs.next("fieldset") : current_fs.prev("fieldset");
    
        // Ensure there's a next fieldset to go to
        if(next_fs.length > 0) {
            // Fade out the current fieldset and upon completion, fade in the next fieldset
            current_fs.fadeOut(400, function() {
                // Remove 'active' class from all fieldsets then add to next
                $("fieldset").removeClass('active');
                next_fs.addClass('active');
                
                // Fade in the next fieldset
                next_fs.fadeIn(400);
                
                // Update the progress bar
                var index = $("fieldset").index(next_fs);
                $("#progressbar li").removeClass("active").eq(index).addClass("active");
                
                // Set focus for accessibility
                next_fs.find(':input:not([type="hidden"]):first').focus();
            });
        }
    }

    // Function to update UI with prediction results
    function updateUIWithPredictionResults(data) {
        // Update the DOM with the prediction results
        $('#predictionResult').html(data.prediction); // Assuming 'data.prediction' is the result
        // If you have other elements to update, add them here
    }
    
    // Submit feedback button click
    $('#submitFeedbackButton').click(function() {
        submitFeedback();
    });

    // Function to submit feedback
    function submitFeedback() {
        var selectedCategory = $('input[name="category"]:checked').val(); // Corrected element reference
        var colorConfirmed = $('#colorConfirmationCheckbox').is(':checked'); // Corrected ID reference

        // AJAX request to submit feedback
        $.ajax({
            url: '/feedback', // Your Flask route for feedback submission
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                category: selectedCategory,
                colorConfirmed: colorConfirmed
            }),
            success: function(response) {
                // Handle success - maybe display a message or clear the form
                console.log('Feedback submitted successfully');
                alert('Thank you for your feedback!');
            },
            error: function(xhr, status, error) {
                // Handle error
                console.log('Feedback submission error', xhr);
                alert('An error occurred while submitting your feedback. Please try again.');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");

    // Define all modal and button elements
    var loginModal = document.getElementById("loginModal");
    var loginButton = document.getElementById("loginButton");
    var loginCloseButton = document.querySelector("#loginModal .close-button");
    var loginForm = document.getElementById("loginForm");

    var registerModal = document.getElementById("registerModal");
    var registerOpenButton = document.getElementById("registerButton"); // Button inside loginModal to open registerModal
    var registerCloseButton = document.querySelector("#registerModal .close-button");
    var registerForm = document.getElementById("registerForm");

    // Generic function to open modals
    function openModal(modal) {
        if (modal) modal.style.display = 'block';
    }

    // Generic function to close modals
    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    // Show the login modal when the login button is clicked
    loginButton.addEventListener('click', function() {
        openModal(loginModal);
    });

    // Close the login modal when its close button is clicked
    loginCloseButton.addEventListener('click', function() {
        closeModal(loginModal);
    });

    // Transition from login to register modal
    registerOpenButton.addEventListener('click', function() {
        closeModal(loginModal);
        openModal(registerModal);
    });

    // Close the register modal when its close button is clicked
    registerCloseButton.addEventListener('click', function() {
        closeModal(registerModal);
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        var formData = new FormData(this);
        var data = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        // AJAX request for login
        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    alert('Registration successful, you are now logged in as ' + response.username);
                    closeModal(document.getElementById('registerModal'));
                    // Update UI to reflect logged-in state
                    document.getElementById('userDetails').style.display = 'block';
                    document.getElementById('usernameDisplay').textContent = response.username;
                    document.getElementById('loginButton').style.display = 'none';
                } else {
                    alert('Registration failed: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                alert('Registration failed: ' + xhr.responseText);
            }
        });
    });

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();  // Prevent the default form submission
    
        var formData = new FormData(this);
        var data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };
    
        // AJAX request to the server for user registration
        $.ajax({
            url: '/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    alert('Registration successful, you are now logged in as ' + response.username);
                    closeModal(document.getElementById('registerModal'));
                    // Update UI to reflect logged-in state
                    document.getElementById('userDetails').style.display = 'block';
                    document.getElementById('usernameDisplay').textContent = response.username;
                    document.getElementById('loginButton').style.display = 'none';
                } else {
                    alert('Registration failed: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                alert('Registration failed: ' + xhr.responseText);
            }
        });
    });
    
    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();  // Prevent the default form submission
    
        var formData = new FormData(this);
        var data = {
            username: formData.get('username'),
            old_password: formData.get('old_password'),
            new_password: formData.get('new_password')
        };
    
        // AJAX request to the server for changing password
        $.ajax({
            url: '/change_password',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                alert('Password change successful');
                // Close the change password modal here if needed
                // You might also want to redirect the user or update the UI accordingly
            },
            error: function(xhr, status, error) {
                alert('Password change failed: ' + xhr.responseText);
            }
        });
    });

    // Optionally, handle changePasswordButton click to open the change password modal
    changePasswordButton.addEventListener('click', function() {
        // Open change password modal logic here
    });

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            var modal = this.closest('.modal'); // Get the closest modal parent
            closeModal(modal);
        });
    });

    changePasswordButton.addEventListener('click', function() {
        openModal(document.getElementById("changePasswordModal")); // Open change password modal
    });

    function openModal(modal) {
        if (modal) modal.style.display = 'block';
    }

    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var formData = new FormData(registerForm);
        var data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        console.log("Attempting to register with:", data);

        // Proceed with AJAX request...
    });

    loginButton.onclick = function() {
        console.log("Login button clicked. Showing modal.");
        modal.style.display = "block";
    };

    window.addEventListener('click', function(event) {
        if (event.target === loginModal) closeModal(loginModal);
        if (event.target === registerModal) closeModal(registerModal);
    });
});

