"""
EduPhysics Academy - Flask Backend API with MongoDB
Provides RESTful endpoints for student management
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

app = Flask(__name__)

# CORS configuration - Allow your Vercel frontend
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://*.vercel.app",
    os.environ.get("FRONTEND_URL", "*")
])

# MongoDB Configuration
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/eduphysics")
client = MongoClient(MONGO_URI)
db = client.get_database()

# Collections
students_collection = db.students
admins_collection = db.admins

# Initialize default admin if not exists
def init_admin():
    if admins_collection.count_documents({}) == 0:
        admins_collection.insert_one({
            "username": "admin",
            "password": "admin123",  # In production, use hashed passwords!
            "created_at": datetime.utcnow()
        })

try:
    init_admin()
except Exception as e:
    print(f"Database connection pending: {e}")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# ==================== AUTH ENDPOINTS ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Admin login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        admin = admins_collection.find_one({
            "username": username,
            "password": password
        })

        if admin:
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'username': admin['username']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid username or password'
            }), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== STUDENT ENDPOINTS ====================

@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students with optional filters"""
    try:
        # Build query from filters
        query = {}
        
        gender = request.args.get('gender')
        if gender:
            query['gender'] = gender
        
        class_type = request.args.get('class')
        if class_type:
            query['classes'] = class_type
        
        month = request.args.get('month')
        if month:
            query['registerDate'] = {'$regex': f'^{month}'}

        # Search
        search = request.args.get('search')
        if search:
            query['$or'] = [
                {'firstName': {'$regex': search, '$options': 'i'}},
                {'lastName': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'mobile': {'$regex': search, '$options': 'i'}}
            ]

        students = list(students_collection.find(query).sort('createdAt', -1))
        
        return jsonify({
            'success': True,
            'data': serialize_docs(students),
            'count': len(students)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get a specific student by ID"""
    try:
        student = students_collection.find_one({'_id': ObjectId(student_id)})
        
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'data': serialize_doc(student)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/students', methods=['POST'])
def create_student():
    """Create a new student"""
    try:
        data = request.get_json()

        # Validation
        required_fields = ['firstName', 'lastName', 'email', 'mobile', 'gender', 
                          'address', 'classes', 'registerDate', 'registrationFee']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400

        # Check if email already exists
        existing = students_collection.find_one({'email': data['email'].lower()})
        if existing:
            return jsonify({'success': False, 'error': 'Email already registered'}), 409

        # Create student document
        student = {
            'firstName': data['firstName'].strip(),
            'lastName': data['lastName'].strip(),
            'email': data['email'].strip().lower(),
            'mobile': data['mobile'].strip(),
            'gender': data['gender'],
            'address': data['address'].strip(),
            'classes': data['classes'],
            'registerDate': data['registerDate'],
            'registrationFee': int(data['registrationFee']),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }

        result = students_collection.insert_one(student)
        student['_id'] = str(result.inserted_id)

        return jsonify({
            'success': True,
            'message': 'Student registered successfully',
            'data': student
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/students/register', methods=['POST'])
def public_student_registration():
    """Public student registration with payment receipt upload"""
    try:
        data = request.get_json()

        # Validation
        required_fields = ['firstName', 'lastName', 'email', 'mobile', 'gender', 
                          'address', 'classes', 'registrationFee']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400

        # Payment receipt is required for online registration
        if not data.get('paymentReceipt'):
            return jsonify({'success': False, 'error': 'Payment receipt is required'}), 400

        # Check if email already exists
        existing = students_collection.find_one({'email': data['email'].lower()})
        if existing:
            return jsonify({'success': False, 'error': 'Email already registered'}), 409

        # Create student document
        student = {
            'firstName': data['firstName'].strip(),
            'lastName': data['lastName'].strip(),
            'email': data['email'].strip().lower(),
            'mobile': data['mobile'].strip(),
            'gender': data['gender'],
            'address': data['address'].strip(),
            'classes': data['classes'],
            'registerDate': data.get('registerDate', datetime.utcnow().strftime('%Y-%m-%d')),
            'registrationFee': int(data['registrationFee']),
            'paymentReceipt': data['paymentReceipt'],  # Base64 encoded image
            'paymentReceiptName': data.get('paymentReceiptName', ''),
            'registrationType': 'online',
            'status': 'pending',  # pending, verified, rejected
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }

        result = students_collection.insert_one(student)
        student['_id'] = str(result.inserted_id)
        
        # Don't return the full base64 receipt in response
        del student['paymentReceipt']

        return jsonify({
            'success': True,
            'message': 'Registration submitted successfully! We will verify your payment and confirm enrollment.',
            'data': student
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/students/<student_id>/verify', methods=['PUT'])
def verify_student(student_id):
    """Admin: Verify or reject student registration"""
    try:
        data = request.get_json()
        status = data.get('status')  # 'verified' or 'rejected'
        
        if status not in ['verified', 'rejected']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400

        result = students_collection.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': {
                'status': status,
                'updatedAt': datetime.utcnow()
            }}
        )

        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Student not found'}), 404

        return jsonify({
            'success': True,
            'message': f'Student {status} successfully'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Update an existing student"""
    try:
        data = request.get_json()
        
        # Check if student exists
        student = students_collection.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'error': 'Student not found'}), 404

        # Check email uniqueness if email is being changed
        if 'email' in data and data['email'].lower() != student['email']:
            existing = students_collection.find_one({'email': data['email'].lower()})
            if existing:
                return jsonify({'success': False, 'error': 'Email already registered'}), 409

        # Build update document
        update_data = {
            'updatedAt': datetime.utcnow()
        }
        
        allowed_fields = ['firstName', 'lastName', 'email', 'mobile', 'gender', 
                         'address', 'classes', 'registerDate', 'registrationFee']
        
        for field in allowed_fields:
            if field in data:
                if field == 'email':
                    update_data[field] = data[field].strip().lower()
                elif field == 'registrationFee':
                    update_data[field] = int(data[field])
                elif isinstance(data[field], str):
                    update_data[field] = data[field].strip()
                else:
                    update_data[field] = data[field]

        students_collection.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': update_data}
        )

        updated_student = students_collection.find_one({'_id': ObjectId(student_id)})

        return jsonify({
            'success': True,
            'message': 'Student updated successfully',
            'data': serialize_doc(updated_student)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Delete a student"""
    try:
        result = students_collection.delete_one({'_id': ObjectId(student_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'error': 'Student not found'}), 404

        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== ANALYTICS ENDPOINTS ====================

@app.route('/api/analytics/overview', methods=['GET'])
def get_analytics():
    """Get student analytics overview"""
    try:
        students = list(students_collection.find())
        total = len(students)

        # Gender distribution
        males = sum(1 for s in students if s.get('gender') == 'male')
        females = sum(1 for s in students if s.get('gender') == 'female')

        # Class distribution
        physics = sum(1 for s in students if 'physics' in s.get('classes', []))
        chemistry = sum(1 for s in students if 'chemistry' in s.get('classes', []))
        maths = sum(1 for s in students if 'combined-maths' in s.get('classes', []))

        # Recent registrations
        now = datetime.utcnow()
        week_ago = datetime(now.year, now.month, now.day - 7) if now.day > 7 else now
        month_start = datetime(now.year, now.month, 1)

        week_count = sum(1 for s in students if s.get('createdAt', now) >= week_ago)
        month_count = sum(1 for s in students if s.get('createdAt', now) >= month_start)

        return jsonify({
            'success': True,
            'data': {
                'totalStudents': total,
                'genderDistribution': {
                    'male': males,
                    'female': females
                },
                'classDistribution': {
                    'physics': physics,
                    'chemistry': chemistry,
                    'combinedMaths': maths
                },
                'recentRegistrations': {
                    'thisWeek': week_count,
                    'thisMonth': month_count
                }
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/finance', methods=['GET'])
def get_finance_analytics():
    """Get financial analytics"""
    try:
        students = list(students_collection.find())
        
        # Total revenue
        total_revenue = sum(s.get('registrationFee', 0) for s in students)
        
        # This month revenue
        now = datetime.utcnow()
        month_str = now.strftime('%Y-%m')
        month_students = [s for s in students if s.get('registerDate', '').startswith(month_str)]
        month_revenue = sum(s.get('registrationFee', 0) for s in month_students)
        
        # Average fee
        avg_fee = total_revenue // len(students) if students else 0
        
        # Fee distribution
        fee_distribution = {
            1000: {'count': 0, 'total': 0},
            2000: {'count': 0, 'total': 0},
            3000: {'count': 0, 'total': 0}
        }
        
        for s in students:
            fee = s.get('registrationFee', 0)
            if fee in fee_distribution:
                fee_distribution[fee]['count'] += 1
                fee_distribution[fee]['total'] += fee

        # Class revenue (proportional)
        class_revenue = {'physics': 0, 'chemistry': 0, 'combinedMaths': 0}
        for s in students:
            classes = s.get('classes', [])
            if classes:
                per_class = s.get('registrationFee', 0) / len(classes)
                if 'physics' in classes:
                    class_revenue['physics'] += per_class
                if 'chemistry' in classes:
                    class_revenue['chemistry'] += per_class
                if 'combined-maths' in classes:
                    class_revenue['combinedMaths'] += per_class

        return jsonify({
            'success': True,
            'data': {
                'totalRevenue': total_revenue,
                'totalStudents': len(students),
                'monthRevenue': month_revenue,
                'monthStudents': len(month_students),
                'averageFee': avg_fee,
                'feeDistribution': fee_distribution,
                'classRevenue': {
                    'physics': round(class_revenue['physics']),
                    'chemistry': round(class_revenue['chemistry']),
                    'combinedMaths': round(class_revenue['combinedMaths'])
                }
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        client.admin.command('ping')
        db_status = 'connected'
    except:
        db_status = 'disconnected'

    return jsonify({
        'status': 'healthy',
        'service': 'EduPhysics Academy API',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@app.route('/', methods=['GET'])
def home():
    """API Home"""
    return jsonify({
        'message': 'Welcome to EduPhysics Academy API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'login': 'POST /api/auth/login',
            'students': '/api/students',
            'analytics': '/api/analytics/overview',
            'finance': '/api/analytics/finance'
        }
    }), 200

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 EduPhysics Academy API Starting...")
    print(f"📚 API running on http://127.0.0.1:{port}")
    app.run(debug=True, host='0.0.0.0', port=port)