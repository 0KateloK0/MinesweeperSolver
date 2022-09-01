from flask import Flask, send_from_directory, render_template, request, make_response

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
	if request.method != 'POST': return make_response('Only POST requests are allowed', 400)

	field = request.form["field"]
	width = request.form["width"]
	height = request.form["height"]
	bombs = request.form["bombs"]
	start_x = request.form["start_x"]
	start_y = request.form["start_y"]



	# try:

	# 	process = subprocess.run(EXE_PATH, 
	# 		stdin=field+'\n'+str(start_x)+'\n'+str(start_y), stdout=subprocess.PIPE, timeout=2)

	# 	got = process.stdout.decode().split()
	# 	obj['got'] = got
	# 	obj['status'] = 'OK' if got == expected else 'WA'
	# except subprocess.TimeoutExpired:
	# 	obj['status'] = 'TL'
	# except OSError:
	# 	obj['status'] = 'ER'
	# subprocess code, going to AI.exe


if __name__ == '__main__':
	app.run(host='0.0.0.0', localhost=5000, debug=True)