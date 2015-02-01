(function(game){ // jshint ignore:line
	$(document).ready(function(){ // jshint ignore:line
		
		// Check if a new cache is available on page load.
		window.addEventListener('load', function(e) {

		  window.applicationCache.addEventListener('updateready', function(e) {
		    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
		      // Browser downloaded a new app cache.
		      if (confirm('A new version of InVaDeRs is available. Load it?')) {
		        window.location.reload();
		      }
		    } else {
		      // Manifest didn't changed. Nothing new to server.
		    }
		  }, false);

		}, false);

		//start listening to mouse & touch events
		window.addEventListener('load', initInput, false);

		
		// /* Connect to XML */
		$.ajax({
		type: "GET",
		url: "game.xml",
		dataType: "xml",
		async: false,
		success: function(xmldata) {
			$(xmldata).find('data').each(function(){
				// SETTINGS
				X_Sound = parseInt($(this).find('sound').text());
				X_Level = parseInt($(this).find('level').text());
				X_Lives = parseInt($(this).find('player-lives').text());
				X_PlayerSpeed = parseInt($(this).find('player-speed').text());
				X_EnemySpeed = parseInt($(this).find('enemy-speed').text());
				X_GunSpeed = parseInt($(this).find('reload-time').text());
				X_EnGunSpeed = parseInt($(this).find('enreload-time').text());
				X_BulletSpeed = parseInt($(this).find('bullet-speed').text());
				X_EnBulletSpeed = parseInt($(this).find('enbullet-speed').text());
				// INTRO TEXT
				X_Title = $(this).find('title').text();
				X_Subtitle = $(this).find('subtitle').text();
				X_dt_Start = $(this).find('dt-start').text();
				X_mb_Start = $(this).find('mb-start').text();
			});
		},
		error: function() {
			alert("The XML File could not be processed correctly.");
		}
		});


		/*GAME VARS*/

		var game = {}; //this is a global var which will contain other game vars
		game.stars = []; //this is an array which will contain our stars info: position in space and size		
		game.score = 0; //the game score
		game.levelScore = 0; //the score for each level
		game.level = X_Level; //starting at level X...
		game.lives = X_Lives; //with X ships (lives)
		game.keys = []; //the keyboard array
		game.projectiles = []; //Our proton torpedoes!
		game.enprojectiles = []; //Enemy lasers!
		game.enemies = []; //The InVaDeRs
		game.explosions = [];


		//====================== Game state ========================
		
		game.start = true;
		game.paused = true;
		game.gameWon = false;
		game.gameOver = false;
		game.delayTimer = 0;	
		
		
		//========================== Audio ==========================
		
		game.sound = X_Sound;	//on/off trigger

		game.enemyexplodeSound = new Audio("_sounds/explosion.wav");
		game.playerexplodeSound = new Audio("_sounds/blast.mp3");
		game.shootSound = new Audio("_sounds/laser.wav");
		game.deathSound = new Audio("_sounds/death.mp3");
		game.winSound = new Audio("_sounds/victory.mp3");

			
		//======================== Images ========================		
			
		game.images = [];
		game.doneImages  = 0; // will contain how many images have been loaded
		game.requiredImages = 0; // will contain how many images should be loaded
		game.font = (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) ? "Helvetica" : "Monaco";	

		
		//====================== Canvases + Images + responsiveness  ============================
		
		game.contextBackground = document.getElementById("backgroundCanvas").getContext("2d"); //defining the 4 different canvas
		game.contextEnemies = document.getElementById("enemiesCanvas").getContext("2d");
		game.contextPlayer = document.getElementById("playerCanvas").getContext("2d");
		game.contextText = document.getElementById("textCanvas").getContext("2d");
				

		$(document).ready( function(){		//making our canvases dynamically resize according to the size of the browser window
			
			//Get the canvas & context
			var c1 = $('#backgroundCanvas');
			var c2 = $('#enemiesCanvas');
			var c3 = $('#playerCanvas');
			var c4 = $('#textCanvas');
			var ct = c1.get(0).getContext('2d');
			var container = $(c1).parent();

			//Run function when browser resizes
			$(window).resize(respondCanvas);

			function respondCanvas(){ 
				c1.attr('width', $(container).width()); //max width
				c1.attr('height', $(container).height()); //max height
				c2.attr('width', $(container).width() ); //max width
				c2.attr('height', $(container).height()); //max height
				c3.attr('width', $(container).width()); //max width
				c3.attr('height', $(container).height()); //max height
				c4.attr('width', $(container).width()); //max width
				c4.attr('height', $(container).height() * 0.1 ); //max height
				
				
				game.width = $(container).width(); //we'll use width and height to limit the game to our canvas size
				game.height = $(container).height();
				
				game.player = {	//creating our player
					x: game.width*0.46,
					y: game.height*0.90,
					size: game.height*0.08,
					speed: X_PlayerSpeed,
					bulletspeed: X_BulletSpeed*game.height/1000,
					image: 0,
					rendered: false,
					crashed: false					
				};
				
				//the below needs width and height defined, thus we put it here	

				//======================  Game settings =====================				
				game.enemySpeed = X_EnemySpeed * game.height/2500; //the enemies' speed
				game.EnBulletSpeed = X_EnBulletSpeed * game.height/1000;
				game.downCount = 1;
				game.downDivision = 600; //the higher the level the slower the enemies come down
				game.left = false;
				game.down = false;
				game.fullShootTimer = X_GunSpeed;	//this timer will limit the number of bullets being fired
				game.enfullShootTimer = X_EnGunSpeed;	//this timer will limit the number of bullets being fired by enemies
				game.shootTimer = game.fullShootTimer;
				game.enshootTimer = game.enfullShootTimer;

				//=========================== Game loading Screen =================================== 	
				game.contextBackground.font = "bold " + game.width*0.08 + "px " + game.font; 
				game.contextBackground.fillStyle = "white";
				game.contextBackground.fillText("Loading...", game.width*0.30, game.height*0.47);
			}

			//Initial call 
			respondCanvas();

		}); // jshint ignore:line
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
		//====================== Game functions =================//


		//Keyboard		
		$(document).keydown(function(e){    //using jquery to listen to pressed keys
			game.keys[e.keyCode ? e.keyCode : e.which] = true;	//and cross browser proofing
		});
		
		$(document).keyup(function(e){   //using jquery to listen to released keys
			delete game.keys[e.keyCode ? e.keyCode : e.which]; //once key is released, delete the key pressed action previously defined 
		});
		
		//mouse and touch screens
		var canvas;
		var ctx;
		var canvasX;
		var canvasY;
		var mouseIsDown = 0;
		var moveX = canvasX;      //initial define of moveX as canvasX position
 

		function initInput() {
        canvas = document.getElementById("playerCanvas");
        ctx = canvas.getContext("2d");
		         
        canvas.addEventListener("mousedown",mouseDown, false);
        canvas.addEventListener("mouseup", mouseUp, false);        
        canvas.addEventListener("mousemove",mouseXY, false);

        canvas.addEventListener("touchstart", touchDown, false);
        canvas.addEventListener("touchend", touchUp, false);
        canvas.addEventListener("touchcancel", touchUp, false);
        canvas.addEventListener("touchleave", touchUp, false);
		canvas.addEventListener("touchmove", touchXY, false);
		                
		}
		
		
		function mouseUp() {
			mouseIsDown = 0;
			mouseXY();
		}
		 
		function touchUp() {
			mouseIsDown = 0;
		}
		 
		function mouseDown() {
			mouseIsDown = 1;
			mouseXY();
		}
		  
		function touchDown() {
			mouseIsDown = 1;
			touchXY();
		}
		
		function mouseXY(e) {
			if (e) {
				e.preventDefault();
			canvasX = e.pageX - canvas.offsetLeft;
			canvasY = e.pageY - canvas.offsetTop;
			//showPos();
			}
		}
		 
		function touchXY(e) {
			if (e) {
				e.preventDefault();
			canvasX = e.targetTouches[0].pageX - canvas.offsetLeft;
			canvasY = e.targetTouches[0].pageY - canvas.offsetTop;
			}
		}
				
		function addStars(num){ //this function is going to take a number thus num
			for(var i=0; i<num; i++) {
				game.stars.push({ //push values to the game.stars array
					x:Math.floor(Math.random() * game.width), //floor will round down x which will be a random number between 0 and 550
					y:game.height + 10, //+10 to spawn then outside the screen so players can't see them spawning
					size: Math.random()*game.width*0.003,
					image: Math.floor(Math.random()*(19-14+1)+14) // a random number between 14 and 18	
				});
			}
		}
		
		function resetGame(){
			mouseIsDown = 0;
			game.gameOver = false; 
			game.gameWon = false;					
			game.downCount = 1;
			game.left = false;
			game.down = false;
			game.enshootTimer = game.enfullShootTimer;
			game.contextBackground.clearRect(1, 1, game.width, game.height); 
			game.contextPlayer.clearRect(1, 1, game.width, game.height); 
			game.contextEnemies.clearRect(1, 1, game.width, game.height); 
			game.contextText.clearRect(1, 1, game.width, game.height); 
			game.projectiles = [];
			game.enprojectiles = [];
			game.enemies = [];

			for(var y = 0; y < game.level; y++) {	// y enemies vertically..
				for(var x = 0; x < game.level; x++){ // ..by x horizontally
					game.enemies.push({ //adding value to the game.enemies array
						x: game.width*0.05  + (x*(game.width*0.15)) ,  //setting positions (1st bit) and making space between enemies (2nd bit)
						y: game.height*0.10 + y*(game.player.size),
						size: game.height*0.06, //the size of our enemies
						image: 1, //their ships...
						dead: false,
						deadTime: 60
					});
				}
			}

			game.player = {	//creating our player
				x: game.width*0.46,
				y: game.height*0.90,
				size: game.height*0.08,
				speed: X_PlayerSpeed,
				bulletspeed: X_BulletSpeed*game.height/1000,
				image: 0,
				rendered: false,
				crashed: false					
			};
			game.paused = false;
			scores();

		}

		function Xplode(xpos,ypos){ //add bullet function will be triggered every time space is pressed
			game.explosions.push({
				x: xpos,
				y: ypos,
				frameWidth: 96,
				frameHeight: 96,
				size: game.height*0.07,
				startFrame: 0,
				endFrame: 19,
				frameSpeed: 2,
				animationSequence: [],  // array holding the order of the animation
				currentFrame: 0,        // the current frame to draw
				counter: 0,             // keep track of frame rate
				image: 3
			});
			if (game.soundStatus == "ON"){game.enemyexplodeSound.play();}
		}

		function addBullet(){ //add bullet function will be triggered every time space is pressed
			game.projectiles.push({
				x: game.player.x + game.player.size*0.40,
				y: game.player.y - game.player.bulletspeed*1.8,
				size: game.height*0.022,
				frameWidth: 48,
				frameHeight: 48,
				startFrame: 0,
				endFrame: 11,
				frameSpeed: 4,
				animationSequence: [],  // array holding the order of the animation
				currentFrame: 0,        // the current frame to draw
				counter: 0,             // keep track of frame rate
				image: 2

			});
		}

		function addEnBullet(){ //add bullet function will be triggered every few seconds
			xEn = game.enemies.length;
			pEn = (xEn < 2) ? 0 : Math.floor(Math.random()*((xEn-1)+1)); //a random number between 0 and the maximum array index (xEn-1)

			game.enprojectiles.push({
				x: game.enemies[pEn].x + game.enemies[pEn].size*0.42,
				y: game.enemies[pEn].y + game.enemies[pEn].size,
				size: game.height*0.035,
				frameWidth: 64,
				frameHeight: 64,
				startFrame: 0,
				endFrame: 2,
				frameSpeed: 5,
				animationSequence: [],  // array holding the order of the animation
				currentFrame: 0,        // the current frame to draw
				counter: 0,
				image: 20
			});
		}
		
		function scores(){ 
			game.contextText.fillStyle = "#FFD455";
			game.contextText.font = game.height*0.025 + "px helvetica";
			game.contextText.clearRect(0, 0, game.width, game.height*0.1);
			game.contextText.fillText("Level: " + game.level, game.height*0.03, game.height*0.04); //printing level
			game.contextText.fillText("Score: " + game.score, game.height*0.15, game.height*0.04); //printing the score
			game.soundStatus = (game.sound) ? "ON" : "OFF";
			if (!navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
				game.contextText.fillText("Sound(F8): " + game.soundStatus, game.width - (game.height*0.45), game.height*0.04); //printing lives
			}
			game.contextText.fillText("Hangar: ", game.width - (game.height*0.22), game.height*0.04); 
			for (i = 0; i < game.lives; i++){
				//printing lives
				game.contextText.drawImage(game.images[0], ((i * game.height*0.03)+game.width - (game.height*0.12)), game.height*0.015, game.height*0.035, game.height*0.035);
			}

		}
		
		function Collision(first, second){ //detecting rectangles' (image) collision, first is going to be the bullet, second will be the enemies. Note: the function itself can be applied to anything, 'first' and 'second' can be any variable as long as they have x and y values
			return !(first.x > second.x + second.size ||
				first.x + first.size < second.x ||
				first.y > second.y + second.size ||
				first.y + first.size < second.y);
		}

		function PlayerDie(){
			if (game.soundStatus == "ON"){game.playerexplodeSound.play();}
			game.player.crashed = true;
			game.gameOver = true;
			game.lives--;
			game.score = game.score - game.levelScore;
			scores();
			setTimeout(function(){
				game.paused = true;
				mouseIsDown = 0;

				if (game.gameOver && game.paused && game.lives < 1){
					game.contextPlayer.font = "bold " + game.width*0.08 + "px " + game.font;
					game.contextPlayer.fillStyle = "#FF7F00";
					game.contextPlayer.fillText("Game Over", game.width*0.30, game.height*0.42);
					game.contextPlayer.font = "bold " + game.width*0.06 + "px " + game.font;
					game.contextPlayer.fillText(game.score + " enemy ships destroyed", game.width*0.19, game.height*0.52);
					game.contextPlayer.font = "bold " + game.width*0.04 + "px " + game.font;
					game.contextPlayer.fillStyle = "white";
					if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
						game.contextPlayer.fillText("Tap screen to restart", game.width*0.30, game.height*0.62);
					} else {
						game.contextPlayer.fillText("Press Enter or LMB to restart", game.width*0.23, game.height*0.62);
					}

					if (game.soundStatus == "ON") {
						game.deathSound.play();
					}

					game.levelScore = 0;

				}

			if (game.gameOver && game.paused && game.lives >= 1){
				game.contextPlayer.font = "bold " + game.width*0.06 + "px " + game.font;
				game.contextPlayer.fillStyle = "#FFD455";
				game.contextPlayer.fillText("Your ship has been Destroyed!", game.width*0.11, game.height*0.45);
				game.contextPlayer.font = "bold " + game.width*0.04 + "px " + game.font;
				game.contextPlayer.fillText("(" + game.lives + " ships left)",  game.width*0.40, game.height*0.52 );
				game.contextPlayer.fillStyle = "white";

				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
					game.contextPlayer.fillText("Tap screen to continue", game.width*0.30, game.height*0.58);
				} else {
					game.contextPlayer.fillText("Press Enter or LMB to continue", game.width*0.22, game.height*0.62);
				}

				game.levelScore = 0;
			}


			}, 1000);
		}

		//Init	
		function init(){ //initialising our game full of stars all over the screen
			for(var i=0; i<600; i++) {
				game.stars.push({ //push values to the game.stars array
					x:Math.floor(Math.random() * game.width), //floor will round down x which will be a random number between 0 and 550
					y:Math.floor(Math.random() * game.height),
					size:Math.random()*game.width*0.003, //size of the stars
					image: Math.floor(Math.random()*(19-14+1)+14) //returns a random number between and 
				});
			}
			for(var y = 0; y < game.level; y++) {	// y enemies vertically..
				for(var x = 0; x < game.level; x++){ // ..by x horizontally
					game.enemies.push({ //adding value to the game.enemies array
						x: game.width*0.15  + (x*(game.width*0.15)) ,  //setting positions (1st bit) and making space between enemies (2nd bit)
						y: game.height*0.10 + y*(game.player.size),
						size: game.height*0.06, //the size of our enemies
						image: 1, //their ships...
						dead: false,
						deadTime: 60
					});
				}
			}	
								
			loop();
			
		}
			
		function loop(){ //the loop
		
			requestAnimFrame(loop);			
			gameState();
			if (!game.paused){
			update();
			render();
			}
		}

		//====================== Images engine =================//
		
		function initImages(paths) { //our images engine: passing the array 'paths' to the function
			game.requiredImages = paths.length;  //the number of required images will be equal to the length of the paths array
			for(var i in paths){
				var img = new Image(); //defining img as a new image
				img.src = paths[i]; //defining new image src as paths[i]
				game.images[i] = img; //defining game.image[i] as a new image (with paths)
				/*jshint -W083 */
				game.images[i].onload = function(){  //once an image loads..
					game.doneImages++; //  ..increment the doneImages variable by 1
				};
			}
		}	

		function checkImages(){	//checking if all images have been loaded. Once all loaded run init
			if(game.doneImages >= game.requiredImages){
				game.contextBackground.clearRect(0, 0, game.width, game.height);
				game.contextBackground.font = "bold " + game.width*0.11 + "px " + game.font; //Intro screen
				game.contextBackground.fillStyle = "purple";				
				game.contextBackground.fillText(X_Title, game.width*0.2, game.height*0.40);
				game.contextBackground.font = "bold " + game.width*0.04 + "px " + game.font; 
				game.contextBackground.fillStyle = "#FFD455";
				game.contextBackground.fillText(X_Subtitle, game.width*0.1, game.height*0.55);
				game.contextBackground.fillStyle = "white";
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
					game.contextBackground.fillText(X_mb_Start, game.width*0.25, game.height*0.65);
				} else {
					game.contextBackground.fillText(X_dt_Start, game.width*0.1, game.height*0.70);
				}
				init(); //after checking images run init()
			}else{
				setTimeout(function(){
					checkImages();
				}, 1);
			}
		}
			
		initImages([	//using initimages function to load our images
			"_img/_dist/fighter/fighter.png",
			"_img/_dist/enemy.png",
			"_img/_dist/laser.png",
			"_img/_dist/explosion.png",
			"_img/_dist/fighter/fighter_right1.png",
			"_img/_dist/fighter/fighter_right2.png",
			"_img/_dist/fighter/fighter_right3.png",
			"_img/_dist/fighter/fighter_right4.png",
			"_img/_dist/fighter/fighter_right5.png",
			"_img/_dist/fighter/fighter_left1.png",
			"_img/_dist/fighter/fighter_left2.png",
			"_img/_dist/fighter/fighter_left3.png",
			"_img/_dist/fighter/fighter_left4.png",
			"_img/_dist/fighter/fighter_left5.png",
			"_img/_dist/stars/star1.png",
			"_img/_dist/stars/star2.png",
			"_img/_dist/stars/star3.png",
			"_img/_dist/stars/star4.png",
			"_img/_dist/stars/star5.png",
			"_img/_dist/stars/star6.png",
			"_img/_dist/missile.png"
		]);
		
		checkImages(); //this function call starts our game
	/* jshint ignore:start */
	});
})();
/* jshint ignore:end */

window.requestAnimFrame = (function(){  // Creating a request animAnimeFrame function and making it work across browsers.  window.requestAnimationFrame is an HTML built in 60fps anim function
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame    ||
			window.msRequestAnimationFrame    ||
			function( callback ){
				// if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
				// 	window.setTimeout(callback, 1000 / 30);
				// }	
				// else {
				// 	window.setTimeout(callback, 1000 / 60);
				// }
				window.setTimeout(callback, 1000 / 60);			
			};
})(); // jshint ignore:line