from functools import wraps
import os
from flask import request, jsonify, g, current_app
import jwt


def jwt_required(fn):
	"""Decorator to protect routes with JWT.

	Expects `Authorization: Bearer <token>` header. On success sets `g.user_id`
	and `g.jwt_payload` for the wrapped view to use.
	"""

	@wraps(fn)
	def wrapper(*args, **kwargs):
		auth = request.headers.get('Authorization')
		if not auth:
			return jsonify({'error': 'Authorization header missing'}), 401

		parts = auth.split()
		if len(parts) != 2 or parts[0].lower() != 'bearer':
			return jsonify({'error': 'Invalid Authorization header format'}), 401

		token = parts[1]
		secret = current_app.config.get('JWT_SECRET') or os.environ.get('JWT_SECRET') or 'dev-secret'
		try:
			payload = jwt.decode(token, secret, algorithms=['HS256'])
		except jwt.ExpiredSignatureError:
			return jsonify({'error': 'Token expired'}), 401
		except jwt.InvalidTokenError:
			return jsonify({'error': 'Invalid token'}), 401

		# Attach useful info to flask.g
		g.user_id = payload.get('user_id')
		g.jwt_payload = payload
		if g.user_id is None:
			return jsonify({'error': 'Invalid token payload'}), 401

		return fn(*args, **kwargs)

	return wrapper
