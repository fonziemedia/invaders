		//====================== Update function =================//
		
		function update(){ //game logic goes here			
			addStars(1);		
			if(game.downCount > 100000){game.downCount = 0;} //this is necessary otherwise game.downCount++ would break the game at some point
			game.downCount++;
			
			if(game.shootTimer > 0)game.shootTimer--; //start ticking our timer down
			if(game.enshootTimer > 0)game.enshootTimer--; //start ticking our enemy shoot timer down

			
			for(var s in game.stars){
				if(game.stars[s].y <= -5){ //removing gone passed stars from memory
					game.stars.splice(s,1); //splice takes objects out of an array completely, start at arg1 and remove arg2 i.e. start from i and remove 1 star 
				}
				game.stars[s].y--;
			}
			

			//define keys + mouse & touch controls
			
			if (mouseIsDown && !(game.paused) && !(game.gameOver) && !(game.gameWon)) {
				
				if((canvasX > (game.player.size/4) && canvasX <= (game.width - game.player.size/4)) && (canvasY > game.player.size) && canvasY <= (game.height - game.player.size/6)) {
				
				
				moveRight1 = (canvasX > moveX && canvasX <= moveX + 2) ? true : false;
				moveRight2 = (canvasX > moveX + 2 && canvasX <= moveX + 4) ? true : false;
				moveRight3 = (canvasX > moveX + 4 && canvasX <= moveX + 6) ? true : false;
				moveRight4 = (canvasX > moveX + 6 && canvasX <= moveX + 8) ? true : false;
				moveRight5 = (canvasX > moveX + 8) ? true : false;

				moveLeft1 = (canvasX < moveX && canvasX >= moveX -2) ? true : false;
				moveLeft2 = (canvasX < moveX - 2 && canvasX >= moveX -4) ? true : false;
				moveLeft3 = (canvasX < moveX - 4 && canvasX >= moveX -6) ? true : false;
				moveLeft4 = (canvasX < moveX - 6 && canvasX >= moveX -8) ? true : false;
				moveLeft5 = (canvasX < moveX - 8) ? true : false;

				game.player.x = canvasX-game.player.size/2;
				game.player.y = canvasY-game.player.size*1.2;
				
				if (moveRight1) {
					game.player.image = 4;
				} else if (moveRight2) {
					game.player.image = 5;
				} else if (moveRight3) {
					game.player.image = 6;
				} else if (moveRight4) {
					game.player.image = 7;
				} else if (moveRight5) {
					game.player.image = 8;

				} else if (moveLeft1) {
					game.player.image = 9;
				} else if (moveLeft2) {
					game.player.image = 10;
				} else if (moveLeft3) {
					game.player.image = 11;
				} else if (moveLeft4) {
					game.player.image = 12;
				} else if (moveLeft5) {
					game.player.image = 13;
				} else {
				 game.player.image = 0;	
				}

				game.player.rendered = false;				
				moveX = canvasX; 	//second define of moveX as canvasX position
				
				}
				/*		console.log (canvasX)
						console.log (moveX);
						console.log (moveRight);*/
			}

			if (!mouseIsDown && !game.gameOver) {
				game.player.image = 0;
				game.player.rendered = false;
			}
			
			//left
			if(game.keys[37] || game.keys[65] && !(game.gameOver) && !(game.gameWon)){ //if key pressed..				
					if(game.player.x > game.player.size/50){ // (keeping it within the boundaries of our canvas)
					game.player.x-=game.player.speed; //..do this
					game.player.image = 13;
					game.player.rendered = false;
			}}
			//right
			if(game.keys[39] || game.keys[68] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.x <= game.width - game.player.size){
					game.player.x+=game.player.speed;
					game.player.image = 8;
					game.player.rendered = false;
			}}
			if(game.keys[38] || game.keys[87] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.y > game.player.size/12){
					game.player.y-=game.player.speed;
					game.player.rendered = false;
			}}
			if(game.keys[40] || game.keys[83] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.y <= game.height - game.player.size){
					game.player.y+=game.player.speed;
					game.player.rendered = false;
				}	
			}
						
			if(game.downCount % game.downDivision === 0){   //this is our timer for enemies to change movement direction. If the division of these vars equals 0 then..
				game.down = true; //move enemy ships down
			}
			
			
			for(var i in game.enemies){ //for each enemy in the game.enemies array..
				if (!game.enemies[i].dead) {

					if (game.enemies[i].x >= game.width*0.9) {game.left = true;}
					if (game.enemies[i].x <= game.width*0.1) {game.left = false;}

					if(!game.down){
						if(game.left){ //if game left = true
							game.enemies[i].x-=game.enemySpeed;	//move left			
						}else{
							game.enemies[i].x+=game.enemySpeed; //move right
						}
					}
					
					if(game.down){
						game.enemies[i].y+=game.enemySpeed;
					}							
					
					// RANDOMIZING ENEMY MOVEMENT
					// FOR REFERENCE ONLY: Math.floor(Math.random()*((xEn-1)+1)); //a random number between 0 and the maximum array index (xEn-1)

					// if (game.enemies[i].x < 10){
					// 	game.enemies[i].x += game.enemySpeed;
					// } else if (game.enemies[i].x > game.width*0.95){
					// 	game.enemies[i].x -= game.enemySpeed;
					// } else if (game.enemies[i].x > game.player.x){
					// 	game.enemies[i].x -= game.enemySpeed;
					// } else if (game.enemies[i].x < game.player.x){
					// 	game.enemies[i].x += game.enemySpeed;
					// } else {
					// 	game.enemies[i].x-= Math.random() < 0.5 ? -(Math.floor(Math.random()*((game.enemySpeed*1.2)-game.enemySpeed+1)+game.enemySpeed)) : Math.floor(Math.random()*((game.enemySpeed*1.2)-game.enemySpeed+1)+game.enemySpeed);	//move left							
					// }	

					// if (game.enemies[i].y < 10){
					// 	game.enemies[i].y += game.enemySpeed;
					// } else if (game.enemies[i].y > game.height*0.70){
					// 	game.enemies[i].y -= game.enemySpeed;
					// } else {
					// game.enemies[i].y+= Math.random() < 0.5 ? -(Math.floor(Math.random()*((game.enemySpeed*1.2)-game.enemySpeed+1)+game.enemySpeed)) : Math.floor(Math.random()*((game.enemySpeed*1.2)-game.enemySpeed+1)+game.enemySpeed);	//move left			
					// }
					
					//enemy breaching defenses (shit hits the fan)
					if((game.enemies[i].y >= game.height - (game.player.size)) && !(game.gameOver)) {
						game.contextPlayer.clearRect(game.player.x, game.player.y, game.player.size, game.player.size);
						Xplode(game.player.x, game.player.y);
						PlayerDie(); 
					}
					
					//player-enemy collision
					if(Collision(game.player, game.enemies[i]) && !game.enemies[i].dead && !game.gameOver){				
						Xplode(game.player.x, game.player.y);
						Xplode(game.enemies[i].x, game.enemies[i].y);
						PlayerDie();
						game.contextEnemies.clearRect(game.enemies[i].x, game.enemies[i].y, game.enemies[i].size, game.enemies[i].size);
						game.enemies[i].dead = true;
						game.enemies.splice(i,1);
					}

					if(game.enemies.length > 0 && game.enshootTimer <=0 && !(game.paused)){ //only add a bullet if space is pressed and enough time has passed i.e. our timer has reached 0
					addEnBullet();
					game.enshootTimer = game.enfullShootTimer; //resetting our timer back to 15
					}
				}					
			}

			if(!game.gameOver) {
				for (var e in game.explosions){ //making expolosions move
						if(!game.down){
							if(game.left){ //if game left = true
								game.explosions[e].x-=game.enemySpeed/2;	//move left			
							}else{
								game.explosions[e].x+=game.enemySpeed/2; //move right
							}
						}
						if(game.down){
							game.explosions[e].y+=game.enemySpeed/2;
						}
				}
			}
						
			for(var d in game.projectiles){ //making each bullet fired move
				game.projectiles[d].y-= game.player.bulletspeed; //bullet speed
				if(game.projectiles[d].y <= -game.projectiles[d].size*2){ //if a bullet goes off the screen..
					game.projectiles.splice(d,1); // ..remove it from the array/memory
					}
			}

			for(var c in game.enprojectiles){ //making each bullet fired move
				game.enprojectiles[c].y+= game.EnBulletSpeed; //bullet speed

				if (game.level >=4){
					if (game.enprojectiles[c].y <= game.player.y){
						/*jshint -W030 */ 
						(game.enprojectiles[c].x >= game.player.x) ? game.enprojectiles[c].x -= 2 : game.enprojectiles[c].x += 2;
					}
				}

				if(game.enprojectiles[c].y >= game.height + (game.height*0.05)) { //if a bullet goes off the screen..
					game.enprojectiles.splice(c,1); // ..remove it from the array/memory
					}
			}

			if((game.keys[32] || mouseIsDown) && game.shootTimer <=0 && !(game.gameOver)){ //only add a bullet if space is pressed and enough time has passed i.e. our timer has reached 0
				addBullet();
				if (game.soundStatus == "ON"){game.shootSound.play();}
				game.shootTimer = game.fullShootTimer; //resetting our timer back to 15
			}	

			//player bullet collision
			for(var m in game.enemies){																
				for(var p in game.projectiles){
					if(Collision(game.enemies[m], game.projectiles[p]) && !game.enemies[m].dead){ //dead check avoids ghost scoring
						if(game.soundStatus == "ON"){game.enemyexplodeSound.play();}
						game.projectiles.splice(p,1);
						game.enemies[m].dead = true;
						if (!game.player.crashed){
							game.score++;
							game.levelScore++;							
						}
						// game.contextEnemies.clearRect(game.projectiles[p].x, game.projectiles[p].y, game.projectiles[p].size, game.projectiles[p].size*1.8);	
						Xplode(game.enemies[m].x, game.enemies[m].y);
						scores();
					}
				}
			}

			for (var t in game.enemies){ //splicing enemies needs to be here
				if(game.enemies[t].dead){
					game.contextEnemies.clearRect(game.enemies[t].x, game.enemies[t].y, game.enemies[t].size, game.enemies[t].size);						
					game.enemies.splice(t,1);
				}
			}

			//enemy bullet collision
			for(var n in game.enprojectiles){						
				if(Collision(game.player, game.enprojectiles[n]) && !(game.gameOver)){
					game.enprojectiles.splice(n,1);
					game.contextPlayer.clearRect(game.player.x, game.player.y, game.player.size, game.player.size);
					Xplode(game.player.x, game.player.y);
					PlayerDie();
				}
			}
			
			if(game.enemies.length <= 0 && !(game.gameOver) && !(game.gameWon)){ //if the enemies array is empty..
				if (game.delayTimer < 50) {
					game.delayTimer++;
					if (game.delayTimer >= 50) {
						if(game.soundStatus == "ON"){game.winSound.play();}
						game.level++;	
						game.gameWon = true;
						game.paused = true;
						game.delayTimer = 0;
						mouseIsDown = 0; 
					}	
				}
			}
		}	