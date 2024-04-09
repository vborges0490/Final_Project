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

    // Handle click on the next button
    //$(".next").click(function() {
        // Move to the next step
    //    var current_fs = $(this).closest("fieldset");
    //    var next_fs = current_fs.next();

        // Add 'active' class to the next fieldset and show it
    //    next_fs.addClass('active').show();
        // Remove 'active' class from the current fieldset and hide it
    //    current_fs.removeClass('active').hide();
    //});

    // Handle click on the previous button
    //$(".previous").click(function() {
        // Move to the previous step
    //    var current_fs = $(this).closest("fieldset");
    //    var previous_fs = current_fs.prev();

        // Add 'active' class to the previous fieldset and show it
    //    previous_fs.addClass('active').show();
        // Remove 'active' class from the current fieldset and hide it
    //    current_fs.removeClass('active').hide();
    //});

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

    // Function to navigate form steps
    //function navigateFormSteps(button, direction) {
    //    var current_fs = button.parent();
    //    var next_fs = direction === 'next' ? current_fs.next() : current_fs.prev();

        // Activate the next step on the progress bar
    //    $('#progressbar li').eq($('fieldset').index(next_fs)).addClass('active');

        // Show the next fieldset and hide the current one
    //    next_fs.show();
    //    current_fs.hide();
    //}

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