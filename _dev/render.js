//====================== Render functions =================//
		
		function render(){ //rendering to the screen

			game.contextBackground.clearRect(0, 0, game.width, game.height); //clearing the star 'trails'
			game.contextEnemies.clearRect(0, 0, game.width, game.height); //clearing the star 'trails'
			//setting the fill color to white
			for(var o in game.stars){
				var star = game.stars[o]; //adding a star var to simplify				
				game.contextBackground.drawImage(game.images[star.image],star.x, star.y, star.size, star.size); //drawing the stars
			}

			//SPEED GIVE ME WHAT I NEED
			if(!game.player.rendered && !game.paused){ //if player not rendered i.e. rendered = false
				game.contextPlayer.clearRect(0 , 0, game.width, game.height); //clear trails
				if(!game.gameOver){ //if player not dead			
					game.contextPlayer.drawImage(game.images[game.player.image], game.player.x, game.player.y, game.player.size, game.player.size); //rendering
					game.player.rendered = true;
				}
			}

			for(var g in game.enemies){ //for each enemy
					var enemy = game.enemies[g]; //all together now
					game.contextEnemies.clearRect(enemy.x - enemy.size*0.1, enemy.y - enemy.size*0.1, enemy.size*1.8, enemy.size*1.1); //clear trails
					game.contextEnemies.drawImage(game.images[enemy.image], enemy.x, enemy.y, enemy.size, enemy.size); //rendering
			}


			for(var u in game.explosions){
				var xplos = game.explosions[u];
				var xplosFpr = Math.floor(game.images[xplos.image].width / xplos.frameWidth); //Sprite FramesperRow

				// create the sequence of frame numbers for the animation
  				for (var xplosFrameNum = xplos.startFrame; xplosFrameNum <= xplos.endFrame; xplosFrameNum++){
    				xplos.animationSequence.push(xplosFrameNum);
    			}

    			// update to the next frame if it is time
				if (xplos.counter == (xplos.frameSpeed - 1)) {
					xplos.currentFrame = (xplos.currentFrame + 1) % xplos.animationSequence.length;
				}

				// update the counter
				xplos.counter = (xplos.counter + 1) % xplos.frameSpeed;

				var xplosRow = Math.floor(xplos.animationSequence[xplos.currentFrame] / xplosFpr);
				var xplosCol = Math.floor(xplos.animationSequence[xplos.currentFrame] % xplosFpr);
 				
 				if (xplos.currentFrame <= 19){
				game.contextPlayer.drawImage(
					game.images[xplos.image],
					xplosCol * xplos.frameWidth, xplosRow * xplos.frameHeight,
      				xplos.frameWidth, xplos.frameHeight,
					xplos.x, xplos.y,
					xplos.size, xplos.size);
				}			
			}

			for(var l in game.explosions){
				if (game.explosions[l].currentFrame == 19){
					game.explosions.splice(l,1);
				}
			}

			for(var q in game.projectiles){ //for each bullet
				var proj = game.projectiles[q];
				var projFpr = Math.floor(game.images[proj.image].width / proj.frameWidth); //Sprite FramesperRow

  				// create the sequence of frame numbers for the animation
  				for (var projFrameNum = proj.startFrame; projFrameNum <= proj.endFrame; projFrameNum++){
    				proj.animationSequence.push(projFrameNum);
    			}

    			// update to the next frame if it is time
				if (proj.counter == (proj.frameSpeed - 1)) {
					proj.currentFrame = (proj.currentFrame + 1) % proj.animationSequence.length;
				}

				// update the counter
				proj.counter = (proj.counter + 1) % proj.frameSpeed;

				var projRow = Math.floor(proj.animationSequence[proj.currentFrame] / projFpr);
				var projCol = Math.floor(proj.animationSequence[proj.currentFrame] % projFpr);
 
				// game.contextPlayer.clearRect(proj.x, proj.y + game.player.bulletspeed, proj.size, proj.size);
				game.contextPlayer.drawImage(
					game.images[proj.image],
					projCol * proj.frameWidth, projRow * proj.frameHeight,
      				proj.frameWidth, proj.frameHeight,
					proj.x, proj.y,
					proj.size, proj.size);
			}



			for(var i in game.enprojectiles){ //for each bullet
				var enproj = game.enprojectiles[i];

			var enprojFpr = Math.floor(game.images[enproj.image].width / enproj.frameWidth); //Sprite FramesperRow

  				// create the sequence of frame numbers for the animation
  				for (var enprojFrameNum = enproj.startFrame; enprojFrameNum <= enproj.endFrame; enprojFrameNum++){
    				enproj.animationSequence.push(enprojFrameNum);
    			}

    			// update to the next frame if it is time
				if (enproj.counter == (enproj.frameSpeed - 1)) {
					enproj.currentFrame = (enproj.currentFrame + 1) % enproj.animationSequence.length;
				}

				// update the counter
				enproj.counter = (enproj.counter + 1) % enproj.frameSpeed;

				var enprojRow = Math.floor(enproj.animationSequence[enproj.currentFrame] / enprojFpr);
				var enprojCol = Math.floor(enproj.animationSequence[enproj.currentFrame] % enprojFpr);
 
				// game.contextPlayer.clearRect(enproj.x, enproj.y + game.player.bulletspeed, enproj.size, enproj.size);
				game.contextPlayer.drawImage(
					game.images[enproj.image],
					enprojCol * enproj.frameWidth, enprojRow * enproj.frameHeight,
      				enproj.frameWidth, enproj.frameHeight,
					enproj.x, enproj.y,
					enproj.size, enproj.size);
			}

			if (game.gameWon && game.level > 1 && game.level <=6 ){
				game.contextPlayer.font = "bold " + game.width*0.08 + "px " + game.font;				
				game.contextPlayer.fillStyle = "#FFD455";
				game.contextPlayer.fillText("Battle Won!", game.width*0.30, game.height*0.42);
				game.contextPlayer.font = "bold " + game.width*0.06 + "px " + game.font;
				game.contextPlayer.fillText(game.levelScore + " enemy ships destroyed", game.width*0.19, game.height*0.52);
				game.contextPlayer.font = "bold " + game.width*0.04 + "px " + game.font;
				game.contextPlayer.fillStyle = "white";
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
					game.contextPlayer.fillText("Tap screen to continue", game.width*0.30, game.height*0.62);
				} else {
					game.contextPlayer.fillText("Press Enter or LMB to continue", game.width*0.23, game.height*0.62);
				}
				game.levelScore = 0;
			}
			if (game.gameWon && game.level >=7){
				game.contextPlayer.font = "bold " + game.width*0.08 + "px " + game.font;				
				game.contextPlayer.fillStyle = "#CC99FF";
				game.contextPlayer.fillText("Victory!", game.width*0.35, game.height*0.42);
				game.contextPlayer.font = "bold " + game.width*0.06 + "px " + game.font;
				game.contextPlayer.fillText(game.score + " enemy ships destroyed", game.width*0.17, game.height*0.52);
				game.contextPlayer.font = "bold " + game.width*0.04 + "px " + game.font;
				game.contextPlayer.fillStyle = "white";
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
					game.contextPlayer.fillText("Tap screen to restart", game.width*0.30, game.height*0.62);
				} else {
					game.contextPlayer.fillText("Press Enter or LMB to restart", game.width*0.24, game.height*0.62);
				}
				game.levelScore = 0;
			}			
		}