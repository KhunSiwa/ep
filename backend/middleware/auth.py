from functools import wraps
from flask import request, jsonify, g, current_app
import jwt


def jwt_required(fn):
	"""Decorator to protect routes with JWT. Expects token in Authorization: Bearer <token>."""

	@wraps(fn)
	def wrapper(*args, **kwargs):
		auth = request.headers.get('Authorization', None)
		if not auth:
			return jsonify({'error': 'Authorization header missing'}), 401

		parts = auth.split()
		if parts[0].lower() != 'bearer' or len(parts) != 2:
			return jsonify({'error': 'Invalid Authorization header format'}), 401

		token = parts[1]
		secret = current_app.config.get('JWT_SECRET') or 'dev-secret'
		try:
			payload = jwt.decode(token, secret, algorithms=['HS256'])
		except jwt.ExpiredSignatureError:
			return jsonify({'error': 'Token expired'}), 403
		except jwt.InvalidTokenError:
			return jsonify({'error': 'Invalid token'}), 403

		# Attach user id to g
		g.user_id = payload.get('user_id')
		if g.user_id is None:
			return jsonify({'error': 'Invalid token payload'}), 403

		return fn(*args, **kwargs)

	return wrapper
