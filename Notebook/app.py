from flask import Flask, request, render_template, url_for, jsonify, flash
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import io
import uuid
from sklearn.cluster import KMeans
import os

app = Flask(__name__)

# Load your trained model
model = load_model('vini_fashion_model.keras')

def preprocess_image(image, target_size):
    """Resize and normalize the image to fit the model's expected input format."""
    if image.mode != "L":  # Convert to grayscale if not already
        image = image.convert("L")
    image = image.resize(target_size)
    image = np.expand_dims(image, axis=0)
    image = np.expand_dims(image, axis=-1)
    image = image / 255.0  # Normalize pixel values
    return image

def rgb_to_hex(rgb):
    """Convert RGB values to hexadecimal color code."""
    return '#{:02x}{:02x}{:02x}'.format(*rgb)

def extract_dominant_color(image, num_colors=3):
    """Extract the dominant color(s) from an image using KMeans clustering."""
    # Convert image to RGB (if not already in that format)
    image = image.convert("RGB")

    # Resize image for faster processing
    image = image.resize((100, 100))

    # Convert image data into a list of RGB values
    pixels = np.array(image).reshape(-1, 3)

    # Use KMeans to find dominant colors
    kmeans = KMeans(n_clusters=num_colors)
    kmeans.fit(pixels)

    # Get the RGB values of the cluster centers (dominant colors)
    dominant_colors = kmeans.cluster_centers_.astype(int)

    return dominant_colors

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # Handle file upload and predictions
        file = request.files.get('file')
        if file:
            # Process the file, make predictions, and set the variables accordingly
            return render_template('index.html', 
                                   predicted_categories=[('Category1', 0.9), ('Category2', 0.1)],
                                   dominant_color_hex="#RRGGBB",
                                   uploaded_image_path="path/to/image")
    # GET request or initial page load
    return render_template('index.html')

@app.route('/feedback', methods=['POST'])
def handle_feedback():
    data = request.json
    category = data.get('category')
    # Process the feedback
    return jsonify({'status': 'success', 'message': 'Feedback received'})

@app.route('/some_route', methods=['POST'])
def some_route():
    # Example logic for handling an uploaded file
    file = request.files['file']
    if file:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.static_folder, 'Uploaded', filename)
        file.save(save_path)
        # Now pass the relative path as a context variable to your template
        uploaded_image_path = os.path.join('Uploaded', filename)
        return render_template('index.html', uploaded_image_path=uploaded_image_path)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify(error='No file part'), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(error='No selected file'), 400
    if file:
        # Generate a random filename
        ext = os.path.splitext(file.filename)[1]
        random_filename = str(uuid.uuid4()) + ext
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], random_filename)
        file.save(filepath.replace('\\', '/'))  # Ensure we're using forward slashes
        print('Saving file to:', filepath)  # Outputs the file path to your console

        uploaded_image_path = 'uploads/' + random_filename

        # Load the saved image for processing
        image = Image.open(filepath)
        processed_image = preprocess_image(image, target_size=(28, 28))

        # Predict the category
        predictions = model.predict(processed_image)
        predictions = predictions.flatten()
        top_two_indices = predictions.argsort()[-2:][::-1]
        categories = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 
                      'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']

        top_two_categories = [(categories[index], float(predictions[index])) for index in top_two_indices]

        # Extract dominant colors
        dominant_colors = extract_dominant_color(image, num_colors=1)
        dominant_color_rgb = dominant_colors[0].tolist()
        dominant_color_hex = rgb_to_hex(tuple(dominant_color_rgb))

        # Render the HTML template with all context variables
        return jsonify({
            'uploaded_image_path': url_for('static', filename='uploads/' + random_filename.replace('\\', '/')),
            'predicted_categories': top_two_categories,
            'dominant_color_hex': dominant_color_hex
        })

# Make sure to define UPLOAD_FOLDER in your Flask app config and create the directory if it doesn't exist
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['SECRET_KEY'] = 'your_secret_key'  # Needed for flashing messages
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True)