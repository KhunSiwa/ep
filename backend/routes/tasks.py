from flask import Blueprint, request, jsonify, g
from backend.Database import get_db_connection
from backend.middleware.auth import jwt_required
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)


def _row_to_task(row):
	return {
		'id': row['id'],
		'user_id': row['user_id'],
		'title': row['title'],
		'description': row.get('description'),
		'status': row.get('status'),
		'due_date': row['due_date'].isoformat() if row.get('due_date') else None,
	}


@tasks_bp.route('/', methods=['GET'])
@jwt_required
def list_tasks():
	user_id = g.user_id
	conn = get_db_connection()
	cur = conn.cursor(dictionary=True)
	try:
		cur.execute('SELECT id, user_id, title, description, status, due_date FROM tasks WHERE user_id = %s', (user_id,))
		rows = cur.fetchall()
		tasks = [_row_to_task(r) for r in rows]
		return jsonify({'tasks': tasks}), 200
	finally:
		cur.close()
		conn.close()


@tasks_bp.route('/', methods=['POST'])
@jwt_required
def create_task():
	user_id = g.user_id
	data = request.get_json() or {}
	title = (data.get('title') or '').strip()
	description = data.get('description')
	status = data.get('status', 'pending')
	due_date = data.get('due_date')
	if not title:
		return jsonify({'error': 'title is required'}), 400

	allowed_status = {'pending', 'in_progress', 'done'}
	if status not in allowed_status:
		return jsonify({'error': f'status must be one of {list(allowed_status)}'}), 400

	# parse due_date if provided
	due = None
	if due_date:
		try:
			due = datetime.fromisoformat(due_date)
		except Exception:
			return jsonify({'error': 'due_date must be ISO format'}), 400

	conn = get_db_connection()
	cur = conn.cursor()
	try:
		cur.execute('INSERT INTO tasks (user_id, title, description, status, due_date) VALUES (%s, %s, %s, %s, %s)',
					(user_id, title, description, status, due))
		conn.commit()
		task_id = cur.lastrowid
		return jsonify({'message': 'created', 'id': task_id}), 201
	finally:
		cur.close()
		conn.close()


@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required
def update_task(task_id):
	user_id = g.user_id
	data = request.get_json() or {}
	fields = {}
	allowed = ['title', 'description', 'status', 'due_date']
	for k in allowed:
		if k in data:
			fields[k] = data[k]

	if not fields:
		return jsonify({'error': 'no fields to update'}), 400

	conn = get_db_connection()
	cur = conn.cursor(dictionary=True)
	try:
		# Ensure ownership
		cur.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
		row = cur.fetchone()
		if not row or row['user_id'] != user_id:
			return jsonify({'error': 'not found or unauthorized'}), 404

		# Validate fields
		params = []
		set_clauses = []
		allowed_status = {'pending', 'in_progress', 'done'}
		for k, v in fields.items():
			if k == 'due_date' and v is not None:
				try:
					datetime.fromisoformat(v)
				except Exception:
					return jsonify({'error': 'due_date must be ISO format'}), 400
			if k == 'status' and v not in allowed_status:
				return jsonify({'error': f'status must be one of {list(allowed_status)}'}), 400
			set_clauses.append(f"{k} = %s")
			params.append(v)

		params.append(task_id)
		sql = f"UPDATE tasks SET {', '.join(set_clauses)} WHERE id = %s"
		cur2 = conn.cursor()
		cur2.execute(sql, tuple(params))
		conn.commit()
		cur2.close()
		return jsonify({'message': 'updated'}), 200
	finally:
		cur.close()
		conn.close()


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required
def delete_task(task_id):
	user_id = g.user_id
	conn = get_db_connection()
	cur = conn.cursor()
	try:
		cur.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
		row = cur.fetchone()
		if not row or (row[0] if isinstance(row, tuple) else row.get('user_id')) != user_id:
			return jsonify({'error': 'not found or unauthorized'}), 404

		cur.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
		conn.commit()
		return jsonify({'message': 'deleted'}), 200
	finally:
		cur.close()
		conn.close()
