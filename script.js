(function(game){ //keeping our code within a function so that variables are not accessible via console (prevent hacking)
	$(document).ready(function(){ //using jquery $ and telling the computer to only run the below once the whole document(webpage) has loaded, this way our script doesn't need to be in the footer to run properly
		
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
				X_Sound = $(this).find('sound').text();
				X_Level = $(this).find('level').text();
				X_Lives = $(this).find('player-lives').text();
				X_PlayerSpeed = $(this).find('player-speed').text();
				X_EnemySpeed = $(this).find('enemy-speed').text();
				X_GunSpeed = $(this).find('reload-time').text();
				X_EnGunSpeed = $(this).find('enreload-time').text();
				X_BulletSpeed = $(this).find('bullet-speed').text();
				X_EnBulletSpeed = $(this).find('enbullet-speed').text();
				X_EnBullet = $(this).find('enbullet-speed').text();
				X_EnBulletSpeed = $(this).find('enbullet-speed').text();
				// INTRO TEXT
				X_Title = $(this).find('title').text();
				X_Subtitle = $(this).find('subtitle').text();
				X_dt_Start = $(this).find('dt-start').text();
				X_mb_Start = $(this).find('mb-start').text();
			})
		},
		error: function() {
			alert("The XML File could not be processed correctly.");
		}
		});


		/*THE GAME*/

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
		
		
		
		
		//========================== Audio ==========================
		
		game.sound = parseInt(X_Sound);

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
		
		//====================== Game state ========================
		
		game.start = true;
		game.paused = true;
		game.gameWon = false;
		game.gameOver = false;
		game.delayTimer = 0;
		
		
		//====================== Canvases + Images + responsiveness  ============================
		
		game.contextBackground = document.getElementById("backgroundCanvas").getContext("2d"); //defining the 4 different canvas
		game.contextEnemies = document.getElementById("enemiesCanvas").getContext("2d");
		game.contextPlayer = document.getElementById("playerCanvas").getContext("2d");
		game.contextText = document.getElementById("textCanvas").getContext("2d");
				


		$(document).ready( function(){							//making our canvases dynamically resize according to the size of the browser window
			
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
					width: game.height*0.08,
					height: game.height*0.08,
					speed: X_PlayerSpeed,
					image: 0,
					rendered: false,
					crashed: false					
				};
				
				//======================  Game settings =====================		
				
				game.enemySpeed = X_EnemySpeed * game.height/2500; //the enemies' speed
				game.leftCount = 1; //game timers for making enemies move left-right and charge down
				game.downCount = 1;
				game.downDivision = 600; //the higher the level the slower the enemies come down
				game.leftDivision = parseInt(game.width*0.20);
				game.left = false;
				game.down = false;
				game.fullShootTimer = X_GunSpeed;	//this timer will limit the number of bullets being fired
				game.enfullShootTimer = X_EnGunSpeed;	//this timer will limit the number of bullets being fired by enemies
				game.shootTimer = game.fullShootTimer;
				game.enshootTimer = game.enfullShootTimer;								
			}

			//Initial call 
			respondCanvas();

		}); 
		
		
		//====================== member functions =================//
		
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
			// showPos();
			}
		}
		

	
		 
		/* function showPos() {
			ctx.font="14px Arial";
			ctx.textAlign="center";
			ctx.textBaseline="middle";
			ctx.fillStyle="rgb(0,0,0)";
			var str = canvasX + ", " + canvasY;
			if (mouseIsDown) str = str + " down";
			if (!mouseIsDown) str = str + " up";
			ctx.clearRect(0,0, canvas.width,canvas.height);
			ctx.fillText(str, canvas.width /2, canvas.height / 2, canvas.width - 10);
		}
		*/
		
		//====================== Init functions =================//
		
		
		function init(){ //initialising our game full of stars all over the screen
			for(i=0; i<600; i++) {
				game.stars.push({ //push values to the game.stars array
					x:Math.floor(Math.random() * game.width), //floor will round down x which will be a random number between 0 and 550
					y:Math.floor(Math.random() * game.height),
					size:Math.random()*game.width*0.003, //size of the stars
					image: Math.floor(Math.random()*(19-14+1)+14) //returns a random number between and 
				});
			}
			for(y = 0; y < game.level; y++) {	// y enemies vertically..
				for(x = 0; x < game.level; x++){ // ..by x horizontally
					game.enemies.push({ //adding value to the game.enemies array
						x: game.width*0.15  + (x*(game.width*0.15)) ,  //setting positions (1st bit) and making space between enemies (2nd bit)
						y: game.height*0.10 + y*(game.player.height),
						width: game.height*0.06, //the size of our enemies
						height: game.height*0.06,
						image: 1, //their ships...
						dead: false,
						deadTime: 20
					});
				}
			}	
								
			loop();
			
		}
		
		//====================== Game state =================//
		
		function gameStart() {

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
					mouseIsDown = 0;
					game.gameOver = false;	
					game.gameWon = false;
					if (game.lives < 1 || game.level >=7){
						game.level = X_Level;
						game.score = 0;
						game.lives = X_Lives;
						game.downDivision = Math.floor((300 * game.level)); //the higher the level the slower the enemies come down
						game.leftDivision = parseInt((game.width*0.25)-((game.width*0.035)*game.level)); 
					}
					game.downCount = 1;
					game.leftCount = 1;
					game.left = false;
					game.enfullShootTimer = X_EnGunSpeed * game.enemies.length / (game.level * game.enemies.length / 2);
					game.enshootTimer = game.enfullShootTimer;
					game.down = false;
					game.contextBackground.clearRect(1, 1, game.width, game.height); 
					game.contextPlayer.clearRect(1, 1, game.width, game.height); 
					game.contextEnemies.clearRect(1, 1, game.width, game.height); 
					game.contextText.clearRect(1, 1, game.width, game.height);
					game.projectiles = []; 
					game.enprojectiles = [];
					game.enemies = [];
					
					for(y = 0; y < game.level; y++) {	// y enemies vertically..
						for(x = 0; x < game.level; x++){ // ..by x horizontally
							game.enemies.push({ //adding value to the game.enemies array
								x: game.width*0.05  + (x*(game.width*0.15)) ,  //setting positions (1st bit) and making space between enemies (2nd bit)
								y: game.height*0.10 + y*(game.player.height),
								width: game.height*0.06, //the size of our enemies
								height: game.height*0.06,
								image: 1, //their ships...
								dead: false,
								deadTime: 20
							});
						}
					}

					game.player = {	//creating our player
						x: game.width*0.46,
						y: game.height*0.90,
						width: game.height*0.08,
						height: game.height*0.08,
						speed: X_PlayerSpeed,
						image: 0,
						rendered: false,
						crashed: false					
					};
					game.paused = false;
					scores();
			};
			
			//level up
			if ((game.keys[13] || mouseIsDown) && !(game.gameOver) && !(game.start) && (game.gameWon) && game.level <= 6) {
					mouseIsDown = 0; 
					game.gameWon = false;					
					game.downCount = 1;
					game.leftCount = 1;					
					game.downDivision = Math.floor((300 * game.level)); //the higher the level the slower the enemies come down
					game.leftDivision = parseInt((game.width*0.25)-((game.width*0.035)*game.level)); //the time it takes for enemies to turn: it's 25% of the witdth (the smaller the screen the faster they turn) minus a proportionate percentage per game level (25% - 3.5% per each level, because the more enemies on screen the faster they need to turn to keep them on screen.
					game.left = false;
					game.down = false;
					game.enfullShootTimer = X_EnGunSpeed / game.level;
					game.enshootTimer = game.enfullShootTimer;
					game.contextBackground.clearRect(1, 1, game.width, game.height); 
					game.contextPlayer.clearRect(1, 1, game.width, game.height); 
					game.contextEnemies.clearRect(1, 1, game.width, game.height); 
					game.contextText.clearRect(1, 1, game.width, game.height); 
					game.projectiles = [];
					game.enprojectiles = [];
					game.enemies = [];
										
					
					for(y = 0; y < game.level; y++) {	// y enemies vertically..
						for(x = 0; x < game.level; x++){ // ..by x horizontally
							game.enemies.push({ //adding value to the game.enemies array
								x: game.width*0.05  + (x*(game.width*0.15)) ,  //setting start spawning position according to width (1st bit) and making space between enemies (2nd bit)
								y: game.height*0.10 + y*(game.player.height),
								width: game.height*0.06, //the size of our enemies
								height: game.height*0.06,
								image: 1, //their ships...
								dead: false,
								deadTime: 20
							});
						}
					}

					game.player = {	//reseting our player
						x: game.width*0.46,
						y: game.height*0.90,
						width: game.height*0.08,
						height: game.height*0.08,
						speed: X_PlayerSpeed,
						image: 0,
						rendered: false,
						crashed: false					
					};
					game.paused = false;
					scores();
			}
		}
				
			/*
			up - 38
			down - 40
			left - 37
			right - 39
			
			w - 87
			s - 83
			a - 65
			d - 68
			
			space - 32
			*/
				
				
		//====================== Update functions =================//
		
		function update(){ //game logic goes here			
			addStars(1);		
			if(game.leftCount > 100000)game.leftCount = 0; //this is necessary otherwise game.leftCount++ would break the game at some point
			if(game.downCount > 100000)game.downCount = 0; //this is necessary otherwise game.downCount++ would break the game at some point
			game.downCount++;
			game.leftCount++; //adding to our counters
			
			if(game.shootTimer > 0)game.shootTimer--; //start ticking our timer down
			if(game.enshootTimer > 0)game.enshootTimer--; //start ticking our enemy shoot timer down

			
			for(i in game.stars){
				if(game.stars[i].y <= -5){ //removing gone passed stars from memory
					game.stars.splice(i,1); //splice takes objects out of an array completely, start at arg1 and remove arg2 i.e. start from i and remove 1 star 
				}
				game.stars[i].y--;
			}
			

			//define keys + mouse & touch controls
			
			if (mouseIsDown && !(game.paused) && !(game.gameOver) && !(game.gameWon)) {
				
				if((canvasX > (game.player.width/4) && canvasX <= (game.width - game.player.width/4)) && (canvasY > game.player.height) && canvasY <= (game.height - game.player.height/6)) {
				
				
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

				game.player.x = canvasX-game.player.width/2;
				game.player.y = canvasY-game.player.height*1.2;
				
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
			
			if(game.keys[37] || game.keys[65] && !(game.gameOver) && !(game.gameWon)){ //if key pressed..
				
					if(game.player.x > game.player.width/50){ // (keeping it within the boundaries of our canvas)
					game.player.x-=game.player.speed; //..do this
					game.player.rendered = false;
			}}
			if(game.keys[39] || game.keys[68] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.x <= game.width - game.player.width){
					game.player.x+=game.player.speed;
					game.player.rendered = false;
			}}
			if(game.keys[38] || game.keys[87] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.y > game.player.height/12){
					game.player.y-=game.player.speed;
					game.player.rendered = false;
			}}
			if(game.keys[40] || game.keys[83] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.y <= game.height - game.player.height){
					game.player.y+=game.player.speed;
					game.player.rendered = false;
				}	
			}
			if(game.leftCount % game.leftDivision == 0){   //this is our timer for enemies to change movement direction. If the division of these vars equals 0 then.. (% returns a boolean for the module (remainder) of a division, 0 if no result is a integer, 1 if decimal)
				game.left = !game.left; //change direction
			}
			
			if(game.downCount % game.downDivision == 0){   //this is our timer for enemies to change movement direction. If the division of these vars equals 0 then..
				game.down = true //move enemy ships down
			}
			
			
			for(i in game.enemies){ //for each enemy in the game.enemies array..
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
				
				if((game.enemies[i].y >= game.height - (game.player.height)) && !(game.gameOver)) {			//if shit hits the fan
					game.player.rendered = false;
					game.player.image = 3;
					if (game.soundStatus == "ON"){game.playerexplodeSound.play();}
					game.lives--;
					game.score = game.score - game.levelScore;
					game.gameOver = true;
					game.paused = true;
					mouseIsDown = 0;  
					}
				
				if(Collision(game.enemies[i], game.player) && !(game.gameOver)){				//if player hits enemies and vice-versa
					game.player.rendered = false;
					game.player.image = 3;
					if (game.soundStatus == "ON"){game.playerexplodeSound.play();}
					game.lives--;
					game.score = game.score - game.levelScore;
					game.gameOver = true;
					game.paused = true;
					mouseIsDown = 0;
				}
			}
						
			for(i in game.projectiles){ //making each bullet fired move
				game.projectiles[i].y-= X_BulletSpeed * game.height/1000 ; //bullet speed
				if(game.projectiles[i].y <= -game.projectiles[i].size*2){ //if a bullet goes off the screen..
					game.projectiles.splice(i,1); // ..remove it from the array/memory
					}
			}

			for(c in game.enprojectiles){ //making each bullet fired move
				game.enprojectiles[c].y+= X_EnBulletSpeed * game.height/1000 ; //bullet speed
				if(game.enprojectiles[c].y >= game.height + (game.height*0.05)) { //if a bullet goes off the screen..
					game.enprojectiles.splice(c,1); // ..remove it from the array/memory
					}
			}

			if(game.enemies.length > 0 && game.enshootTimer <=0 && !(game.paused)){ //only add a bullet if space is pressed and enough time has passed i.e. our timer has reached 0
				addEnBullet();
				game.enshootTimer = game.enfullShootTimer; //resetting our timer back to 15
			}

			if((game.keys[32] || mouseIsDown) && game.shootTimer <=0 && !(game.paused)){ //only add a bullet if space is pressed and enough time has passed i.e. our timer has reached 0
				addBullet();
				if (game.soundStatus == "ON"){game.shootSound.play();}
				game.shootTimer = game.fullShootTimer; //resetting our timer back to 15
			}	

			for(m in game.enemies){																//bullet collision
				for(p in game.projectiles){
					if(Collision(game.enemies[m], game.projectiles[p])){
						if(game.soundStatus == "ON"){game.enemyexplodeSound.play()};
						game.enemies[m].dead = true;
						game.score++;
						game.levelScore++;
						game.enemies[m].image = 3;
						game.contextEnemies.clearRect(game.projectiles[p].x, game.projectiles[p].y, game.projectiles[p].size, game.projectiles[p].size*1.8);
						game.projectiles.splice(p,1);
						scores();
					}
				}
			}

			for(n in game.enprojectiles){						//enemy bullet collision
				if(Collision(game.player, game.enprojectiles[n]) && !(game.gameOver)){
							game.player.rendered = false;
							game.player.image = 3;
						if (game.soundStatus == "ON"){game.playerexplodeSound.play();}
							game.lives--;
							game.score = game.score - game.levelScore;
							game.gameOver = true;
							game.paused = true;
							mouseIsDown = 0;
							game.enprojectiles.splice(n,1);
				}
			}
			
			for (i in game.enemies){
				if(game.enemies[i].dead){
					game.enemies[i].deadTime--; //making dead enemies go away after a few secs
				}
				if (game.enemies[i].dead && game.enemies[i].deadTime <= 0){
					game.contextEnemies.clearRect(game.enemies[i].x-game.enemies[i].width*0.1, game.enemies[i].y-game.enemies[i].height*0.1, game.enemies[i].width*2.1, game.enemies[i].height*2.1);
					game.enemies.splice(i,1);
				}
			}
			
			if(game.enemies.length <= 0 && !(game.gameOver) && !(game.gameWon)){ //if the enemies array is empty..
				if (game.delayTimer < 50) {
					game.delayTimer++;
					if (game.delayTimer >= 50) {
						if(game.soundStatus == "ON"){game.winSound.play()};
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
			//setting the fill color to white
			for(i in game.stars){
				var star = game.stars[i]; //adding a star var to simplify				
				game.contextBackground.drawImage(game.images[star.image],star.x, star.y, star.size, star.size); //drawing the stars
			}
			if(!game.player.rendered){ //if player not rendered i.e. rendered = false
			game.contextPlayer.clearRect(0 , 0, game.width, game.height); //clear trails
			game.contextPlayer.drawImage(game.images[game.player.image], game.player.x, game.player.y, game.player.width, game.player.height); //rendering
			game.player.rendered = true;
			}
			for(i in game.enemies){ //for each enemy
				var enemy = game.enemies[i]; //all together now
				game.contextEnemies.clearRect(enemy.x - enemy.width*0.1, enemy.y - enemy.height*0.1, enemy.width*1.8, enemy.height*1.1); //clear trails
				game.contextEnemies.drawImage(game.images[enemy.image], enemy.x, enemy.y, enemy.width, enemy.height); //rendering
			}
			for(i in game.projectiles){ //for each bullet
				var proj = game.projectiles[i];
				game.contextEnemies.clearRect(proj.x, proj.y, proj.size, proj.size*1.8);
				game.contextEnemies.drawImage(game.images[proj.image], proj.x, proj.y, proj.size, proj.size);
			}
			for(i in game.enprojectiles){ //for each bullet
				var enproj = game.enprojectiles[i];
				game.contextEnemies.clearRect(enproj.x, enproj.y - enproj.size*0.5, enproj.size, enproj.size);
				game.contextEnemies.drawImage(game.images[enproj.image], enproj.x, enproj.y, enproj.size, enproj.size);

			}

			if (game.gameOver && game.lives < 1){
				game.contextPlayer.font = "bold " + game.width*0.08 + "px " + game.font;
				game.contextPlayer.fillStyle = "#FF7F00";
				game.contextPlayer.fillText("Game Over", game.width*0.30, game.height*0.42);
				game.contextPlayer.font = "bold " + game.width*0.06 + "px " + game.font;
				game.contextPlayer.fillText(game.levelScore + " enemy ships destroyed", game.width*0.19, game.height*0.52);
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
			if (game.gameOver && game.lives >= 1){
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
				game.contextPlayer.fillText(game.levelScore + " enemy ships destroyed", game.width*0.17, game.height*0.52);
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
				
		
		//====================== The loop =================//		
			
		function loop(){ //the loop
		
			requestAnimFrame(loop);			
			gameStart();
			if (!game.paused){
			update();
			render();
			}
		}
		
		
		//====================== Images engine =================//
		
		function initImages(paths) { //our images engine: passing the array 'paths' to the function
			game.requiredImages = paths.length;  //the number of required images will be equal to the length of the paths array
			for(i in paths){
				var img = new Image; //defining img as a new image
				img.src = paths[i]; //defining new image src as paths[i]
				game.images[i] = img; //defining game.image[i] as a new image (with paths)
				game.images[i].onload = function(){  //once an image loads..
					game.doneImages++; //  ..increment the doneImages variable by 1
				}
			}
		}
		
		
		//====================== Game functions =================//
		
		function addStars(num){ //this function is going to take a number thus num
			for(i=0; i<num; i++) {
				game.stars.push({ //push values to the game.stars array
					x:Math.floor(Math.random() * game.width), //floor will round down x which will be a random number between 0 and 550
					y:game.height + 10, //+10 to spawn then outside the screen so players can't see them spawning
					size: Math.random()*game.width*0.003,
					image: Math.floor(Math.random()*(19-14+1)+14) // a random number between 14 and 18	
				});
			}
		}
		
		function addBullet(){ //add bullet function will be triggered every time space is pressed
			game.projectiles.push({
				x: game.player.x + game.player.width*0.42,
				y: game.player.y,
				size: game.height*0.012,
				image: 2
			});
		}

		function addEnBullet(){ //add bullet function will be triggered every few seconds
			xEn = game.enemies.length;
			pEn = (xEn < 2) ? 0 : Math.floor(Math.random()*((xEn-1)+1)); //a random number between 0 and the maximum array index (xEn-1)

			game.enprojectiles.push({
				x: game.enemies[pEn].x + game.enemies[pEn].width*0.42,
				y: game.enemies[pEn].y + game.enemies[pEn].height,
				size: game.height*0.012,
				image: 2
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
				first.x + first.width < second.x ||
				first.y > second.y + second.size ||
				first.y + first.height < second.y);
		}
		
		// function Collision(first, second){ //detecting rectangles' (image) collision, first is going to be the bullet, second will be the enemies. Note: the function itself can be applied to anything, 'first' and 'second' can be any variable as long as they have x and y values
		// 	return !(first.x > second.x + second.width ||
		// 		first.x + first.width < second.x ||
		// 		first.y > second.y + second.height ||
		// 		first.y + first.height < second.y);
		// }
		
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
		
		
		//=========================== Game Start =================================== 
		
		game.contextBackground.font = "bold " + game.width*0.08 + "px " + game.font; //the loading screen
		game.contextBackground.fillStyle = "white";
		game.contextBackground.fillText("loading...", game.width*0.30, game.height*0.47);
		
		initImages([	//using initimages function to load our images
			"_img/fighter/fighter.png",
			"_img/enemy.png",
			"_img/bullet.png",
			"_img/explosion.png",
			"_img/fighter/fighter_right1.png",
			"_img/fighter/fighter_right2.png",
			"_img/fighter/fighter_right3.png",
			"_img/fighter/fighter_right4.png",
			"_img/fighter/fighter_right5.png",
			"_img/fighter/fighter_left1.png",
			"_img/fighter/fighter_left2.png",
			"_img/fighter/fighter_left3.png",
			"_img/fighter/fighter_left4.png",
			"_img/fighter/fighter_left5.png",
			"_img/stars/star1.png",
			"_img/stars/star2.png",
			"_img/stars/star3.png",
			"_img/stars/star4.png",
			"_img/stars/star5.png",
			"_img/stars/star6.png"

		]);
		
		checkImages(); //this function call starts our game
	});
})();


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
})();