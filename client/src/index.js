import React from 'react'
import ReactDOM from 'react-dom';

function App (props) {
	return (
		<div className="field">
				
		</div>
		)
}

function renderReactApp (el) {
	ReactDOM.render( <App/>, el );
}

document.querySelectorAll('.__react-root').forEach(renderReactApp);