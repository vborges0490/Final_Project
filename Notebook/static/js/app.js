$(document).ready(function() {
    $("#msform fieldset").hide();
    $("#msform fieldset:first").show().addClass('active');
    $("#findLookForm fieldset").hide();
    $("#findLookForm fieldset:first").show().addClass('active'); 

    function updateProgressBar(index) {
        $("#progressbar li").removeClass("active").eq(index).addClass("active");
    }

    function goToNextFieldset(currentFieldset) {
        var nextFieldset = currentFieldset.next();
        if (nextFieldset.length) {
            currentFieldset.removeClass('active').hide();
            nextFieldset.addClass('active').show();
            updateProgressBar(nextFieldset.index());
        }
    }

    function goToPreviousFieldset(currentFieldset) {
        var prevFieldset = currentFieldset.prev();
        if (prevFieldset.length) {
            currentFieldset.removeClass('active').hide();
            prevFieldset.addClass('active').show();
            updateProgressBar(prevFieldset.index());
        }
    }

    $('#msform').on('submit', function(e) {
        e.preventDefault();  // Prevent default form submission
        var currentFieldset = $(this).find('fieldset.active');
        if (currentFieldset.has('input[type="file"]').length) {
            var formData = new FormData(this);
            $.ajax({
                url: '/predict',
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                success: function(data) {
                    handlePredictionSuccess(data, currentFieldset);
                },
                error: function(xhr, status, error) {
                    console.error('Upload error:', error);
                    alert('An error occurred while uploading the image. Please try again.');
                }
            });
        }
    });

    function handlePredictionSuccess(data, currentFieldset) {
        console.log("Received data: ", data);
        if (!data.uploaded_image_path || !data.predicted_categories) {
            console.error('Required data missing in API response');
            return;
        }
        if (data.dominant_color_rgb) {
            var rgbValue = `rgb(${data.dominant_color_rgb.join(',')})`;
            $('#colorDisplay').css('background-color', rgbValue);
            $('#colorCode').val(rgbValue);  // Store the RGB value in the form
        } else if (data.dominant_color_hex) { // If only HEX is provided, convert it to RGB
            var hex = data.dominant_color_hex;
            var rgb = hexToRgb(hex);
            $('#colorDisplay').css('background-color', rgb);
            $('#colorCode').val(rgb);  // Store the RGB value in the form
        }

        $('#uploadedImage').attr('src', data.uploaded_image_path).show();
        $('#predictionID').val(data.predictionID);

        var predictedCategories = $('#predictedCategories');
        predictedCategories.empty();
        data.predicted_categories.forEach(function(category, index) {
            var radioButton = `<input type="radio" id="prediction${index}" name="prediction" value="${category[0]}">
                               <label for="prediction${index}">${category[0]}</label>`;
            predictedCategories.append(radioButton);
        });

        goToNextFieldset(currentFieldset);
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
    }

    // Explicitly handle "Submit Feedback" button
    $('.submit.action-button').off('click').on('click', function(e) {
        e.preventDefault();
        console.log("Submit Feedback button clicked");
        submitFeedback();
    });

    function submitFeedback() {
        var formData = {
            predictionID: $('#predictionID').val(),
            isCorrectColor: $('#colorConfirmationCheckbox').is(':checked'),
            colorCode: $('#colorCode').val(),
            productType: $('input[name="prediction"]:checked').val(),
            userFeedback: $('#userFeedback').val()
        };

        console.log("Submitting feedback:", formData);

        $.ajax({
            url: '/submit-feedback',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                alert('Thank you for your feedback!');
                $('#msform').trigger("reset");
                updateProgressBar(0);
                $("#msform fieldset:first").show().addClass('active');
                $("#msform fieldset").not(":first").hide().removeClass('active');
            },
            error: function(xhr, status, error) {
                console.error('Error submitting feedback:', error);
                alert('An error occurred while submitting your feedback. Please try again.');
            }
        });
    }

    // Navigation button handlers
    $(".next, .previous").click(function() {
        var currentFieldset = $(this).closest('fieldset');
        $(this).hasClass('next') ? goToNextFieldset(currentFieldset) : goToPreviousFieldset(currentFieldset);
    });

    $('.bl-box').first().click(function() {
        $.ajax({
            url: '/api/my-wardrobe',
            type: 'GET',
            success: function(data) {
                $('#wardrobeImages').empty();  // Clear previous images
                
                data.forEach(function(image) {
                    // Create an image element
                    var imgElement = $('<img>').attr({
                        src: image.path,
                        alt: 'Wardrobe Image',
                        class: 'wardrobe-image'
                    });

                    // Create a paragraph element for the upload time
                    var timeElement = $('<p>').text('Uploaded: ' + image.upload_time).addClass('upload-time');

                    // Create a div to group the image and its upload time
                    var imageContainer = $('<div>').addClass('image-container');
                    imageContainer.append(imgElement, timeElement);

                    // Append the container to the gallery
                    $('#wardrobeImages').append(imageContainer);
                });
            },
            error: function() {
                alert('Failed to retrieve images.');
            }
        });
    });

    $('#findLookButton').off('click').on('click', function(e) {
        e.preventDefault(); // Prevent the default form submission if tied to a form
    
        const requestData = {
            timeOfDay: $('#eventTime').val(),
            eventType: $('#eventType').val(),
            weather: $('#weather').val()
        };
    
        console.log("Sending AJAX request with data:", requestData);
    
        $.ajax({
            url: '/find-look',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                console.log("AJAX request successful, response:", response);
                if (response.look) {
                    $('#upperImage').attr('src', response.look.upper ? `/static/${response.look.upper}` : '');
                    $('#lowerImage').attr('src', response.look.lower ? `/static/${response.look.lower}` : '');
                    $('#footwearImage').attr('src', response.look.footwear ? `/static/${response.look.footwear}` : '');
    
                    // Ensure the display section is visible
                    $('#lookDisplay').css('display', 'grid');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX request failed:', error);
                alert('Error fetching look. Please try again.');
            }
        });
    });
    
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
                    // If login is successful, display the userDetails container
                    // and update it with the username from the response.
                    document.getElementById('userDetails').style.display = 'block';
                    document.getElementById('usernameDisplay').textContent = response.username;
                    
                    // Hide the login button and show the change password button
                    document.getElementById('loginButton').style.display = 'none';
                    document.getElementById('changePasswordButton').style.display = 'block';
                    
                    // Close the login modal
                    closeModal(document.getElementById('loginModal'));
    
                    // Replace the "Sign In" button with a "Change Password" button
                    // This assumes you have a button with id 'changePasswordButton' in your HTML
                    document.getElementById('changePasswordButton').style.display = 'inline-block'; // Show change password button
                    $('.container').show();
    
                    // Hide the login modal
                    closeModal(loginModal);
                } else {
                    // Handle login failure
                    alert('Login failed: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                alert('Login failed: ' + xhr.responseText);
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
                    $('.container').show();

                    closeModal(loginModal);
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

