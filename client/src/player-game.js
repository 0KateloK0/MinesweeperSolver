import React from 'react';
import * as com from './common.js';

function History (props) {
	let moves = props.moves.map((a, i) => {
		return (<div className="history__move" key={i}>{a.x},{a.y}</div>);
	});
	return (<div className="history">{moves}</div>);
}

export default class Game extends React.Component {
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
			status: Game.GAME_NOTSTARTED,
			moves: [],
			history: [],
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
					status: com.Cell.CELL_CLOSED
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
		return com.getAdjEls(this.width, this.height, i, j);
	}

	countInners (i, j, field) {
		if (!field) field = this.state.gameField;
		return com.countInners(field, a => field[a[0]][a[1]].bomb, i, j);
	}

	propagateCellClick (i, j) {
		this.setState({
			gameField: com.propagateCellClick(this.state.gameField, i, j)
		});
	}

	checkSolvability (field, x, y) {
		let netObj = new com.network(this.width, 
				this.height, this.bombsAmount);
		return netObj.checkField(field, x, y);
	}

	startTheGame (i, j) {
		let gameField;
		do {
			gameField = this.generateField();
		} while (gameField[i][j].bomb || this.countInners(i, j, gameField) != 0 ||
			!this.checkSolvability(gameField, j, i));

		this.setState({
			gameField: com.propagateCellClick(gameField, i, j),
			status: Game.GAME_GOING,
			remainingBombs: this.bombsAmount,
			moves: this.state.moves.slice().concat({x: j, y: i, flag: false}),
			// remainingCells: this.width * this.height,
		});
	}

	checkWin () {
		for (let i = 0; i < this.height; ++i) {
			for (let j = 0; j < this.width; ++j) {
				let {status, bomb} = this.state.gameField[i][j];
				if (!(bomb && status == com.Cell.CELL_FLAGGED) && !(!bomb && status == com.Cell.CELL_OPENED))
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
				if (cpy[i][j].bomb && cpy[i][j].status != com.Cell.CELL_FLAGGED)
					cpy[i][j].status = com.Cell.CELL_BOMBED;
			}
		}
		this.setState({
			status: Game.GAME_LOST,
			gameField: cpy
		})
	}

	winTheGame () {
		this.setState({
			status: Game.GAME_WON,
		});
	}

	restartTheGame (i, j) {
		this.setState({
			status: Game.GAME_NOTSTARTED,
			history: []
		});
	}

	handleClick (e, i, j) {
		const field = this.state.gameField;
		if (field[i][j].bomb && !(field[i][j].status == com.Cell.CELL_FLAGGED)) {
			this.setState({ moves: this.state.moves.slice().concat({x: j, y: i, flag: false}) });
			this.loseTheGame();
		}
		else if (field[i][j].status == com.Cell.CELL_OPENED) {
			this.setState({ moves: this.state.moves.slice().concat({x: j, y: i, flag: false}) });
			let adj = this.getAdjEls(i, j);
			let obj = adj.reduce(function (a, [y, x]) {
				if (field[y][x].bomb) {
					a.bomb++;
					if (field[y][x].status == com.Cell.CELL_FLAGGED) a.correct++;
				}
				else {
					if (field[y][x].status == com.Cell.CELL_FLAGGED) a.incorrect++;
				}
				return a;
			}, {
				bomb: 0, correct: 0, incorrect: 0
			});

			if (obj.incorrect != 0){
				this.loseTheGame();
			}
			else if (obj.bomb == obj.correct) {
				adj.map(a => this.propagateCellClick(a[0], a[1]));
			}
		}
		else if (field[i][j].status != com.Cell.CELL_FLAGGED) {
			this.setState({ moves: this.state.moves.slice().concat({x: j, y: i, flag: false}) });
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
		if (this.state.gameField[i][j].status == com.Cell.CELL_FLAGGED) {
			++remBCPY;
			cpy[i][j].status = com.Cell.CELL_CLOSED;
		}
		else if (this.state.gameField[i][j].status == com.Cell.CELL_CLOSED) {
			--remBCPY;
			cpy[i][j].status = com.Cell.CELL_FLAGGED;
		}

		this.setState({
			moves: this.state.moves.slice().concat({x: j, y: i, flag: true}),
			gameField: cpy,
			remainingBombs: remBCPY,
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
						<com.Info remainingBombs={this.state.remainingBombs}/>
						<div className="game__field-wrapper">
							<com.GameField 
								gameField={this.state.gameField}
								handleClick={this.handleClick.bind(this)}
								handleContextClick={this.handleContextClick.bind(this)}
								/>
						</div>
						<History moves={this.state.moves}/>
					</div>
					);
			case Game.GAME_WON:
			case Game.GAME_LOST:
				return (<div className="game-wrapper">
						<h1 className="game__header">{this.state.status == Game.GAME_WON ? 
							'Congratulations! You\'ve just won! Now go out there and beat the shit outta this life!' :
							'I\'m truly sorry to see you lose. But as an old saying goes: "Defeat is just a mere obstacle on a journey to success"'
						}</h1>
						<div className="game__field-wrapper">
							<com.GameField gameField={this.state.gameField} handleClick={(e, i, j) => {
								e.preventDefault();
							}} handleContextClick={e => e.preventDefault()} />
						</div>
						<button className="game__start-button" onClick={
							this.restartTheGame.bind(this)
						}>Start new game</button>
					</div>);
			case Game.GAME_NOTSTARTED:
				let field = [];
				for (let i = 0; i < this.height; ++i) {
					field.push([]);
					for (let j = 0; j < this.width; ++j)
						field[i].push(<com.Cell i={i} j={j} key={`${i}_${j}`}/>);
				}
				return (<div className="game-wrapper">
						<h1 className="game__header" >Lettuce begin</h1>
						<div className="game__field-wrapper">
							<com.GameField gameField={field} handleClick={(e, i, j) => {
								e.preventDefault();
								this.startTheGame(i, j);
							}} handleContextClick={e => e.preventDefault()}/>
						</div>
						<span className="game__hint">Click anywhere on the field</span>
					</div>);
		}
	}
}