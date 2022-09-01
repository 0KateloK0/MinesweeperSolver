import React from 'react';

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


export function Info (props) { return <div className="game-info">{props.remainingBombs}</div>; }

export function getAdjEls (width, height, i, j) {
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

export function countInners (field, filter, i, j) {
	return getAdjEls(field[0].length, field.length, i, j).filter(filter).length;
}

// DESTROY! I was too lazy to delete all of the links correctly, so here it'll stay as a namespace (legacy, don't touch)
export class Cell extends React.Component {
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

export function propagateCellClick (field, i, j) {
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

export function GameField (props) {
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

export network = {
	checkField (field, x, y) {
		let request_body = new FormData();
		request_body.append('field', field.reduce((a, b) => a + (b.bomb ? '1' : '0'), ''));
		// request_body.append('width', )

		let response = await fetch ('/check_field', {
			method: 'POST',
			headers: {
				'Content-Type': 'form/multipart'
			},
			body: request_body
		});
	}
};