$(document).ready(function (argument) {
	
	var app = {
		'userSymbol': 'X',
		'systemSymbol': 'O',
		'winnerSymbol': '',
		'lastUserMove': -1
	};

	var isBoardClickable = true;
	var minimaxInvocationCount = 0;

	//Event handlers
	$('.box td').on('hover', function (event){
		var target = $(event.target);

		if (target.html()){
			target.css('cursor', 'not-allowed');
		}
	});

	//Event handler for the user to click the box
	$('.box td').on('click', function (event){

		var target = $(event.target);
		//If the target is empty, add the user symbol in the cell
		if  (!target.html() && isBoardClickable){
			target.html(app.userSymbol);
			target.attr('symbol', app.userSymbol);
			target.addClass('occupied').addClass('user-cell');

			app.lastUserMove = target.attr('index');
			//Check for terminal
			var gameResult = isTerminal(getCurrentState());
			if ( gameResult.terminal ){
				showResults(gameResult);
			} else {
				makeSystemMove();
			}
		} 
	});

	//In the popup, user selecting his/her symbol
	$('.select-o').on('click', function (event) {
		app.userSymbol = 'O';
		app.systemSymbol = 'X';
		$('#modal-dialog').modal('hide');
	});

	//Display results
	function showResults(result){
		var resultMsg = '';
		if (result.winnerSymbol === app.userSymbol)
			resultMsg = 'You won!';
		else if (result.winnerSymbol == app.systemSymbol)
			resultMsg = 'Computer Won!';
		else
			resultMsg = "It's a draw!";
		//Highlight the selected elements
		if (result.winnerCells.length !== 0) {
			$.each(result.winnerCells, function (index, elem){
				$('.box td').eq(elem).addClass('winner-cell');
			});
		}
		// The board should not be selectable
		isBoardClickable = false;

		//Show the message
		var msgElement = $('#result-msg');
		msgElement.text(resultMsg);
		msgElement.show();
		//Fading out the message
		msgElement.fadeOut(3000, function onAnimationComplete(){
			restartGame();
		});
	};

	// Restart game
	function restartGame (){
		// Clearing off the cells
		$('.box td')
			.removeClass('occupied')
			.removeClass('user-cell')
			.removeClass('system-cell')
			.removeClass('winner-cell')
			.attr('symbol','')
			.html('');
		//Resetting the common variables
		app.winnerSymbol = '';
		app.lastUserMove = -1;
		isBoardClickable = true;
	};

	//Get current status of the board
	function getCurrentState (){
		return $('.box td').map(function(){
			return $(this).attr('symbol') || '';
		});
	};

	// Get available indices from the state
	function getAvailableIndices(state){

		return state.toArray().map(function (elem, index){
			if (!elem)
				return index;
		}).filter(isFinite);
	};

	// Get the index of maximum value in the array
	function getIndexOfMaxVal (array) {
		return array.indexOf(Math.max.apply(Math, array));
	};

	// Get the index of minimum value in the array
	function getIndexOfMinVal (array) {
		return array.indexOf(Math.min.apply(Math, array));
	}

	
	// Check for the end of the game
	function isTerminal (state) {
		var result = {
			terminal: false,
			winnerCells: [],
			winnerSymbol: ''
		}
		//Check rows
		for (var i = 0; i <= 6; i += 3){
			if (state[i] && state[i] === state[i+1] && state[i+1] === state[i+2]){
				result.terminal= true;
				result.winnerCells = new Array(i, i + 1, i +2);
				result.winnerSymbol = state[i];

				return result;
			}
		}

		//Check columns
		for (var i = 0; i <= 2; i ++) {
			if (state[i] && state[i] === state[i+3] && state[i+3] === state[i+6]){
				result.terminal = true;
				result.winnerCells = new Array(i, i + 3, i +6);
				result.winnerSymbol = state[i];
				
				return result;
			}
		}

		//Check first diagonal
		if (state[0] && state[0] === state[4] && state[4] === state[8]){
			result.terminal = true;
			result.winnerCells = new Array(0,4,8);
			result.winnerSymbol = state[0];
			
			return result;
		}

		//Check second diagonal
		if (state[2] && state[2] === state[4] && state[4] === state[6]){
			result.terminal = true;
			result.winnerCells = new Array(2,4,6);
			result.winnerSymbol = state[2];
			
			return result;
		}

		//Get the available indices		
		var availIndices = getAvailableIndices(state);

		//If there is no empty box, the result is draw
		if (availIndices.length === 0){
			result.terminal = true;
			result.winnerCells = [];
			result.winnerSymbol = '#';
			
			return result;
		}

		return result;
	};

	// Get score. This function is used by miniMax
	function getScore(gameResult, depth){
		if (gameResult.winnerSymbol === app.systemSymbol)
			return 10 - depth;
		else if (gameResult.winnerSymbol === app.userSymbol)
			return -10 + depth;
		else
			return 0;
	};

	// This function finds out the best move for the system
	function miniMax (game, depth) {
		// Return the score when the game ended
		var gameResult = isTerminal(game.state);
		if ( gameResult.terminal ){
			return getScore(gameResult, depth);
		}

		minimaxInvocationCount ++;

		var scores = [], moves = [];
		// Get all the empty boxes
		var availableIndices = getAvailableIndices(game.state);
		// Place the symbol on each empty boxes and call the minimax again for the opponent
		for (var i = 0; i < availableIndices.length; i ++){
			var currentMove = availableIndices[i];
			var childGame = {};
			childGame.state = [];
			childGame.state = game.state.slice();
			// Make the move on the child state
			childGame.state[currentMove] = game.currentTurn;
			// As the current player has already taken the move, toggle the player
			childGame.currentTurn = game.currentTurn === app.systemSymbol ? app.userSymbol : app.systemSymbol;

			//Call the minimax for the opponent, and push the result (score) into scores array
			scores.push(miniMax(childGame, depth + 1));
			//Push the current move into moves array
			moves.push(currentMove);
		}

		//If the current player is system, get the max score
		//Else if the current player is opponent, get the min score
		if (game.currentTurn === app.systemSymbol){
			if (depth === 0) {
				console.log('Moves', moves);
				console.log('Scores', scores); 
			}
			var maxScoreIndex = getIndexOfMaxVal(scores);
			game.bestMove = moves[maxScoreIndex];
			return scores[maxScoreIndex];
		} else {
			var minScoreIndex = getIndexOfMinVal(scores);
			game.bestMove = moves[minScoreIndex];
			return scores[minScoreIndex];
		}

	}

	//Implement the system move
	function makeSystemMove() {
		// Create game object
		var game = {};
		game.state = getCurrentState();
		game.currentTurn = app.systemSymbol;
		game.bestMove = -1;
		//Call the minimax
		miniMax(game, 0);
		//Find best position for the system
		var sysPosition = game.bestMove;
		var targetElem = $('.box td').eq(sysPosition);
		//Make UI changes
		targetElem.html(app.systemSymbol);
		targetElem.attr('symbol', app.systemSymbol);
		targetElem.addClass('occupied').addClass('system-cell');
		//Testing purpose
		console.log('Minimax invoked ', minimaxInvocationCount, 'times');
		minimaxInvocationCount = 0;
		//Check for terminal
		var gameResult = isTerminal(getCurrentState());
		//If it is terminal, show the results
		if ( gameResult.terminal ){
			showResults(gameResult);
		}
	}; 

	//Show the modal
	$('#modal-dialog').modal();

	//Setting indices
	$('.box td').each(function (index) {
		$(this).attr('index', index);
	});
});