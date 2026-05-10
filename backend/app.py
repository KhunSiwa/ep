import sys
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

# Ensure project root is on sys.path so `import backend...` works when
# running `python backend/app.py` from the repository root.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
	sys.path.insert(0, ROOT)

load_dotenv()


def create_app():
	app = Flask(__name__)
	CORS(app)

	# Minimal config
	app.config['JWT_SECRET'] = os.environ.get('JWT_SECRET', 'dev-secret')
	app.config['JSON_SORT_KEYS'] = False

	# Register blueprints
	from backend.routes.auth import auth_bp
	from backend.routes.tasks import tasks_bp

	app.register_blueprint(auth_bp, url_prefix='/api/auth')
	app.register_blueprint(tasks_bp, url_prefix='/api/tasks')

	# Global JSON error handler
	@app.errorhandler(Exception)
	def handle_exception(e):
		# HTTPExceptions (e.g., abort(404)) have a code and description
		if isinstance(e, HTTPException):
			return jsonify({'error': e.description}), e.code
		# Non-HTTP exceptions -> 500
		return jsonify({'error': 'Internal server error'}), 500

	return app


if __name__ == '__main__':
	app = create_app()
	port = int(os.environ.get('PORT', 3000))
	debug = os.environ.get('FLASK_DEBUG', 'false').lower() in ('1', 'true', 'yes')
	app.run(host='0.0.0.0', port=port, debug=debug)