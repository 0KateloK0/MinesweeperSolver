from flask import Flask, send_from_directory, render_template, request, make_response
import subprocess

CLIENT_FOLDER = '../client'
EXE_PATH = '../AI/cmake-build-debug/MinesweeperAI.exe'

app = Flask(__name__, static_folder=CLIENT_FOLDER, template_folder=CLIENT_FOLDER)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/<path:path>')
def files(path):
	return send_from_directory(CLIENT_FOLDER, path)

@app.route('/check_field')
def check_field_route():
	if request.method != 'POST':
		return make_response('Only POST requests are allowed', 400)

	field = request.form["field"]
	width = request.form["width"]
	height = request.form["height"]
	bombs = request.form["bombs"]
	start_x = request.form["start_x"]
	start_y = request.form["start_y"]


	AI_process = subprocess.Popen([EXE_PATH, str(width), str(height), str(bombs)], 
			stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	try:
		AI_output, AI_errors = AI_process.communicate(
				input=field+'\n'+str(start_x)+'\n'+str(start_y), timeout=2)

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