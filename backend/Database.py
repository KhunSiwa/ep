"""
Database connection module using mysql-connector-python connection pooling.
Provides get_db_connection() returning a pooled connection.
"""
import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling

load_dotenv()

_pool = None


def _init_pool():
	global _pool
	if _pool is not None:
		return
	db_config = {
		'host': os.environ.get('DB_HOST', '127.0.0.1'),
		'user': os.environ.get('DB_USER', 'root'),
		'password': os.environ.get('DB_PASSWORD', ''),
		'database': os.environ.get('DB_NAME', 'event_plan'),
		'port': int(os.environ.get('DB_PORT', 3306)),
	}
	# Create a connection pool
	_pool = pooling.MySQLConnectionPool(pool_name='mypool', pool_size=5, **db_config)


def get_db_connection():
	"""Return a connection from the pool. Caller should close() it when done."""
	global _pool
	if _pool is None:
		_init_pool()
	return _pool.get_connection()


if __name__ == '__main__':
	# quick smoke test
	conn = get_db_connection()
	cur = conn.cursor()
	cur.execute('SELECT 1')
	print(cur.fetchone())
	cur.close()
	conn.close()