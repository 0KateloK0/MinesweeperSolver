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

// DESTROY! I was too lazy to delete all of the links correctly, so here it'll stay as a namespace (legacy, don't touch)
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
	constructor (props) {super(props);}
	render () {
		let {i, j, status=Cell.CELL_CLOSED, bomb=false, c=0, ...props} = this.props;
		return (
			<div className={`field__cell field__cell_${Cell.statusMap[status]}`}
					cellid={`${i}_${j}`}
					style={{
						fontSize: status == Cell.CELL_OPENED ? 'inherit' : 0
					}}
					{...props}
				>
				{ bomb ? '' : (c ? c : '') }
				</div>
		);
	}
}

function propagateCellClick (field, i, j) {
	let cpy = field.slice();
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
		cpy[c[0]][c[1]].status = Cell.CELL_OPENED;

		q.pop();

		if (countInners(field, a => field[a[0]][a[1]].bomb, c[0], c[1]) != 0)
			continue;

		// x and y are swapped here because im stupid and lazy
		for (let [x, y] of getAdjEls(field[0].length, field.length, c[0], c[1])) {
			if (!used[[x, y].join('_')]) {
				q.push([x, y]);
			}
		}
	}
	return cpy;
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
				<Cell i={i} j={j} status={gameField[i][j].status} bomb={gameField[i][j].bomb} c={c}
					 key={`${i}_${j}`}
					 onClick={e => props.handleClick(e, i, j)}
					 onContextMenu={e => props.handleContextClick(e, i, j)}/>);
		}
	}

	return (
		<div className="field" 
			style={{
				gridTemplateColumns: `repeat(${width}, 1fr)`
			}}
		>
			{ field }
		</div>);
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
		this.setState({
			gameField: propagateCellClick(this.state.gameField, i, j)
		});
	}

	startTheGame (i, j) {
		let gameField;
		do {
			gameField = this.generateField();
		} while (gameField[i][j].bomb || this.countInners(i, j, gameField) != 0);

		this.setState({
			gameField: propagateCellClick(gameField, i, j),
			status: Game.GAME_GOING,
			remainingBombs: this.bombsAmount,
			// remainingCells: this.width * this.height,
		});
	}

	checkWin () {
		for (let i = 0; i < this.height; ++i) {
			for (let j = 0; j < this.width; ++j) {
				let {status, bomb} = this.state.gameField[i][j];
				if (!(bomb && status == Cell.CELL_FLAGGED) && !(!bomb && status == Cell.CELL_OPENED))
					return false;
			}
		}
		return true;
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

	restartTheGame (i, j) {
		this.setState({
			status: Game.GAME_NOTSTARTED
		});
	}

	handleClick (e, i, j) {
		// let [i, j] = e.target.getAttribute('cellid').split('_').map(Number);
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

		if (this.checkWin()) {
			this.winTheGame();
		}
	}

	handleContextClick (e, i, j) {
		e.preventDefault();
		let cpy = this.state.gameField.slice();
		let remBCPY = this.state.remainingBombs;
		// let remCCPY = this.state.remainingCells;
		if (this.state.gameField[i][j].status == Cell.CELL_FLAGGED) {
			++remBCPY;
			// ++remCCPY;
			cpy[i][j].status = Cell.CELL_CLOSED;
		}
		else if (this.state.gameField[i][j].status == Cell.CELL_CLOSED) {
			--remBCPY;
			// --remCCPY;
			cpy[i][j].status = Cell.CELL_FLAGGED;
		}

		this.setState({
			gameField: cpy,
			remainingBombs: remBCPY,
			// remainingCells: remCCPY,
		});

		if (this.checkWin()) {
			this.winTheGame();
		}
	}

	render () {
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
				return (<div className="game-wrapper">
						<h1>Congratulations! You've just won! Now go out there and beat the shit outta this life!</h1>
						<GameField gameField={this.state.gameField} handleClick={(e, i, j) => {
							e.preventDefault();
						}} handleContextClick={e => e.preventDefault()} />
						<button onClick={
							this.restartTheGame.bind(this)
						}>Start new game</button>
					</div>);
			case Game.GAME_LOST:
				return (<div className="game-wrapper">
						<h1>I'm truly sorry to see you lose. But as an old saying goes: "Defeat is just a mere obstacle on a journey to success"</h1>
						<GameField gameField={this.state.gameField} handleClick={(e, i, j) => {
							e.preventDefault();
						}} handleContextClick={e => e.preventDefault()} />
						<button onClick={
							this.restartTheGame.bind(this)
						}>Start new game</button>
					</div>);
			case Game.GAME_NOTSTARTED:
				let field = [];
				for (let i = 0; i < this.height; ++i) {
					field.push([]);
					for (let j = 0; j < this.width; ++j)
						field[i].push(<Cell i={i} j={j} key={`${i}_${j}`}/>);
				}
				return (<div className="game-wrapper">
						<h1>Shall we begin?</h1>
						<GameField gameField={field} handleClick={(e, i, j) => {
							e.preventDefault();
							this.startTheGame(i, j);
						}} handleContextClick={e => e.preventDefault()}/>
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
				<Game width="10" height="10" bombsAmount="10"></Game>
			</div>
		);
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);