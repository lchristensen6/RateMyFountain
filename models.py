from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# FOUNTAINS TABLE, One row per water fountain on the map.
class Fountain(db.Model):
    __tablename__ = "fountains"

    #Id of fountain
    id = db.Column(db.Integer, primary_key=True)

    #Fountain name
    name = db.Column(db.String(120), nullable=False)

    #Position of the fountains latitude and longitude
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)

    # Description of the fountain. Nullabe = True means it can be empty.
    description = db.Column(db.Text, nullable=True)
    
    # The time the fountain was added, filled in automatically.
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    # A relationship for the ratings of this fountain. fountain.ratings gives a list of Rating objects. 
    # cascade = "all, delete-orphan" means that deleting a fountain deletes all of it's ratings.
    # Ordered by the newest fountain first
    ratings = db.relationship("Rating", backref="fountain", lazy=True, cascade="all, delete-orphan", order_by = "Rating.created_at.desc()")

    # Returns the average_rating of the fountain, used with fountain.average_rating like a property
    @property
    def average_rating(self):
        # If there are no ratings yet, return None
        if not self.ratings:
            return None
        # Add up all the scores, divide by how many there are, and round to one decimal place.
        return round(sum(r.score for r in self.ratings) / len(self.ratings), 1)

    # Turns a fountain into a python dictionary to better send data to the website.
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


# RATINGS TABLE, One row per rating left on a fountain.
class Rating(db.Model):
    __tablename__ = "ratings"

    #id for the rating
    id = db.Column(db.Integer, primary_key=True)

    #id for the fountain that the rating is made on 
    fountain_id = db.Column(db.Integer, db.ForeignKey("fountains.id"), nullable=False)

    # The rating score from 1-5 stars
    score = db.Column(db.Integer, nullable=False)  # 1–5

    # The optional written comment for the rating.
    comment = db.Column(db.Text, nullable=True)
    # Date the rating is created
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    # Turns the rating into a python dictionary to easily send it to the website.
    def to_dict(self):
        return {
            "id": self.id,
            "fountain_id": self.fountain_id,
            "score": self.score,
            "comment": self.comment,
            "created_at": self.created_at
        }