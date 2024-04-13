from flask import Flask, request, render_template, url_for, jsonify, flash, session
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import io
import uuid
from sklearn.cluster import KMeans
import os
import logging
import mysql.connector
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
load_dotenv()

password = os.getenv('PASSWORD')
username = os.getenv('USER')
host = os.getenv('HOST')
port = os.getenv('PORT')

engine = create_engine('mysql+mysqlconnector://' + username + ':' + password + '@' + host + ':' + port + '/LookMe')
Session = sessionmaker(bind=engine)
Base = declarative_base()

app = Flask(__name__)

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column('UserID', Integer, primary_key=True, autoincrement=True)
    username = Column('Username', String(255), nullable=False)  # Case as per DB schema
    email = Column('Email', String(255), unique=True, nullable=False)
    password_hash = Column('PasswordHash', String(255), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Load your trained model
model = load_model('vini_fashion_model.keras')

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    session = Session()
    user = session.query(User).filter_by(username=username).first()

    if user:
        # Enhanced debugging: Log the stored password hash
        print(f"Stored hash for '{user.username}': {user.password_hash}")

        is_password_correct = user.check_password(password)
        # Log the outcome of the password check
        print(f"Password verification for '{user.username}': {is_password_correct}")

        if is_password_correct:
            return jsonify({'success': True, 'username': username}), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    else:
        print(f"No user found with username: '{username}'")
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/change_password', methods=['POST'])
def change_password():
    data = request.get_json()
    username = data['username']
    old_password = data['old_password']
    new_password = data['new_password']
    
    session = Session()
    user = session.query(User).filter_by(username=username).first()
    if user and user.check_password(old_password):
        user.set_password(new_password)
        session.commit()
        return jsonify({'success': True, 'message': 'Password changed successfully'}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
    
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = data['password']
    
    session = Session()  # Create a new session instance
    try:
        existing_user = session.query(User).filter_by(username=username).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Username already taken'}), 409
        
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        session.add(new_user)
        session.commit()
        return jsonify({'success': True, 'username': username}), 201
    except IntegrityError as e:
        session.rollback()
        return jsonify({'success': False, 'message': 'This username or email is already registered.'}), 400
    finally:
        session.close()  #

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

@app.errorhandler(500)
def internal_error(error):
    app.logger.error('Server Error: %s', (error))
    return "Something went wrong, we are working on it", 500

# Make sure to define UPLOAD_FOLDER in your Flask app config and create the directory if it doesn't exist
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['SECRET_KEY'] = 'your_secret_key'  # Needed for flashing messages
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

if __name__ == '__main__':
    app.run(debug=True) 