# MinesweeperSolver

instructions about compilation and installation:

Project had been done solely for Windows

server part:
installation:
1. install python (lol)
in server directory:
2. python -m venv virt (if this won't work, probably you don't have virtualenv package installed)
3. virt\scripts\activate
4. pip install Flask
start:
1. set flask_app=main.py
2. flask run

server will be running on localhost 5000

AI part:
Files unclude CMakeLists.txt, you can compile it using CMake

client part:
in the client directory
1. you have to install packages from package.json using npm init
2. you can then run script 'start'

Everything should be set to go by then