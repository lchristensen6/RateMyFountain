import os
from flask import Flask, jsonify, render_template, request
from models import db, Fountain, Rating
import datetime

app = Flask(__name__)
database_url = os.environ.get("DATABASE_URL", "sqlite:///fountains.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True, "pool_recycle": 300}

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/fountains")
def get_fountains():
    fountains = Fountain.query.all()
    return jsonify([f.to_dict() for f in fountains])

@app.route("/api/fountains", methods=["POST"])
def create_fountain():
    data = request.get_json()

    if not data or "name" not in data or "lat" not in data or "lng" not in data:
        return jsonify({"error": "name, lat, and lng are required"}), 400

    fountain = Fountain(
        name=data["name"],
        lat=data["lat"],
        lng=data["lng"],
        description=data.get("description")
    )
    db.session.add(fountain)
    db.session.commit()

    return jsonify(fountain.to_dict()), 201

@app.route("/api/fountains/<int:fountain_id>/ratings", methods=["POST"])
def create_rating(fountain_id):
    fountain = Fountain.query.get(fountain_id)
    if fountain is None:
        return jsonify({"error": "Fountain not found"}), 404

    data = request.get_json()
    if not data or "score" not in data:
        return jsonify({"error": "score is required"}), 400

    score = data["score"]
    if not isinstance(score, int) or score < 1 or score > 5:
        return jsonify({"error": "score must be an integer between 1 and 5"}), 400

    rating = Rating(
        fountain_id=fountain_id,
        score=score,
        comment=data.get("comment"),
        created_at = datetime.datetime.now()
    )
    db.session.add(rating)
    db.session.commit()

    return jsonify(fountain.to_dict()), 201

@app.route("/api/fountains/<int:fountain_id>")
def get_info(fountain_id):
    fountain = Fountain.query.get(fountain_id)
    if fountain is None:
        return jsonify({"error": "Fountain not found"}), 404

    ratings_list = [rating.to_dict() for rating in fountain.ratings]
    
    return ratings_list, 201


if __name__ == "__main__":
    app.run(debug=True)

# # Postgres — your database connection
# DATABASE_URL="postgresql://neondb_owner:npg_LjDunb8V2IeA@ep-late-leaf-bf7bleag.c-5.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
# DATABASE_URL_POOLED="postgresql://neondb_owner:npg_LjDunb8V2IeA@ep-late-leaf-bf7bleag-pooler.c-5.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"