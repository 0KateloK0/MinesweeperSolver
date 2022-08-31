import React from 'react'
import ReactDOM from 'react-dom';
import * as common from './common.js';
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
	render () {
		if (this.state.gameStarted) {
			if (this.state.solver == App.SOLVER_PLAYER) {
				return (
					<div className="wrapper">
						<Game width="10" height="10" bombsAmount="10"></Game>
					</div>
				);
			}
			else {
				return <div className="wrapper"></div>;
				// make AI-interface
			}
		}
		else {
			return (
				<div className="wrapper">
					{/*make chosing of settings and the field for incorrect values*/}
				</div>
				);
		}
	}
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);