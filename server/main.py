from flask import Flask, send_from_directory, render_template, request, make_response
import subprocess

CLIENT_FOLDER = '../client'
EXE_PATH = '../AI/cmake-build-release/AI.exe'

app = Flask(__name__, static_folder=CLIENT_FOLDER, template_folder=CLIENT_FOLDER)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/<path:path>')
def files(path):
	return send_from_directory(CLIENT_FOLDER, path)

@app.route('/check_field')
def check_field_route():
	field = request.args.get('field', None)
	width = request.args.get('width', None)
	height = request.args.get('height', None)
	bombs = request.args.get('bombsAmount', None)
	start_x = request.args.get('start_x', None)
	start_y = request.args.get('start_y', None)

	AI_process = subprocess.Popen([EXE_PATH, str(width), str(height), str(bombs)], 
			stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	try:
		AI_output, AI_errors = AI_process.communicate(
				input=bytes(field+'\n'+str(start_x)+'\n'+str(start_y), 'utf-8'), timeout=2)

		return make_response(AI_output, 200)

		# got = process.stdout.decode().split()
	except subprocess.TimeoutExpired:
		AI_process.kill()
		return make_response('failure', 200)
	except OSError:
		AI_process.kill()
		return make_response('failure', 200)

if __name__ == '__main__':
	app.run(host='0.0.0.0', localhost=5000, debug=True)