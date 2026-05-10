import sys
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

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

	# Register blueprints
	from backend.routes.auth import auth_bp
	from backend.routes.tasks import tasks_bp

	app.register_blueprint(auth_bp, url_prefix='/api/auth')
	app.register_blueprint(tasks_bp, url_prefix='/api/tasks')

	# Global JSON error handler
	@app.errorhandler(Exception)
	def handle_exception(e):
		# For HTTPExceptions, use their code and description
		try:
			code = e.code
		except AttributeError:
			code = 500
		return jsonify({'error': str(e)}), code

	return app


if __name__ == '__main__':
	app = create_app()
	port = int(os.environ.get('PORT', 3000))
	app.run(host='0.0.0.0', port=port, debug=True)