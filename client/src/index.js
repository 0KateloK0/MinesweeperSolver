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
	constructor (props) {
		super(props);
		if (props.CELL_OPENED) {
			this.state = {
				status: props.bomb ? Cell.CELL_BOMBED : Cell.CELL_OPENED,
				inners: !props.bomb
			}
		}
		else {
				this.state = {
				status: Cell.CELL_CLOSED,
				inners: false
			};
		}

		this.bomb = props.bomb;
		this.inners = props.inners;
		this.cellId = props.cellId;
	}
	render () {
		return (
			<div className={"field__cell field__cell_" + Cell.statusMap[this.state.status]}
				onClick={this.handleCellClick.bind(this)}
				onContextMenu={this.handleContextClick.bind(this)}
				cellid={this.cellId}
			>
			{
				this.state.inners ? this.inners : ''
			}
			</div>
			);
	}
	openCell () {
		this.setState({ status: Cell.CELL_OPENED });
		if (!this.bomb) {
			this.setState({
				inners: true
			})
		}
		this.render();
	}
	handleCellClick (e) {
		this.openCell();
	}
	handleContextClick (e) {
		this.setState({ status: Cell.CELL_FLAGGED });
	}
}

class Game extends React.Component {
	constructor (props) {
		super(props);
		
		this.gameField = [];
		for (let i = 0; i < props.height; ++i) {
			
			this.gameField.push([]);
			for (let j = 0; j < props.width; ++j) {
				this.gameField[i].push({
					bomb: Math.random() > 0.8,
					status: Cell.CELL_CLOSED
				});
				
			}
		}

		this.width = props.width;
		this.height = props.height;

		// this.cellId = props.cellId;
	}
	getAdjEls (i, j) {
		let res = [];
		if (i - 1 >= 0 && j - 1 >= 0 && this.gameField[i - 1][j - 1]) 					res.push([i - 1, j - 1]);
		if (i - 1 >= 0 && this.gameField[i - 1][j]) 									res.push([i - 1, j]);
		if (i - 1 >= 0 && j + 1 < this.width && this.gameField[i - 1][j + 1]) 			res.push([i - 1, j + 1]);
		if (j - 1 >= 0 && this.gameField[i][j - 1]) 									res.push([i, j - 1]);
		if (j + 1 < this.width && this.gameField[i][j + 1]) 							res.push([i, j + 1]);
		if (i + 1 < this.height && j - 1 >= 0 && this.gameField[i + 1][j - 1]) 			res.push([i + 1, j - 1]);
		if (i + 1 < this.height && this.gameField[i + 1][j]) 							res.push([i + 1, j]);
		if (i + 1 < this.height && j + 1 < this.width && this.gameField[i + 1][j + 1]) 	res.push([i + 1, j + 1]);
		return res;
	}
	countInners (i, j) {
		/*let ans = 0;
		ans += i - 1 >= 0 && j - 1 >= 0 && this.gameField[i - 1][j - 1];
		ans += i - 1 >= 0 && this.gameField[i - 1][j];
		ans += i - 1 >= 0 && j + 1 < this.width && this.gameField[i - 1][j + 1];
		ans += j - 1 >= 0 && this.gameField[i][j - 1];
		ans += j + 1 < this.width && this.gameField[i][j + 1];
		ans += i + 1 < this.height && j - 1 >= 0 && this.gameField[i + 1][j - 1];
		ans += i + 1 < this.height && this.gameField[i + 1][j];
		ans += i + 1 < this.height && j + 1 < this.width && this.gameField[i + 1][j + 1];*/
		return this.getAdjEls(i, j).filter((a) => {this.gameField[a[0]][a[1]].bomb}).length;
	}
	propagateCellClick (i, j) {
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

			this.gameField[c[0]][c[1]] = {
				bomb: this.gameField[c[0]][c[1]],
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
		this.render();
	}
	handleClick (e) {
		let [i, j] = e.target.getAttribute('cellid').split('_').map(Number);
		if (this.gameField[i][j].bomb) {
			// you lose
		}
		else {
			this.propagateCellClick(i, j);
		}
	}
	render () {
		this.field = [];
		for (let i = 0; i < this.height; ++i) {
			this.field.push([]);
			for (let j = 0; j < this.width; ++j) {
				this.field[i].push(<Cell 
					inners={this.countInners(i, j)}
					bomb={this.gameField[i][j].bomb}
					status={this.gameField[i][j].status}
					cellId={`${i}_${j}`}
					key={`cell_${i}_${j}`}></Cell>);
			}
		}

		let field = (<div className="field" 
			style={{
				gridTemplateColumns: `repeat(${this.width}, 1fr)`
			}} 
			onContextMenu={(e)=> e.preventDefault()}
			onClick={this.handleClick.bind(this)}
		>
			{ this.field }
			</div>);
		return field;

	}
}

class App extends React.Component {
	constructor (props) {
		super(props);
	}
	render () {
		return (
			<div className="wrapper">
				<Game width="20" height="40"></Game>
			</div>
		);
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);