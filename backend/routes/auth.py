from flask import Blueprint, request, jsonify, current_app
from backend.Database import get_db_connection
import bcrypt
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)


def _hash_password(password: str) -> bytes:
	return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())


def _check_password(password: str, hashed: bytes) -> bool:
	return bcrypt.checkpw(password.encode('utf-8'), hashed)


@auth_bp.route('/register', methods=['POST'])
def register():
	data = request.get_json() or {}
	email = data.get('email')
	password = data.get('password')
	if not email or not password:
		return jsonify({'error': 'email and password are required'}), 400

	conn = get_db_connection()
	cur = conn.cursor()
	try:
		# Check existing
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
	email = data.get('email')
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
		# hashed is stored as bytes; mysql connector may return bytes or str
		if isinstance(hashed, str):
			hashed = hashed.encode('utf-8')

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
