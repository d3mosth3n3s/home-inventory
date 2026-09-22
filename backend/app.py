import os
import csv
import io
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import date
from werkzeug.utils import secure_filename


load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db = SQLAlchemy(app)



UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)


class Item(db.Model):

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80))
    brand_model = db.Column(db.String(120), nullable=True)
    serial_number = db.Column(db.String(120), nullable=True)

    quantity = db.Column(db.Integer, default=1)
    purchase_date = db.Column(db.Date, nullable=True)
    purchase_price = db.Column(db.Float, nullable=True)  
    current_value = db.Column(db.Float, nullable=True)    

    condition = db.Column(db.String(20), default="good")  
    room_location = db.Column(db.String(80), nullable=True)

    photo_url = db.Column(db.String(255), nullable=True)
    receipt_url = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "category": self.category,
            "brand_model": self.brand_model,
            "serial_number": self.serial_number,
            "quantity": self.quantity,
            "purchase_date": self.purchase_date.isoformat() if self.purchase_date else None,
            "purchase_price": self.purchase_price,
            "current_value": self.current_value,
            "condition": self.condition,
            "room_location": self.room_location,
            "photo_url": self.photo_url,
            "receipt_url": self.receipt_url,
            "notes": self.notes,
        }


@app.route('/api/items', methods=['GET'])
def get_items():
    items = Item.query.all()
    return jsonify([i.to_dict() for i in items])


@app.route('/api/items', methods=['POST'])
def create_item():
    data = request.get_json()
    purchase_date = data.get('purchase_date')
    item = Item(
        name=data['name'],
        category=data.get('category'),
        brand_model=data.get('brand_model'),
        serial_number=data.get('serial_number'),
        quantity=data.get('quantity', 1),
        purchase_date=date.fromisoformat(purchase_date) if purchase_date else None,
        purchase_price=data.get('purchase_price'),
        current_value=data.get('current_value'),
        condition=data.get('condition', 'good'),
        room_location=data.get('room_location'),
        photo_url=data.get('photo_url'),
        receipt_url=data.get('receipt_url'),
        notes=data.get('notes'),
        user_id=data.get('user_id'),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = Item.query.get_or_404(item_id)
    data = request.get_json()
    for field in ['name', 'category', 'brand_model', 'serial_number', 'quantity',
                  'purchase_price', 'current_value', 'condition', 'room_location',
                  'photo_url', 'receipt_url', 'notes']:
        if field in data:
            setattr(item, field, data[field])
    if 'purchase_date' in data:
        item.purchase_date = date.fromisoformat(data['purchase_date']) if data['purchase_date'] else None
    db.session.commit()
    return jsonify(item.to_dict())


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    item = Item.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return '', 204


@app.route('/api/items/summary', methods=['GET'])
def get_summary():
    items = Item.query.all()
    total_value = sum((i.current_value or i.purchase_price or 0) * (i.quantity or 1) for i in items)
    by_category = {}
    for i in items:
        value = (i.current_value or i.purchase_price or 0) * (i.quantity or 1)
        by_category[i.category or "Uncategorized"] = by_category.get(i.category or "Uncategorized", 0) + value
    return jsonify({
        "total_items": len(items),
        "total_value": round(total_value, 2),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
    })


@app.route('/api/items/export', methods=['GET'])
def export_csv():
    items = Item.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Name", "Category", "Brand/Model", "Serial Number", "Quantity",
        "Purchase Date", "Purchase Price", "Current Value", "Condition",
        "Room", "Notes",
    ])
    for i in items:
        writer.writerow([
            i.name, i.category, i.brand_model, i.serial_number, i.quantity,
            i.purchase_date.isoformat() if i.purchase_date else "",
            i.purchase_price, i.current_value, i.condition, i.room_location, i.notes,
        ])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=insured_assets.csv"},
    )

@app.route('/api/items/<int:item_id>/photo', methods=['POST'])
def upload_photo(item_id):
    item = Item.query.get_or_404(item_id)
    file = request.files.get('photo')
    if not file:
        return jsonify({"error": "no photo file provided"}), 400

    filename = secure_filename(f"item_{item_id}_{file.filename}")
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    item.photo_url = f"/uploads/{filename}"
    db.session.commit()
    return jsonify(item.to_dict())


@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)