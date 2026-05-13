import json
from datetime import datetime

from flask import Blueprint, g, jsonify, request

from backend.Database import get_db_connection
from backend.middleware.auth import jwt_required

tasks_bp = Blueprint('tasks', __name__)

ALLOWED_STATUSES = {'backlog', 'pending', 'in_progress', 'blocked', 'review', 'completed'}


def _ensure_task_detail_columns(conn):
	cur = conn.cursor()
	try:
		cur.execute("SHOW COLUMNS FROM tasks LIKE 'progress'")
		if not cur.fetchone():
			cur.execute('ALTER TABLE tasks ADD COLUMN progress INT NOT NULL DEFAULT 0')

		cur.execute("SHOW COLUMNS FROM tasks LIKE 'checklist'")
		if not cur.fetchone():
			cur.execute('ALTER TABLE tasks ADD COLUMN checklist TEXT NULL')

		conn.commit()
	finally:
		cur.close()


def _normalize_checklist(value):
	if value in (None, ''):
		return []

	if isinstance(value, str):
		try:
			value = json.loads(value)
		except json.JSONDecodeError:
			return []

	if not isinstance(value, list):
		return []

	items = []
	for index, item in enumerate(value):
		if isinstance(item, str):
			text = item.strip()
			done = False
		elif isinstance(item, dict):
			text = str(item.get('text') or '').strip()
			done = bool(item.get('done'))
		else:
			continue

		if text:
			items.append({
				'id': item.get('id') if isinstance(item, dict) and item.get('id') else f'step-{index + 1}',
				'text': text,
				'done': done,
			})

	return items


def _calculate_progress(checklist, fallback=0):
	if checklist:
		done_count = len([item for item in checklist if item.get('done')])
		return round((done_count / len(checklist)) * 100)

	try:
		progress = int(fallback or 0)
	except (TypeError, ValueError):
		progress = 0

	return max(0, min(progress, 100))


def _row_to_task(row):
	checklist = _normalize_checklist(row.get('checklist'))
	progress = _calculate_progress(checklist, row.get('progress'))
	return {
		'id': row['id'],
		'user_id': row['user_id'],
		'title': row['title'],
		'description': row.get('description'),
		'status': row.get('status') or 'pending',
		'due_date': row['due_date'].isoformat() if row.get('due_date') else None,
		'progress': progress,
		'checklist': checklist,
	}


@tasks_bp.route('', methods=['GET'])
@tasks_bp.route('/', methods=['GET'])
@jwt_required
def list_tasks():
	user_id = g.user_id
	conn = get_db_connection()
	cur = conn.cursor(dictionary=True)
	try:
		_ensure_task_detail_columns(conn)
		cur.execute('SELECT id, user_id, title, description, status, due_date, progress, checklist FROM tasks WHERE user_id = %s', (user_id,))
		rows = cur.fetchall()
		tasks = [_row_to_task(r) for r in rows]
		return jsonify({'tasks': tasks}), 200
	finally:
		cur.close()
		conn.close()


@tasks_bp.route('', methods=['POST'])
@tasks_bp.route('/', methods=['POST'])
@jwt_required
def create_task():
	user_id = g.user_id
	data = request.get_json() or {}
	title = (data.get('title') or '').strip()
	description = data.get('description')
	status = data.get('status', 'pending')
	due_date = data.get('due_date')
	checklist = _normalize_checklist(data.get('checklist'))
	progress = _calculate_progress(checklist, data.get('progress'))
	if not title:
		return jsonify({'error': 'title is required'}), 400

	if status not in ALLOWED_STATUSES:
		return jsonify({'error': f'status must be one of {sorted(ALLOWED_STATUSES)}'}), 400

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
		_ensure_task_detail_columns(conn)
		cur.execute(
			'INSERT INTO tasks (user_id, title, description, status, due_date, progress, checklist) VALUES (%s, %s, %s, %s, %s, %s, %s)',
			(user_id, title, description, status, due, progress, json.dumps(checklist)),
		)
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
	allowed = ['title', 'description', 'status', 'due_date', 'progress', 'checklist']
	for k in allowed:
		if k in data:
			fields[k] = data[k]

	if not fields:
		return jsonify({'error': 'no fields to update'}), 400

	conn = get_db_connection()
	cur = conn.cursor(dictionary=True)
	try:
		_ensure_task_detail_columns(conn)
		# Ensure ownership
		cur.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
		row = cur.fetchone()
		if not row or row['user_id'] != user_id:
			return jsonify({'error': 'not found or unauthorized'}), 404

		# Validate fields
		params = []
		set_clauses = []
		if 'checklist' in fields:
			normalized_checklist = _normalize_checklist(fields['checklist'])
			fields['checklist'] = json.dumps(normalized_checklist)
			fields['progress'] = _calculate_progress(normalized_checklist, fields.get('progress'))
		elif 'progress' in fields:
			fields['progress'] = _calculate_progress([], fields['progress'])

		for k, v in fields.items():
			if k == 'due_date' and v is not None:
				try:
					datetime.fromisoformat(v)
				except Exception:
					return jsonify({'error': 'due_date must be ISO format'}), 400
			if k == 'status' and v not in ALLOWED_STATUSES:
				return jsonify({'error': f'status must be one of {sorted(ALLOWED_STATUSES)}'}), 400
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
