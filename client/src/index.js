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
	constructor (props) {
		super(props);
		
		this.state = {
			gameField: []
		}
		for (let i = 0; i < props.height; ++i) {
			
			this.state.gameField.push([]);
			for (let j = 0; j < props.width; ++j) {
				this.state.gameField[i].push({
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
		if (i - 1 >= 0 && j - 1 >= 0) 					res.push([i - 1, j - 1]);
		if (i - 1 >= 0) 								res.push([i - 1, j]);
		if (i - 1 >= 0 && j + 1 < this.width) 			res.push([i - 1, j + 1]);
		if (j - 1 >= 0) 								res.push([i, j - 1]);
		if (j + 1 < this.width) 						res.push([i, j + 1]);
		if (i + 1 < this.height && j - 1 >= 0) 			res.push([i + 1, j - 1]);
		if (i + 1 < this.height) 						res.push([i + 1, j]);
		if (i + 1 < this.height && j + 1 < this.width) 	res.push([i + 1, j + 1]);
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
		return this.getAdjEls(i, j).filter(a => this.state.gameField[a[0]][a[1]].bomb).length;
	}
	propagateCellClick (i, j) {

		let cpy = this.state.gameField;
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
	handleClick (e) {
		let [i, j] = e.target.getAttribute('cellid').split('_').map(Number);
		if (this.state.gameField[i][j].bomb) {
			// you lose
		}
		else if (this.state.gameField[i][j].status == Cell.CELL_OPENED) {
			// check if its full, then propagate nearest cells
			if (this.countInners(i, j) == 
					this.getAdjEls(i, j).reduce((a, b) => a + (this.state.gameField[b[0]][b[1]].status == Cell.CELL_FLAGGED), 0)) {
				this.getAdjEls(i, j).map(a => this.propagateCellClick(a[0], a[1]));
			}
		}
		else if (this.state.gameField[i][j].status != Cell.CELL_FLAGGED) {
			this.propagateCellClick(i, j);
		}
	}
	handleContextClick (e) {
		e.preventDefault();
		let [i, j] = e.target.getAttribute('cellid').split('_').map(Number);
		let cpy = this.state.gameField;

		if (this.state.gameField[i][j].status == Cell.CELL_FLAGGED)
			cpy[i][j].status = Cell.CELL_CLOSED;
		else if (this.state.gameField[i][j].status == Cell.CELL_CLOSED)
			cpy[i][j].status = Cell.CELL_FLAGGED;

		this.setState({
			gameField: cpy
		})
	}
	render () {
		this.field = [];
		for (let i = 0; i < this.height; ++i) {
			this.field.push([]);
			for (let j = 0; j < this.width; ++j) {
				/*this.field[i].push(<Cell 
					inners={this.countInners(i, j)}
					bomb={this.state.gameField[i][j].bomb}
					status={this.state.gameField[i][j].status}
					cellId={`${i}_${j}`}
					key={`cell_${i}_${j}`}></Cell>);*/
					let c = this.countInners(i, j);
					this.field[i].push(
						<div className={`field__cell field__cell_${Cell.statusMap[this.state.gameField[i][j].status]}`}
							/*onClick={this.handleCellClick.bind(this)}
							onContextMenu={this.handleContextClick.bind(this)}*/
							cellid={`${i}_${j}`}
							style={{
								fontSize: this.state.gameField[i][j].status == Cell.CELL_OPENED ? 'inherit' : 0
							}}
							key={`${i}_${j}`}
						>
						{ this.state.gameField[i][j].bomb ? '' : (c ? c : 0) }
						</div>);
			}
		}

		let field = (<div className="field" 
			style={{
				gridTemplateColumns: `repeat(${this.width}, 1fr)`
			}} 
			onContextMenu={this.handleContextClick.bind(this)}
			onClick={this.handleClick.bind(this)}
		>
			{ this.field }
			</div>);
		return field;

	}
}

/*class Test2 extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			k: props.k
		}
	}
	render () {
		return (<span>{this.props.k}</span>);
	}
}

class Test extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			clicked: false
		}
	}
	render () {
		let cl = this.state.clicked;
		return (<div onClick={(e => {
			this.setState({
				clicked: !cl
			});
			this.render();
		}).bind(this)}>
			<Test2 k={this.state.clicked ? 1 : 0}></Test2>
			</div>);
	}

}*/

class App extends React.Component {
	constructor (props) {
		super(props);
	}
	render () {
		return (
			<div className="wrapper">
				{/*<Test></Test>*/}
				<Game width="20" height="40"></Game>
			</div>
		);
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);