import os
from flask import Flask, jsonify, render_template, request
from models import db, Fountain, Rating
import datetime

app = Flask(__name__)
# Finds database url. Local environment in Render that points to Neon database, defaults to local file.
database_url = os.environ.get("DATABASE_URL", "sqlite:///fountains.db")

# Changes the start to work with our database.
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
# Turns off a feature that tracks every change to objects
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# Tests connections to database before using it and replaces older connections. Avoids any problems as
# database is put to sleep when idle.
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True, "pool_recycle": 300}

db.init_app(app)

# On startup, create any missing tables.
with app.app_context():
    db.create_all()

# ROUTES. A route links a web address to a Python function. 

#Home page, request sends the html for the home page
@app.route("/")
def index():
    return render_template("index.html")

# GET returns every fountain from the database
@app.route("/api/fountains")
def get_fountains():
    #SQL query to get all the fountains
    fountains = Fountain.query.all()

    #Turns the list of fountains into a list of JSON's from the python dictionaries.
    return jsonify([f.to_dict() for f in fountains])

# POST creates a new fountain
@app.route("/api/fountains", methods=["POST"])
def create_fountain():
    # Read the JSON sent and becomes a Python dictionary.
    data = request.get_json()

    # If anything is missing return a 400 error
    if not data or "name" not in data or "lat" not in data or "lng" not in data:
        return jsonify({"error": "name, lat, and lng are required"}), 400

    # Make a new Fountain row from the data.
    fountain = Fountain(
        name=data["name"],
        lat=data["lat"],
        lng=data["lng"],
        description=data.get("description")
    )

    # Stages and commits the row to the database.
    db.session.add(fountain)
    db.session.commit()

    # Send the saved fountain back as JSON with status 201
    return jsonify(fountain.to_dict()), 201

# POST Saves a rating for the fountain at the given id
@app.route("/api/fountains/<int:fountain_id>/ratings", methods=["POST"])
def create_rating(fountain_id):
    # Look up the fountain by its id. It gives back None if there is no such fountain.
    fountain = Fountain.query.get(fountain_id)
    # If it does not exist, reply 404 (Not Found).
    if fountain is None:
        return jsonify({"error": "Fountain not found"}), 404

    # Read and check to data
    data = request.get_json()
    if not data or "score" not in data:
        return jsonify({"error": "score is required"}), 400

    # Make sure the score is a whole number from 1 to 5.
    score = data["score"]
    if not isinstance(score, int) or score < 1 or score > 5:
        return jsonify({"error": "score must be an integer between 1 and 5"}), 400

    # Create the Rating row.
    rating = Rating(
        fountain_id=fountain_id,
        score=score,
        comment=data.get("comment"),
        created_at = datetime.datetime.now()
    )
    # Stage and commit the rating to the database.
    db.session.add(rating)
    db.session.commit()

    # Reply with the fountain's updated info.
    return jsonify(fountain.to_dict()), 201

# GET Returns all the reviews for a fountain at the given id
@app.route("/api/fountains/<int:fountain_id>")
def get_info(fountain_id):

    #Gets the fountain at this id
    fountain = Fountain.query.get(fountain_id)

    #Returns an error if the fountain doesn't exist.
    if fountain is None:
        return jsonify({"error": "Fountain not found"}), 404

    # a list of each rating for the fountain turned to a python dictionary.
    ratings_list = [rating.to_dict() for rating in fountain.ratings]
    
    # Returns the list of dictionaries as a JSON
    return ratings_list, 200


if __name__ == "__main__":
    #Runs the website in debug mode only when ran locally.
    app.run(debug=True)