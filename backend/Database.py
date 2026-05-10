"""backend.Database
MySQL connection pooling helper using mysql-connector-python.

Provides a single caller-friendly function `get_db_connection()` which
returns a connection from a pool configured via environment variables.

Environment variables:
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
- DB_POOL_NAME, DB_POOL_SIZE
"""
import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling

load_dotenv()

_pool = None


def _init_pool():
	"""Initialize the global connection pool (idempotent)."""
	global _pool
	if _pool is not None:
		return

	db_config = {
		'host': os.environ.get('DB_HOST', '127.0.0.1'),
		'user': os.environ.get('DB_USER', 'root'),
		'password': os.environ.get('DB_PASSWORD', ''),
		'database': os.environ.get('DB_NAME', 'event_plan'),
		'port': int(os.environ.get('DB_PORT', 3306)),
		'charset': 'utf8mb4',
		'use_unicode': True,
	}

	pool_name = os.environ.get('DB_POOL_NAME', 'event_pool')
	pool_size = int(os.environ.get('DB_POOL_SIZE', 5))

	# Create a connection pool. mysql-connector requires pool_name and pool_size
	_pool = pooling.MySQLConnectionPool(pool_name=pool_name, pool_size=pool_size, **db_config)


def get_db_connection():
	"""Return a connection from the pool. Caller MUST close the connection.

	Example:
		conn = get_db_connection()
		cur = conn.cursor()
		try:
			cur.execute(...)
		finally:
			cur.close(); conn.close()
	"""
	global _pool
	if _pool is None:
		_init_pool()
	return _pool.get_connection()


if __name__ == '__main__':
	# Simple smoke test
	conn = get_db_connection()
	cur = conn.cursor()
	cur.execute('SELECT 1')
	print(cur.fetchone())
	cur.close()
	conn.close()