import React from 'react'
import ReactDOM from 'react-dom';

const CELL_CLOSED = 0;
const CELL_OPENED = 1;


class Cell extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			status: CELL_CLOSED
		};
	}
	render () {
		return (
			<div className={"field__cell field__cell_" + (this.state.status == CELL_CLOSED ? "closed" : "opened")}
				onClick = {this.handleCellClick}
			>
			</div>
			);
	}
	handleCellClick (e) {
		this.setState({ status: CELL_OPENED });
	}
}

class App extends React.Component {
	constructor (props) {
		super(props);
	}
	render () {
		return (
			<div className="field">
				<Cell></Cell>
			</div>
		);
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);