from flask import Blueprint, request, jsonify, g
from backend.Database import get_db_connection
from backend.middleware.auth import jwt_required
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)


def _row_to_task(row):
	return {
		'id': row[0],
		'user_id': row[1],
		'title': row[2],
		'description': row[3],
		'status': row[4],
		'due_date': row[5].isoformat() if row[5] else None,
	}


@tasks_bp.route('/', methods=['GET'])
@jwt_required
def list_tasks():
	user_id = g.user_id
	conn = get_db_connection()
	cur = conn.cursor()
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
	title = data.get('title')
	description = data.get('description')
	status = data.get('status', 'pending')
	due_date = data.get('due_date')
	if not title:
		return jsonify({'error': 'title is required'}), 400

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
	cur = conn.cursor()
	try:
		# Ensure ownership
		cur.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
		row = cur.fetchone()
		if not row or row[0] != user_id:
			return jsonify({'error': 'not found or unauthorized'}), 404

		# Build update
		set_clauses = []
		params = []
		for k, v in fields.items():
			if k == 'due_date' and v is not None:
				# validate ISO date
				try:
					datetime.fromisoformat(v)
				except Exception:
					return jsonify({'error': 'due_date must be ISO format'}), 400
			set_clauses.append(f"{k} = %s")
			params.append(v)
		params.append(task_id)
		sql = f"UPDATE tasks SET {', '.join(set_clauses)} WHERE id = %s"
		cur.execute(sql, tuple(params))
		conn.commit()
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
		if not row or row[0] != user_id:
			return jsonify({'error': 'not found or unauthorized'}), 404

		cur.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
		conn.commit()
		return jsonify({'message': 'deleted'}), 200
	finally:
		cur.close()
		conn.close()
