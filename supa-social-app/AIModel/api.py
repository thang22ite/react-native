# --- START OF FILE api.py ---

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd # Required by the loaded pipeline potentially
import regex # Required for preprocess_text
import os

# --- Configuration ---
# Get the directory where the current script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
# Define the model file path relative to the script's directory
model_filename = 'toxic_comment_model_pipeline.joblib'
model_filepath = os.path.join(script_dir, model_filename)

# List of label names (must match the order during training)
label_columns = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']

# --- Load the trained model pipeline ---
print(f"Loading model from: {model_filepath}")
try:
    model_pipeline = joblib.load(model_filepath)
    print("Model loaded successfully.")
except FileNotFoundError:
    print(f"Error: Model file not found at {model_filepath}")
    print("Please ensure 'trainModel.py' has been run and the model file is saved correctly.")
    exit()
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

# --- Define the same preprocessing function used during training ---
def preprocess_text(text):
    if not isinstance(text, str): # Ensure input is a string
        return ""
    text = text.lower()
    text = text.replace('_', ' ')
    text = regex.sub(r'[^\p{L}\p{N}\s]', '', text) # Keep letters, numbers, spaces
    text = regex.sub(r'\s+', ' ', text).strip()
    return text

# --- Create Flask App ---
app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for all routes

# --- Define API Endpoint ---
@app.route('/predict', methods=['POST'])
def predict_comment():
    """
    API endpoint to predict toxicity labels for a given comment.
    Expects JSON input: {"comment": "some text here"}
    Returns JSON output: {"predictions": {"toxic": 0, "severe_toxic": 1, ...}, "labels": ["severe_toxic"]}
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    comment = data.get('comment', None)

    if comment is None or not isinstance(comment, str):
        return jsonify({"error": "Missing or invalid 'comment' field in JSON payload"}), 400

    if not comment.strip():
         # Return non-toxic for empty or whitespace-only comments
         predictions_dict = {label: 0 for label in label_columns}
         return jsonify({"predictions": predictions_dict, "labels": []})

    try:
        # 1. Preprocess the input comment *exactly* as done during training
        processed_comment = preprocess_text(comment)

        # 2. Make prediction using the loaded pipeline
        #    model_pipeline.predict expects an iterable (like a list)
        prediction_array = model_pipeline.predict([processed_comment]) # Pass as a list

        # 3. Format the output
        # prediction_array is likely [[0, 1, 0, 0, 1, 0]], get the first element
        results = prediction_array[0]
        predictions_dict = {}
        predicted_labels_list = []
        for i, label_name in enumerate(label_columns):
            label_value = int(results[i]) # Ensure it's standard int (0 or 1)
            predictions_dict[label_name] = label_value
            if label_value == 1:
                predicted_labels_list.append(label_name)

        return jsonify({
            "predictions": predictions_dict, # Dictionary showing 0 or 1 for each label
            "labels": predicted_labels_list  # List of labels predicted as 1 (toxic)
        })

    except Exception as e:
        print(f"Error during prediction: {e}") # Log the error server-side
        # Avoid exposing internal error details to the client
        return jsonify({"error": "An error occurred during prediction."}), 500

# --- Run the App ---
if __name__ == '__main__':
    # Use 0.0.0.0 to make it accessible from your network (e.g., your phone during testing)
    # Choose a port (e.g., 5000)
    app.run(host='0.0.0.0', port=5000, debug=True) # Turn debug=False for production
# --- END OF FILE api.py ---