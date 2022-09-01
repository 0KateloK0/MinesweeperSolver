import React from 'react'
import ReactDOM from 'react-dom';
import * as com from './common.js';
import Game from './player-game.js';
import './AI-game.js';

class App extends React.Component {
	static SOLVER_PLAYER = 0;
	static SOLVER_AI = 1;
	constructor (props) {
		super(props);

		this.state = {
			width: 10,
			height: 10,
			bombsAmount: 20,
			solver: App.SOLVER_PLAYER,
			gameStarted: true,
			incorrect_input: false
		};
	}
	checkInputs () {
		return true;
	}
	render () {
		if (this.state.gameStarted) {
			if (this.state.solver == App.SOLVER_PLAYER) {
				return (
					<div className="wrapper">
						<Game width={this.state.width} height={this.state.height} bombsAmount={this.state.bombsAmount} />
					</div>
				);
			}
			else {
				return <div className="wrapper">

				</div>;
				// make AI-interface
			}
		}
		else {
			return (
				<div className="wrapper">
					<input type="number" onChange={
						(e => {
							this.setState({
								width: e.target.value,
								incorrect_input: false,
							});
						}).bind(this)
					} value={this.state.width} />
					<input type="number" onChange={
						(e => {
							this.setState({
								height: e.target.value,
								incorrect_input: false,
							});
						}).bind(this)
					} value={this.state.height} />
					<input type="number" onChange={
						(e => {
							this.setState({
								bombsAmount: e.target.value,
								incorrect_input: false,
							});
						}).bind(this)
					} value={this.state.bombsAmount} />
					<input type="checkbox" onChange={
						(e => {
							this.setState({
								solver: e.target.value ? App.SOLVER_AI : App.SOLVER_PLAYER,
								incorrect_input: false,
							});
						}).bind(this)
					} value={this.state.solver == App.SOLVER_PLAYER} />
					<button onClick={
						(e => {
							if (!this.checkInputs()) {
								this.setState({
									incorrect_input: true
								});
							}
							else {
								this.setState({
									gameStarted: true
								})
							}

						}).bind(this)
					}>Start new game</button>
				</div>
				);
		}
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);