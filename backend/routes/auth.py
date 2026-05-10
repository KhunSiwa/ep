from flask import Blueprint, request, jsonify, current_app
from backend.Database import get_db_connection
import bcrypt
import jwt
import datetime
import re

auth_bp = Blueprint('auth', __name__)


def _hash_password(password: str) -> str:
	"""Return a bcrypt hashed password as UTF-8 string for safe DB storage."""
	hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
	return hashed.decode('utf-8')


def _check_password(password: str, hashed: str) -> bool:
	"""Compare plain password with stored hashed password string."""
	if isinstance(hashed, str):
		hashed = hashed.encode('utf-8')
	return bcrypt.checkpw(password.encode('utf-8'), hashed)


def _valid_email(email: str) -> bool:
	# very simple validation
	return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


@auth_bp.route('/register', methods=['POST'])
def register():
	data = request.get_json() or {}
	email = (data.get('email') or '').strip().lower()
	password = data.get('password')
	if not email or not password:
		return jsonify({'error': 'email and password are required'}), 400
	if not _valid_email(email):
		return jsonify({'error': 'invalid email format'}), 400

	conn = get_db_connection()
	cur = conn.cursor()
	try:
		# Check existing user
		cur.execute('SELECT id FROM users WHERE email = %s', (email,))
		if cur.fetchone():
			return jsonify({'error': 'User already exists'}), 400

		hashed = _hash_password(password)
		cur.execute('INSERT INTO users (email, password) VALUES (%s, %s)', (email, hashed))
		conn.commit()
		return jsonify({'message': 'registered'}), 201
	finally:
		cur.close()
		conn.close()


@auth_bp.route('/login', methods=['POST'])
def login():
	data = request.get_json() or {}
	email = (data.get('email') or '').strip().lower()
	password = data.get('password')
	if not email or not password:
		return jsonify({'error': 'email and password are required'}), 400

	conn = get_db_connection()
	cur = conn.cursor()
	try:
		cur.execute('SELECT id, password FROM users WHERE email = %s', (email,))
		row = cur.fetchone()
		if not row:
			return jsonify({'error': 'Invalid credentials'}), 401

		user_id, hashed = row[0], row[1]
		if not _check_password(password, hashed):
			return jsonify({'error': 'Invalid credentials'}), 401

		secret = current_app.config.get('JWT_SECRET') or 'dev-secret'
		payload = {
			'user_id': user_id,
			'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
		}
		token = jwt.encode(payload, secret, algorithm='HS256')

		return jsonify({'token': token}), 200
	finally:
		cur.close()
		conn.close()
