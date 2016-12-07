(function () {

    'use strict';

    angular
        .module('app')
        .controller('chessController', chessController);


    function chessController($scope) {


        //initialises global variables
        function coordinate(y, x) { this.y = y; this.x = x; }
        var selected = new coordinate();
        var threateningKing = new coordinate();
        $scope.board = [];
        createBoard();


        //resets the global variables to start a new game
        //self executing, so executes as the webpage is launched
        ($scope.newGame = function () {
            selected = new coordinate(-1, -1);
            threateningKing = new coordinate(-1, -1);
            $scope.currentTurnColour = "W";
            $scope.check = false;
            $scope.checkmate = false;
            $scope.piecesTaken = [["_", "_", "_", "_", "_", "_", "_", "_"], ["_", "_", "_", "_", "_", "_", "_", "_"], ["_", "_", "_", "_", "_", "_", "_", "_"], ["_", "_", "_", "_", "_", "_", "_", "_"]];
            $scope.hasConceded = false;
            resetBoard();
            setTimeout(function () { alert("New game begins!") }, 100);
        })();


        //pushes 8x8 to the board to create an empty chessboard
        //each square being black or white with default other properties
        function createBoard() {
            for (var row = 0; row < 8; row++) {
                $scope.board.push([]);
                for (var col = 0; col < 8; col++) {
                    $scope.board[row].push({
                        colour: "",
                        name: "",
                        highlighted: false,
                        selected: false,
                        squareColour: "white",
                        row: row,
                        col: col
                    });
                    if (((row % 2 == 0) && (col % 2 == 0)) || ((row % 2 != 0) && (col % 2 != 0))) {
                        $scope.board[row][col].squareColour = "white";
                    }
                    else $scope.board[row][col].squareColour = "black";
                }
            }
        }


        //resets the board by placing all pieces in their starting positions
        function resetBoard() {
            for (var x = 0; x < 8; x++) {
                for (var y = 0; y < 8; y++) {
                    if (y == 0 || y == 1) $scope.board[y][x].colour = "B";
                    else if (y == 6 || y == 7) $scope.board[y][x].colour = "W";
                    else $scope.board[y][x].colour = "";

                    if (y == 1 || y == 6) $scope.board[y][x].name = "Pawn";
                    else if (y == 0 || y == 7) {
                        var currentName;
                        switch (x) {
                            case 0: case 7: currentName = "Rook"; break;
                            case 1: case 6: currentName = "Knight"; break;
                            case 2: case 5: currentName = "Bishop"; break;
                            case 3: currentName = "Queen"; break;
                            case 4: currentName = "King"; break;
                        }
                        $scope.board[y][x].name = currentName;
                    }
                    else $scope.board[y][x].name = "";
                }
            }
            deselect();
        }

        
        //unhighlights all squares, sets there to be no selected piece
        function deselect() {
            for (var y = 0; y < 8; y++) {
                for (var x = 0; x < 8; x++) {
                    $scope.board[y][x].highlighted = false;
                    $scope.board[y][x].selected = false;
                }
            }
            selected = new coordinate(-1, -1);
        }


        //returns the string 'B' or 'W', depending on whose turn it is not
        function notCurrentTurnColour() {
            if ($scope.currentTurnColour == "W") return "B";
            else return "W";
        }


        //returns true if the two coordinates passed in are identical
        function compareCoordinates(coordOne, coordTwo) {
            return (coordOne.y == coordTwo.y && coordOne.x == coordTwo.x);
        }


        //processes a chessboard square being clicked
        $scope.squareClicked = function (y, x) {
            if (!$scope.checkmate && !$scope.hasConceded) {

                //if highlighted (i.e. you're moving the piece):
                if ($scope.board[y][x].highlighted) {

                    //if a piece is being taken
                    if ($scope.board[y][x].name != "") {

                        //add this piece to the list of pieces that have taken
                        var exitLoop = false;
                        if ($scope.currentTurnColour == "W") {
                            for (var a = 0; a < 2; a++) {
                                for (var b = 0; b < 8; b++) {
                                    if ($scope.piecesTaken[a][b] == "_") {
                                        $scope.piecesTaken[a][b] = "B_" + $scope.board[y][x].name;
                                        exitLoop = true;
                                        break;
                                    }
                                }
                                if (exitLoop) break;
                            }
                        }
                        else {
                            for (var a = 2; a < 4; a++) {
                                for (var b = 0; b < 8; b++) {
                                    if ($scope.piecesTaken[a][b] == "_") {
                                        $scope.piecesTaken[a][b] = "W_" + $scope.board[y][x].name;
                                        exitLoop = true;
                                        break;
                                    }
                                }
                                if (exitLoop) break;
                            }
                        }
                    }

                    //set the properties of the board to move the piece
                    $scope.board[y][x].colour = $scope.currentTurnColour;
                    $scope.board[y][x].name = $scope.board[selected.y][selected.x].name;
                    $scope.board[selected.y][selected.x].colour = "";
                    $scope.board[selected.y][selected.x].name = "";
                    deselect();

                    //if a pawn is being moved to the other end of the board
                    if ($scope.board[y][x].name == "Pawn") {
                        if (($scope.currentTurnColour == "B" && y == 7) || ($scope.currentTurnColour == "W" && y == 0)) {
                            
                            //transform it by asking the user which piece it should become
                            var pawnBecomes = "";
                            while (pawnBecomes == "" || !pawnBecomes) pawnBecomes = promotionPopup();
                            $scope.board[y][x].name = pawnBecomes;

                        }
                    }

                    $scope.currentTurnColour = notCurrentTurnColour();

                    //determine if the player is in check
                    $scope.check = inCheck();

                    //if the player is in check, determine if they are in checkmate
                    if ($scope.check) {
                        $scope.checkmate = inCheckmate();

                        //alert the user as to the check or checkmate status
                        setTimeout(function () { alert($scope.checkmate ? "Checkmate! Game over!" : "Check!") }, 10);
                    }

                }
                
                //if you're choosing one of your own pieces:
                else if (($scope.board[y][x].colour == $scope.currentTurnColour) && !compareCoordinates(selected, new coordinate(y, x))) {

                    deselect();
                    selected = new coordinate(y, x);
                    $scope.board[y][x].selected = true;

                    //REMOVE THIS
                    //findPotentialSquares returns an array of coordinates the piece can move to, and saves it to squaresToHighlight
                    var squaresToHighlight = findPotentialSquares(y, x, $scope.board[y][x].colour, $scope.board[y][x].name);

                    //findPotentialSquares returns an array of coordinates the piece can move to, and saves it to possibleSquaresToHighlight
                    var possibleSquaresToHighlight = findPotentialSquares(y, x, $scope.board[y][x].colour, $scope.board[y][x].name);
                    var squaresToHighlight = [];

                    //for each square in possibleSquaresToHighlight, determine if moving there would put you into check
                    for (var i = 0; i < possibleSquaresToHighlight.length; i++) {
                        var boardCopy = copyBoard();
                        boardCopy[possibleSquaresToHighlight[i].y][possibleSquaresToHighlight[i].x].name = boardCopy[y][x].name;
                        boardCopy[possibleSquaresToHighlight[i].y][possibleSquaresToHighlight[i].x].colour = boardCopy[y][x].colour;
                        boardCopy[y][x].name = "";
                        boardCopy[y][x].colour = "";
                        //if it would not put you in check, add it to squaresToHighlight
                        if (!inCheck(boardCopy)) {
                            squaresToHighlight.push(possibleSquaresToHighlight[i]);
                        }
                    }

                    //sets the highlighted property of each square in squaresToHighlight to true
                    for (var i = 0; i < squaresToHighlight.length; i++) {
                        $scope.board[squaresToHighlight[i].y][squaresToHighlight[i].x].highlighted = true;
                    }

                }

                //if you're clicking off or deselecting your piece:
                else deselect();
            }
        }


        //returns a list of all squares a given piece can move to
        function findPotentialSquares(y, x, pieceColour, pieceName, boardToUse) {

            //allows for the use of a different board
            //this will be utilised later by the inCheck and inCheckmate routines
            boardToUse = (boardToUse) ? boardToUse : $scope.board;

            //initialise variables
            var potentialSquares = [];
            var directionsToCheck = [];
            var iterate = true;

            //a pawn's movement is more  complex than other pieces so must be handled separately
            if (pieceName == "Pawn") {

                //sets the direction the pawn can move in, depending on its colour
                var increment = 1;
                if (pieceColour == "W") increment = -1;

                //checks if the square directly ahead can be moved into
                var canMoveForwards = false;
                if (checkSquare((y + increment), x, boardToUse) == "empty") {
                    potentialSquares.push(new coordinate(y + increment, x));
                    canMoveForwards = true;
                }

                //if in starting row and can move forwards one square, also check two squares in front
                if (canMoveForwards) {
                    if (((pieceColour == "B" && y == 1) || (pieceColour == "W" && y == 6))
                        && (checkSquare(y + (2 * increment), x, boardToUse) == "empty")) {
                        potentialSquares.push(new coordinate(y + (2 * increment), x));
                    }
                }

                //check if the pawn can take diagonally
                if (y + increment >= 0 && y + increment <= 7) {
                    if (x > 0) {
                        if (boardToUse[y + increment][x - 1].colour == notCurrentTurnColour()) {
                            potentialSquares.push(new coordinate(y + increment, x - 1));
                        }
                    }
                    if (x < 7) {
                        if (boardToUse[y + increment][x + 1].colour == notCurrentTurnColour()) {
                            potentialSquares.push(new coordinate(y + increment, x + 1));
                        }
                    }
                }
            }

            //for all other pieces
            else {

                //add each 'direction' a piece can move in to directionsToCheck
                //and set the variables iterate and isKing to the correct values
                var isKing = false;
                switch (pieceName) {
                    case "Rook":
                        directionsToCheck.push(new coordinate(0, 1));
                        directionsToCheck.push(new coordinate(0, -1));
                        directionsToCheck.push(new coordinate(-1, 0));
                        directionsToCheck.push(new coordinate(1, 0));
                        break;
                    case "Knight":
                        directionsToCheck.push(new coordinate(-1, 2));
                        directionsToCheck.push(new coordinate(1, 2));
                        directionsToCheck.push(new coordinate(-1, -2));
                        directionsToCheck.push(new coordinate(1, -2));
                        directionsToCheck.push(new coordinate(-2, 1));
                        directionsToCheck.push(new coordinate(2, 1));
                        directionsToCheck.push(new coordinate(-2, -1));
                        directionsToCheck.push(new coordinate(2, -1));
                        iterate = false;
                        break;
                    case "Bishop":
                        directionsToCheck.push(new coordinate(-1, 1));
                        directionsToCheck.push(new coordinate(1, 1));
                        directionsToCheck.push(new coordinate(-1, -1));
                        directionsToCheck.push(new coordinate(1, -1));
                        break;
                    case "Queen":
                        directionsToCheck.push(new coordinate(0, 1));
                        directionsToCheck.push(new coordinate(0, -1));
                        directionsToCheck.push(new coordinate(-1, 0));
                        directionsToCheck.push(new coordinate(1, 0));
                        directionsToCheck.push(new coordinate(-1, 1));
                        directionsToCheck.push(new coordinate(1, 1));
                        directionsToCheck.push(new coordinate(-1, -1));
                        directionsToCheck.push(new coordinate(1, -1));
                        break;
                    case "King":
                        directionsToCheck.push(new coordinate(1, 1));
                        directionsToCheck.push(new coordinate(0, 1));
                        directionsToCheck.push(new coordinate(0, -1));
                        directionsToCheck.push(new coordinate(1, 0));
                        directionsToCheck.push(new coordinate(-1, 0));
                        directionsToCheck.push(new coordinate(-1, 1));
                        directionsToCheck.push(new coordinate(1, -1));
                        directionsToCheck.push(new coordinate(-1, -1));
                        iterate = false;
                        isKing = true;
                        break;
                }

                //call checkPath for every direction that a piece can move in, passing in other relevant parameters
                for (var i = 0; i < directionsToCheck.length; i++) {
                    checkPath(y, x, directionsToCheck[i].y, directionsToCheck[i].x, iterate, potentialSquares, isKing, boardToUse)
                }
            }

            //return the list of squares the piece can move to
            return potentialSquares;
        }


        //utilises checkSquare to return a list of squares along a path that a certain piece can take
        function checkPath(y, x, yIncrement, xIncrement, iterate, potentialSquares, isKing, boardToUse) {
            do {
                y += yIncrement;
                x += xIncrement;
                var squareStatus = checkSquare(y, x, boardToUse);
                if (squareStatus == "empty" || squareStatus == "canTake") potentialSquares.push(new coordinate(y, x));
                if (squareStatus != "empty") break;
            }
            while (iterate);
        }


        //returns the status of a square
        function checkSquare(y, x, boardToUse) {
            if (y < 0 || y > 7 || x < 0 || x > 7) return "offBoard";
            if (boardToUse[y][x].colour == $scope.currentTurnColour) return "ownColour";
            if (boardToUse[y][x].colour == "") return "empty";
            return "canTake";
        }


        //sends a prompt to the user, asking which piece they wish to transform their pawn into
        function promotionPopup() {
            var pawnBecomes = prompt("Please enter piece to transform into (Q, R, N, B)", "Q");
            //return the name of the piece, or an empty string
            if (pawnBecomes == null) return "";
            switch (pawnBecomes.toUpperCase()) {
                case "Q": return "Queen"; break;
                case "R": return "Rook"; break;
                case "N": return "Knight"; break;
                case "B": return "Bishop"; break;
                default: return "";
            }
        }


        //creates and returns an exact copy of the current board array
        function copyBoard() {
            var boardCopy = [];
            for (var row = 0; row < 8; row++) {
                boardCopy.push([]);
                for (var col = 0; col < 8; col++) {
                    boardCopy[row].push({
                        colour: $scope.board[row][col].colour,
                        name: $scope.board[row][col].name,
                        highlighted: $scope.board[row][col].highlighted,
                        squareColour: $scope.board[row][col].squareColour,
                        row: $scope.board[row][col].row,
                        col: $scope.board[row][col].col
                    });
                }
            }
            return boardCopy;
        }


        //returns true if a player has just been put into check, false if not
        function inCheck(boardToUse) {

            //if no other board is passed in, use $scope.board
            boardToUse = (boardToUse) ? boardToUse : $scope.board;

            $scope.currentTurnColour = notCurrentTurnColour();

            //for every piece of the current player's colour
            for (var x = 0; x < 8; x++) {
                for (var y = 0; y < 8; y++) {
                    if (boardToUse[y][x].colour == $scope.currentTurnColour) {

                        //find the list of all squares it can reach
                        var squaresItCanReach = findPotentialSquares(y, x, boardToUse[y][x].colour, boardToUse[y][x].name, boardToUse)

                        //for every square that piece can reach
                        for (var i = 0; i < squaresItCanReach.length; i++) {

                            //if that square contains the opponent's king, return true
                            if (boardToUse[squaresItCanReach[i].y][squaresItCanReach[i].x].name == "King" &&
                                boardToUse[squaresItCanReach[i].y][squaresItCanReach[i].x].colour != $scope.currentTurnColour) {
                                $scope.currentTurnColour = notCurrentTurnColour();
                                return true;
                            }
                        }
                    }
                }
            }
            $scope.currentTurnColour = notCurrentTurnColour();

            //otherwise, return false
            return false;
        }


        //returns true if a player has just been put into checkmate
        function inCheckmate() {

            //for every piece of the current player's colour
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    if ($scope.board[i][j].colour == $scope.currentTurnColour) {

                        //find the list of all squares it can reach
                        var possibleSquares = findPotentialSquares(i, j, $scope.currentTurnColour, $scope.board[i][j].name);

                        //for every square that piece can reach
                        for (var a = 0; a < possibleSquares.length; a++) {
                            var boardCopy = copyBoard();
                            boardCopy[possibleSquares[a].y][possibleSquares[a].x].name = boardCopy[i][j].name;
                            boardCopy[possibleSquares[a].y][possibleSquares[a].x].colour = boardCopy[i][j].colour;
                            boardCopy[i][j].name = "";
                            boardCopy[i][j].colour = "";

                            //if moving to that square would take the player out of check, return false
                            if (!inCheck(boardCopy)) return false;
                        }
                    }
                }
            }

            //otherwise return true
            return true;
        }


        //returns a boolean, true if it is black's turn, false otherwise
        $scope.blackTurn = function () { return ($scope.currentTurnColour == "B"); }


        //asks the user to confirm that they want to concede and updates the global variable hasConceded
        $scope.concede = function () {
            $scope.hasConceded = confirm("Click okay to concede to your opponent, or click cancel.");
        }


    }
})();