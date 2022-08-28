import React from 'react'
import ReactDOM from 'react-dom';

/* STARTING from Stack Overflow cause I was lazy */
var queue = function() {
  this.first = null;
  this.size = 0;
};

var Node = function(data) {
  this.data = data;
  this.next = null;
};

queue.prototype.push = function(data) {
  var node = new Node(data);

  if (!this.first){
    this.first = node;
  } else {
    let n = this.first;
    while (n.next) {
      n = n.next;
    }
    n.next = node;
  }

  this.size += 1;
  return node;
};

queue.prototype.pop = function() {
  let temp = this.first;
  this.first = this.first.next;
  this.size -= 1;
  return temp;
};

/* ENDING from Stack Overflow cause I was lazy */


// As of right now I'm writing MVP. Player should be able to play this version
// Map would be generated here, without any checks regarding solvability
// It should look somewhat pretty, and should be expandable
// By this I mean that AI should also be able to control this version of the game from server
// But that is a story for another time.

let Info = props => <div className="game-info">{props.remainingBombs}</div>;

function getAdjEls (width, height, i, j) {
	let res = [];
	if (i - 1 >= 0 && j - 1 >= 0) 			res.push([i - 1, j - 1]);
	if (i - 1 >= 0) 						res.push([i - 1, j]);
	if (i - 1 >= 0 && j + 1 < width) 		res.push([i - 1, j + 1]);
	if (j - 1 >= 0) 						res.push([i, j - 1]);
	if (j + 1 < width) 						res.push([i, j + 1]);
	if (i + 1 < height && j - 1 >= 0) 		res.push([i + 1, j - 1]);
	if (i + 1 < height) 					res.push([i + 1, j]);
	if (i + 1 < height && j + 1 < width) 	res.push([i + 1, j + 1]);
	return res;
}

function countInners (field, filter, i, j) {
	return getAdjEls(field[0].length, field.length, i, j).filter(filter).length;
}

function GameField (props) {
	const gameField = props.gameField;
	const height = gameField.length;
	const width = gameField[0].length; // there is no better method probably anyway
	let field = [];
	for (let i = 0; i < height; ++i) {
		field.push([]);
		for (let j = 0; j < width; ++j) {
			let c = countInners(gameField, a => gameField[a[0]][a[1]].bomb, i, j);
			field[i].push(
				<div className={`field__cell field__cell_${Cell.statusMap[gameField[i][j].status]}`}
					cellid={`${i}_${j}`}
					style={{
						fontSize: gameField[i][j].status == Cell.CELL_OPENED ? 'inherit' : 0
					}}
					key={`${i}_${j}`}
				>
				{ gameField[i][j].bomb ? '' : (c ? c : '') }
				</div>);
		}
	}

	return (
		<div className="field" 
			style={{
				gridTemplateColumns: `repeat(${width}, 1fr)`
			}} 
			onContextMenu={props.handleContextClick}
			onClick={props.handleClick}
		>
			{ field }
		</div>);
}

// DESTROY!
class Cell extends React.Component {
	static CELL_CLOSED = 0;
	static CELL_OPENED = 1;
	static CELL_FLAGGED = 2;
	static CELL_BOMBED = 3;
	static statusMap = {
		0: "closed",
		1: "opened",
		2: "flagged",
		3: "bombed"
	}
}

class Game extends React.Component {
	static GAME_NOTSTARTED = 0;
	static GAME_GOING = 1;
	static GAME_WON = 2;
	static GAME_LOST = 3;
	constructor (props) {
		super(props);
		
		this.state = {
			gameField: [],
			remainingBombs: 0,
			remainingCells: 0,
			status: Game.GAME_NOTSTARTED
		}

		this.width = props.width;
		this.height = props.height;
		this.bombsAmount = props.bombsAmount;
	}

	generateField () {
		let gameField = [];
		for (let i = 0; i < this.height; ++i) {
			gameField.push([]);
			for (let j = 0; j < this.width; ++j) {
				gameField[i].push({
					bomb: false,
					status: Cell.CELL_CLOSED
				});
			}
		}
		let y, x;
		for (let i = 0; i < this.bombsAmount; ++i) {
			do {
				y = Math.floor(Math.random() * (this.height - 1));
				x = Math.floor(Math.random() * (this.width - 1));
			} while (gameField[y][x].bomb);
			gameField[y][x].bomb = true;
		}
		return gameField;
	}

	getAdjEls (i, j) {
		return getAdjEls(this.width, this.height, i, j);
	}

	countInners (i, j, field) {
		if (!field) field = this.state.gameField;
		return countInners(field, a => field[a[0]][a[1]].bomb, i, j);
	}

	propagateCellClick (i, j) {
		let cpy = this.state.gameField.slice();
		// BFS
		let q = new queue();
		q.push([i, j]);
		let used = {};
		while (q.size) {
			if (used[q.first.data.join('_')]) {
				q.pop();
				continue;
			}
			used[q.first.data.join('_')] = true;
			let c = q.first.data;

			if (cpy[c[0]][c[1]].bomb || cpy[c[0]][c[1]].status == Cell.CELL_OPENED) {
				q.pop();
				continue;
			}
			cpy[c[0]][c[1]] = {
				bomb: this.state.gameField[c[0]][c[1]].bomb,
				status: Cell.CELL_OPENED
			}


			q.pop();

			if (this.countInners(c[0], c[1]) != 0)
				continue;

			// x and y are swapped here because im stupid and lazy
			for (let [x, y] of this.getAdjEls(c[0], c[1])) {	
				if (!used[[x, y].join('_')]) {
					q.push([x, y]);
				}
			}
		}
		this.setState({
			gameField: cpy
		});
		this.render();
	}

	startTheGame () {
		let i = Math.floor(Math.random() * (this.height - 1)); // temporary and incorrect
		let j = Math.floor(Math.random() * (this.width - 1));
		let gameField = this.generateField();
		while (this.countInners(i, j, gameField) != 0) {
			gameField = this.generateField();
		}
		this.setState({
			gameField,
			status: Game.GAME_GOING,
			remainingBombs: this.bombsAmount,
			remainingCells: this.width * this.height,
		});
		// this.propagateCellClick(i, j);
	}

	loseTheGame () {
		// show every mine
		let cpy = this.state.gameField.slice();
		for (let i = 0; i < this.height; ++i) {
			for (let j = 0; j < this.width; ++j) {
				if (cpy[i][j].bomb && cpy[i][j].status != Cell.CELL_FLAGGED)
					cpy[i][j].status = Cell.CELL_BOMBED;
			}
		}
		this.setState({
			status: Game.GAME_LOST,
			gameField: cpy
		})
	}

	winTheGame () {
		// actually nothing should be done here:)
		this.setState({
			status: Game.GAME_WON
		});
	}

	restartTheGame () {

	}

	handleClick (e) {
		let [i, j] = e.target.getAttribute('cellid').split('_').map(Number);
		if (this.state.gameField[i][j].bomb) {
			this.loseTheGame();
		}
		else if (this.state.gameField[i][j].status == Cell.CELL_OPENED) {
			// check if its full, then propagate nearest cells
			if (this.countInners(i, j) == 
					this.getAdjEls(i, j).reduce((a, b) => a + (this.state.gameField[b[0]][b[1]].status == Cell.CELL_FLAGGED), 0)) {
				this.getAdjEls(i, j).map(a => this.propagateCellClick(a[0], a[1]));
			}
			else {
				// check for correctness and lose if it's incorrect (there are more bombs, or they are in wrong places)
				// this.loseTheGame();
			}
		}
		else if (this.state.gameField[i][j].status != Cell.CELL_FLAGGED) {
			this.propagateCellClick(i, j);
		}

		if (this.state.remainingCells == 0 && this.state.remainingBombs == 0) {
			this.winTheGame();
		}
	}

	handleContextClick (e) {
		e.preventDefault();
		let [i, j] = e.target.getAttribute('cellid').split('_').map(Number);
		let cpy = this.state.gameField.slice();
		let remBCPY = this.state.remainingBombs;
		let remCCPY = this.state.remainingCells;
		if (this.state.gameField[i][j].status == Cell.CELL_FLAGGED) {
			++remBCPY;
			++remCCPY;
			cpy[i][j].status = Cell.CELL_CLOSED;
		}
		else if (this.state.gameField[i][j].status == Cell.CELL_CLOSED) {
			--remBCPY;
			--remCCPY;
			cpy[i][j].status = Cell.CELL_FLAGGED;
		}

		this.setState({
			gameField: cpy,
			remainingBombs: remBCPY,
			remainingCells: remCCPY,
		});
	}

	render () {
		let field = [];
		switch (this.state.status) {
			case Game.GAME_GOING:
				return (
					<div className="game-wrapper">
						<Info remainingBombs={this.state.remainingBombs}/>
						<GameField 
							gameField={this.state.gameField}
							handleClick={this.handleClick.bind(this)}
							handleContextClick={this.handleContextClick.bind(this)}
							/>
					</div>
					);
			case Game.GAME_WON:
				return (<div className="game-wrapper" onClick={this.restartTheGame.bind(this)}>
						<h1>Congratulations! You've just won! Now go out there and beat the shit outta this life!</h1>
					</div>);
			case Game.GAME_LOST:
				return (<div className="game-wrapper" onClick={this.restartTheGame.bind(this)}>
						<h1>I'm truly sorry to see you lose. But as an old saying goes: "Defeat is just a mere obstacle on a journey to success"</h1>
						<GameField 
							gameField={this.state.gameField}
						/>
					</div>);
			case Game.GAME_NOTSTARTED:
				return (<div className="game-wrapper" onClick={this.startTheGame.bind(this)}>
						<h1>Shall we begin?</h1>
					</div>);
		}
	}
}

class App extends React.Component {
	constructor (props) {
		super(props);
	}
	render () {
		return (
			<div className="wrapper">
				<Game width="20" height="30" bombsAmount="150"></Game>
			</div>
		);
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);