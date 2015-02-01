//====================== Game state =================//
		
		function gameState() {

			//game start
			if ((game.keys[13] || mouseIsDown) && game.start && !(game.gameOver) && !(game.gameWon)) {
				game.paused = false;
				game.start = false;
				mouseIsDown = 0;				
				scores();				
			}
			
			//If Esc
			if (game.keys[27]) {
				game.lives = 0;
			}

			//game sound
			if (game.keys[119]) {
				game.sound = (game.sound) ? false : true;
				game.keys[119] = false;
				scores();
			}

			//game pause
			if ((game.keys[80]) && !(game.gameWon) && !(game.gameOver)) {
				game.paused = (game.paused) ? false : true;
				game.keys[80] = false;
			}

			//If Esc pressed or if gameover and enter pressed
			if (game.keys[27] ||
			   ((game.keys[13] || mouseIsDown) && game.paused && !(game.start) && game.gameOver && !(game.gameWon)) ||
			   ((game.keys[13] || mouseIsDown) && game.paused && !(game.start) && game.level >= 7)){

					if (game.lives < 1 || game.level >=7){
						game.level = X_Level;
						game.score = 0;
						game.lives = X_Lives;
						game.downDivision = Math.floor((300 * game.level)); //the higher the level the slower the enemies come down
					}

					resetGame();

			}
			
			//level up
			if ((game.keys[13] || mouseIsDown) && !(game.gameOver) && !(game.start) && (game.gameWon) && game.level <= 6) {					
					game.downDivision = Math.floor((300 * game.level)); //the higher the level the slower the enemies come down
					resetGame();									
			}
		}