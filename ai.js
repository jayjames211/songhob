var AI_LEVEL = {
    EASY: "easy",
    MEDIUM: "medium",
    HARD: "hard"
};

function SongoAI(level) {
    this.level = level || AI_LEVEL.MEDIUM;
}

SongoAI.prototype.setLevel = function(level) {
    this.level = level;
};

SongoAI.prototype.chooseMove = function(board, currentPlayer, gameLogic) {
    var myPits = currentPlayer === 0 ? [0,1,2,3,4,5,6] : [7,8,9,10,11,12,13];
    var availableMoves = [];
    for(var i = 0; i < myPits.length; i++) {
        if(board[myPits[i]] > 0) availableMoves.push(myPits[i]);
    }
    
    if(availableMoves.length === 0) return null;
    
    if(this.level === AI_LEVEL.EASY) {
        var randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }
    else if(this.level === AI_LEVEL.MEDIUM) {
        var bestScore = -1;
        var bestMove = availableMoves[0];
        
        for(var j = 0; j < availableMoves.length; j++) {
            var move = availableMoves[j];
            var result = gameLogic.simulateMove(move, currentPlayer);
            if(result.capturedSeeds > bestScore) {
                bestScore = result.capturedSeeds;
                bestMove = move;
            }
        }
        return bestMove;
    }
    else {
        var bestValue = -Infinity;
        var bestMoveHard = availableMoves[0];
        
        for(var k = 0; k < availableMoves.length; k++) {
            var moveHard = availableMoves[k];
            var resultHard = gameLogic.simulateMove(moveHard, currentPlayer);
            var value = resultHard.capturedSeeds * 10;
            value += resultHard.chainLength * 15;
            value -= resultHard.seedsGivenToOpponent * 3;
            
            if(resultHard.selfRemainingSeeds > 20) value += 5;
            
            if(resultHard.nextBoard && resultHard.nextPlayer !== undefined) {
                var oppPits = resultHard.nextPlayer === 0 ? [0,1,2,3,4,5,6] : [7,8,9,10,11,12,13];
                var oppBestCapture = 0;
                for(var m = 0; m < oppPits.length; m++) {
                    var oppMove = oppPits[m];
                    if(resultHard.nextBoard[oppMove] > 0) {
                        var oppResult = gameLogic.simulateMoveOnBoard(oppMove, resultHard.nextPlayer, resultHard.nextBoard);
                        if(oppResult.capturedSeeds > oppBestCapture) {
                            oppBestCapture = oppResult.capturedSeeds;
                        }
                    }
                }
                value -= oppBestCapture * 8;
            }
            
            if(value > bestValue) {
                bestValue = value;
                bestMoveHard = moveHard;
            }
        }
        return bestMoveHard;
    }
};

var songoAI = new SongoAI("medium");
