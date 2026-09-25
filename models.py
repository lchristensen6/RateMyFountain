from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    fountains = db.relationship("Fountain", backref="creator", lazy=True)
    ratings = db.relationship("Rating", backref="user", lazy=True)


class Fountain(db.Model):
    __tablename__ = "fountains"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    ratings = db.relationship("Rating", backref="fountain", lazy=True, cascade="all, delete-orphan")

    @property
    def average_rating(self):
        if not self.ratings:
            return None
        return round(sum(r.score for r in self.ratings) / len(self.ratings), 1)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "lat": self.lat,
            "lng": self.lng,
            "description": self.description,
            "average_rating": self.average_rating,
            "rating_count": len(self.ratings),
        }


class Rating(db.Model):
    __tablename__ = "ratings"

    id = db.Column(db.Integer, primary_key=True)
    fountain_id = db.Column(db.Integer, db.ForeignKey("fountains.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    score = db.Column(db.Integer, nullable=False)  # 1–5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now())