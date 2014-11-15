(function(game){ //keeping our code within a function so that variables are not accessible via console (prevent hacking)
	$(document).ready(function(){ //using jquery $ and telling the computer to only run the below once the whole document(webpage) has loaded, this way our script doesn't need to be in the footer to run properly
		
		window.addEventListener('load', initInput, false);	//start listening to mouse & touch events	
		
		var game = {}; //this is a global var which will contain other game vars
		
		game.stars = []; //this is an array which will contain our stars info: position in space and size
		game.colours = ['red', //making the multiverse a bit more coloured, white stars will be more common when randomizing the array
						'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white',
						'yellow', 'yellow',
						'Purple',
						'orange',
						'pink']; 
		
		

		
		game.score = 0; //the game score
		game.levelScore = 0; //the score for each level
		
		game.level = 1; //starting at level 1...
		
		game.lives = 3; //with 3 ships (lives)
		
		game.keys = []; //the keyboard array
		
		game.projectiles = []; //Our proton torpedoes!
		
		game.enemies = []; //The InVaDeRs
		
		
		
		
		//========================== Audio ==========================
		
		game.enemyexplodeSound = new Audio("_sounds/explosion.wav");
		game.playerexplodeSound = new Audio("_sounds/blast.mp3");
		game.shootSound = new Audio("_sounds/laser.wav");
		game.deathSound = new Audio("_sounds/death.mp3");
		game.winSound = new Audio("_sounds/victory.mp3");
		 
			
		//======================== Images ========================		
			
		game.images = [];
		game.doneImages  = 0; // will contain how many images have been loaded
		game.requiredImages = 0; // will contain how many images should be loaded
		
		
		//====================== Game state ========================
		
		game.start = true;
		game.paused = true;
		game.gameWon = false;
		game.gameOver = false;
		game.delayTimer = 0;
		
		
		//====================== Canvases + Images + responsiveness  ============================
		
		game.contextBackground = document.getElementById("backgroundCanvas").getContext("2d"); //defining the 2 different canvas
		game.contextEnemies = document.getElementById("enemiesCanvas").getContext("2d");
		game.contextPlayer = document.getElementById("playerCanvas").getContext("2d");
		game.contextText = document.getElementById("textCanvas").getContext("2d");
		
		
		$(document).ready( function(){
			//Get the canvas & context
			var c1 = $('#backgroundCanvas');
			var c2 = $('#enemiesCanvas');
			var c3 = $('#playerCanvas');
			var c4 = $('#textCanvas');
			var ct = c1.get(0).getContext('2d');
			var container = $(c1).parent();

			//Run function when browser resizes
			$(window).resize( respondCanvas );

			function respondCanvas(){ 
				c1.attr('width', $(container).width() ); //max width
				c1.attr('height', $(container).height() * 0.95 ); //max height
				c2.attr('width', $(container).width() ); //max width
				c2.attr('height', $(container).height() * 0.95 ); //max height
				c3.attr('width', $(container).width() ); //max width
				c3.attr('height', $(container).height() * 0.95 ); //max height
				c4.attr('width', $(container).width() * 0.5 ); //max width
				c4.attr('height', $(container).height() * 0.5 ); //max height
				
				
				game.width = $(container).width(); //we'll use width and height to limit the game to our canvas size
				game.height = $(container).height() * 0.95;
				
				game.player = {	//creating our player
					x: game.width /2 -50,
					y: game.height - 100,
					width: 120 * (game.height /1300),
					height: 120 * (game.height /1300),
					speed: 5,
					image: 0,
					rendered: false,
					crashed: false					
				};
				
				//======================  Game Anim speed / movement =====================		
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
				game.enemySpeed = 6; //the enemies' speed on mobiles
				} else {
				game.enemySpeed = 3; //the enemies' speed
				}
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
				game.enemyDownSpeed = 6;
				} else {
				game.enemyDownSpeed = 3;
				}
				game.leftCount = 1; //game timers for making enemies move left-right and charge down
				game.downCount = 1;
				game.leftDivision = Math.floor(180/game.level * (game.width/2100)); //the higher division is the slower our timer will run
				game.downDivision = 200 * game.level; //the higher the level the slower the enemies come down
				game.left = false;
				game.down = false;
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
					game.fullShootTimer = 16;	//this timer will limit the number of bullets being fired
				}
				else {
					game.fullShootTimer = 20;	//this timer will limit the number of bullets being fired
				
				}
				game.shootTimer = game.fullShootTimer;				
				
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
		
		function initInput() {
        canvas = document.getElementById("playerCanvas");
        ctx = canvas.getContext("2d");
		         
        canvas.addEventListener("mousedown",mouseDown, false);
        canvas.addEventListener("mousemove",mouseXY, false);
        canvas.addEventListener("touchstart", touchDown, false);
		canvas.addEventListener("touchmove", touchXY, true);
		canvas.addEventListener("touchend", touchUp, false);
         
        canvas.addEventListener("mouseup", mouseUp, false);
		canvas.addEventListener("touchcancel", touchUp, false);                 
		}
		
		
		function mouseUp() {
			mouseIsDown = 0;
			mouseXY();
		}
		 
		function touchUp() {
			mouseIsDown = 0;
			showPos();
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
		e.preventDefault();
		canvasX = e.pageX - canvas.offsetLeft;
		canvasY = e.pageY - canvas.offsetTop;
		//showPos();
		}
		 
		function touchXY(e) {
			e.preventDefault();
			canvasX = e.targetTouches[0].pageX - canvas.offsetLeft;
			canvasY = e.targetTouches[0].pageY - canvas.offsetTop;
			// showPos();
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
					size:Math.random()*5, //size of the stars
					colour: game.colours[Math.floor(Math.random() * game.colours.length)]
				});
			}
			for(y = 0; y < game.level; y++) {	// y enemies vertically..
				for(x = 0; x < game.level; x++){ // ..by x horizontally
					game.enemies.push({ //adding value to the game.enemies array
						x: (game.width/5) + (game.width/8) * x,  //setting positions and making space between enemies
						y: (y * 70) + (10 * y) + 40,
						width: 7 * (game.height /100), //the size of our enemies
						height: 7 * (game.height /100),
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
			
			//If Esc pressed or if gameover and enter pressed
			if (game.keys[27] ||
			   ((game.keys[13] || mouseIsDown) && game.paused && !(game.start) && game.gameOver && !(game.gameWon)) ||
			   ((game.keys[13] || mouseIsDown) && game.paused && !(game.start) && game.level >= 7)){
					mouseIsDown = 0;
					game.gameOver = false;	
					game.gameWon = false;
					if (game.lives < 1 || game.level >=7){
						game.level = 1;
						game.score = 0;
						game.lives = 3;
						game.downDivision = 200 * game.level;
						game.leftDivision = Math.floor(180/game.level * (game.width/2100)); 
					}
					game.downCount = 1;
					game.leftCount = 1;
					game.left = false;
					game.down = false;
					game.contextBackground.clearRect(1, 1, game.width, game.height); 
					game.contextPlayer.clearRect(1, 1, game.width, game.height); 
					game.contextEnemies.clearRect(1, 1, game.width, game.height); 
					game.contextText.clearRect(1, 1, game.width, game.height); 
					game.projectiles = [];
					game.enemies = [];
					
					for(y = 0; y < game.level; y++) {	// 5 enemies vertically..
						for(x = 0; x < game.level; x++){ // ..by 5 horizontally
							game.enemies.push({ //adding value to the game.enemies array
							x: (game.width/5) + (game.width/8) * x,  //setting positions and making space between enemies
							y: (y * 70) + (10 * y) + 40,
							width: 7 * (game.height /100), //the size of our enemies
							height: 7 * (game.height /100),
							image: 1, //their ships...
							dead: false,
							deadTime: 20
						});
						}
					}
					game.player = {	//creating our player
						x: game.width /2 -50,
						y: game.height - 100,
						width: 120 * (game.height /1300),
						height: 120 * (game.height /1300),
						speed: 5,
						image: 0,
						rendered: false,
						crashed: false					
					};
					game.paused = false;
					scores();							
			}
			
			//level up
			if ((game.keys[13] || mouseIsDown) && !(game.gameOver) && !(game.start) && (game.gameWon) && game.level <= 6) {
					mouseIsDown = 0; 
					game.gameWon = false;					
					game.downCount = 1;
					game.leftCount = 1;					
					game.downDivision = Math.floor((200 * game.level)); //the higher the level the slower the enemies come down
					game.leftDivision = Math.floor(180/game.level * (game.width/1600));
					game.left = false;
					game.down = false;
					game.contextBackground.clearRect(1, 1, game.width, game.height); 
					game.contextPlayer.clearRect(1, 1, game.width, game.height); 
					game.contextEnemies.clearRect(1, 1, game.width, game.height); 
					game.contextText.clearRect(1, 1, game.width, game.height); 
					game.projectiles = [];
					game.enemies = [];
										
					
					for(y = 0; y < game.level; y++) {	// 5 enemies vertically..
						for(x = 0; x < game.level; x++){ // ..by 5 horizontally
							game.enemies.push({ //adding value to the game.enemies array
								x: (game.width/5) + (game.width/8) * x,  //setting positions and making space between enemies
								y: (y * 70) + (10 * y) + 40,
								width: 7 * (game.height /100), //the size of our enemies
								height: 7 * (game.height /100),
								image: 1, //their ships...
								dead: false,
								deadTime: 20
							});
						}
					}
					game.player = {	//resetting player
						x: game.width /2 -50,
						y: game.height - 100,
						width: 120 * (game.height /1300),
						height: 120 * (game.height /1300),
						speed: 5 * (game.width/1300),
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
			if(game.leftCount > 100000)game.count = 0; //this is necessary otherwise game.count++ would break the game at some point
			if(game.downCount > 100000)game.count = 0; //this is necessary otherwise game.count++ would break the game at some point
			game.downCount++;
			game.leftCount++; //adding to our counter
			
			if(game.shootTimer > 0)game.shootTimer--; //start ticking our timer down
			
			for(i in game.stars){
				if(game.stars[i].y <= -5){ //removing gone passed stars from memory
					game.stars.splice(i,1); //splice takes objects out of an array completely, start at arg1 and remove arg2 i.e. start from i and remove 1 star 
				}
				game.stars[i].y--;
			}
			//define keys + mouse & touch controls
			
			if (mouseIsDown && !(game.paused) && !(game.gameOver) && !(game.gameWon)) {
				
				if((canvasX > -10 && canvasX <= (game.width - game.player.width)) && (canvasY > 70*(game.width/1300) && canvasY <= (game.height - game.player.height +80*(game.width/1300)))) {
			
				game.player.x = canvasX-game.player.width/2;
				game.player.y = canvasY-game.player.height*1.6;
				game.player.rendered = false;				
			
				}
			}
			
			if(game.keys[37] || game.keys[65] && !(game.gameOver) && !(game.gameWon)){ //if key pressed..
				
					if(game.player.x > -10){ // (keeping it within the boundaries of our canvas)
					game.player.x-=game.player.speed; //..do this
					game.player.rendered = false;
			}}
			if(game.keys[39] || game.keys[68] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.x <= game.width - game.player.width){
					game.player.x+=game.player.speed;
					game.player.rendered = false;
			}}
			if(game.keys[38] || game.keys[87] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.y > -10){
					game.player.y-=game.player.speed;
					game.player.rendered = false;
			}}
			if(game.keys[40] || game.keys[83] && !(game.gameOver) && !(game.gameWon)){
					if(game.player.y <= game.height - game.player.height){
					game.player.y+=game.player.speed;
					game.player.rendered = false;
				}	
			}
			if(game.leftCount % game.leftDivision == 0){   //this is our timer for enemies to change movement direction. If the division of these vars equals 0 then..
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
					game.enemies[i].y+=game.enemyDownSpeed;
				}
				
				if((game.enemies[i].y >= game.height - (game.player.height)) && !(game.gameOver)) {
					game.player.rendered = false;
					game.player.image = 3;
					game.playerexplodeSound.play();
					game.lives--;
					game.score = game.score - game.levelScore;
					game.gameOver = true;
					game.paused = true;
					mouseIsDown = 0;  
					}
				
				if(EnemyCollision(game.enemies[i], game.player) && !(game.gameOver)){
					game.player.rendered = false;
					game.player.image = 3;
					game.playerexplodeSound.play();
					game.lives--;
					game.score = game.score - game.levelScore;
					game.gameOver = true;
					game.paused = true;
					mouseIsDown = 0;
				}
			}
						
			for(i in game.projectiles){ //making each bullet fired move
				game.projectiles[i].y-= 10 ;
				if(game.projectiles[i].y <= -game.projectiles[i].size*2){ //if a bullet goes off the screen..
					game.projectiles.splice(i,1); // ..remove it from the array/memory
					}
			}
			
			if((game.keys[32] || mouseIsDown) && game.shootTimer <=0 && !(game.paused)){ //only add a bullet if space is pressed and enough time has passed i.e. our timer has reached 0
				addBullet();
				game.shootSound.play();
				game.shootTimer = game.fullShootTimer; //resetting our timer back to 15
			}	

			for(m in game.enemies){
				for(p in game.projectiles){
					if(BulletCollision(game.enemies[m], game.projectiles[p])){
						game.enemyexplodeSound.play();
						game.enemies[m].dead = true;
						game.score++;
						game.levelScore++;
						game.enemies[m].image = 3;
						game.contextEnemies.clearRect(game.projectiles[p].x, game.projectiles[p].y, game.projectiles[p].size+6, game.projectiles[p].size+6);  
						game.projectiles.splice(p,1);
						scores();
					}
				}
			}
			
			for (i in game.enemies){
				if(game.enemies[i].dead){
					game.enemies[i].deadTime--; //making dead enemies go away
				}
				if (game.enemies[i].dead && game.enemies[i].deadTime <= 0){
					game.contextEnemies.clearRect(game.enemies[i].x, game.enemies[i].y, game.enemies[i].width, game.enemies[i].height);
					game.enemies.splice(i,1);
				}
			}
			
			if(game.enemies.length <= 0 && !(game.gameOver) && !(game.gameWon)){ //if the enemies array is empty..
				if (game.delayTimer < 50) {
					game.delayTimer++;
					if (game.delayTimer >= 50) {
						game.winSound.play();
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
				game.contextBackground.fillStyle= star.colour;
				game.contextBackground.fillRect(star.x, star.y, star.size, star.size); //drawing the stars
			}
			if(!game.player.rendered){ //if player not rendered i.e. rendered = false
			game.contextPlayer.clearRect(0 , 0, game.width, game.height); //clear trails
			game.contextPlayer.drawImage(game.images[game.player.image], game.player.x, game.player.y, game.player.width, game.player.height); //rendering
			game.player.rendered = true;
			}
			for(i in game.enemies){ //for each enemy
				var enemy = game.enemies[i]; //all together now
				game.contextEnemies.clearRect(enemy.x-enemy.width/2, enemy.y-enemy.height/4, enemy.width*2, enemy.height*2); //clear trails
				game.contextEnemies.drawImage(game.images[enemy.image], enemy.x, enemy.y, enemy.width, enemy.height); //rendering
			}
			for(i in game.projectiles){ //for each bullet
				var proj = game.projectiles[i];
				game.contextEnemies.clearRect(proj.x, proj.y, proj.size*2, proj.size*2);
				game.contextEnemies.drawImage(game.images[proj.image], proj.x, proj.y, proj.size, proj.size);
			}
			if (game.gameOver && game.lives < 1){
				game.contextPlayer.font = "bold 50px monaco";
				game.contextPlayer.fillStyle = "#FF7F00";
				game.contextPlayer.fillText("Game Over You Noob!", game.width / 16, game.height / 2 -75);
				game.contextPlayer.font = "bold 30px monaco";
				game.contextPlayer.fillText("Total Enemy ships destroyed: " + game.score, game.width / 7, game.height / 2 -25);
				game.contextPlayer.fillText("Press Enter to restart", game.width / 4, game.height / 2 +25);
				game.deathSound.play();
				game.levelScore = 0;
			}
			if (game.gameOver && game.lives >= 1){
				game.contextPlayer.font = "bold 40px monaco";
				game.contextPlayer.fillStyle = "#FFD455";
				game.contextPlayer.fillText("Your ship has been Destroyed!", game.width / 22, game.height / 2 -50);
				game.contextPlayer.font = "bold 30px monaco";
				game.contextPlayer.fillText("Ships left: " + game.lives, game.width / 3, game.height / 2 );
				game.levelScore = 0;
			}
			
			if (game.gameWon && game.level > 1 && game.level <=6 ){
				game.contextPlayer.font = "bold 50px monaco";				
				game.contextPlayer.fillStyle = "#FFD455";
				game.contextPlayer.fillText("Battle Won!", game.width /2, game.height / 2 -75);
				game.contextPlayer.font = "bold 30px monaco";
				game.contextPlayer.fillText("Enemy ships destroyed: " + game.levelScore, game.width / 6, game.height / 2 -25);
				game.contextPlayer.fillText("Press Enter to continue", game.width / 5, game.height / 2 +25);
				game.levelScore = 0;
			}
			if (game.gameWon && game.level >=7){
				game.contextPlayer.font = "bold 50px monaco";				
				game.contextPlayer.fillStyle = "#CC99FF";
				game.contextPlayer.fillText("Victory!", game.width / 3, game.height / 2 -75);
				game.contextPlayer.font = "bold 30px monaco";
				game.contextPlayer.fillText("Total Enemy ships destroyed:" + game.score, game.width / 7, game.height / 2 -25);
				game.contextPlayer.fillText("Press Enter to restart", game.width / 4, game.height / 2 +25);
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
					size:Math.random()*5,
					colour: game.colours[Math.floor(Math.random() * game.colours.length)]	//size of the stars	
				});
			}
		}
		
		function addBullet(){ //add bullet function will be triggered every time space is pressed
			game.projectiles.push({
				x: game.player.x + game.player.width/2-8,
				y: game.player.y,
				size: 15,
				image: 2
			});
		}
		
		function scores(){
			game.contextText.fillStyle = "#FFD455";
			game.contextText.font = "bold 20px helvetica";
			game.contextText.clearRect(0, 0, 160, 160);
			game.contextText.fillText("Score:" + game.score, 10, 30); //printing the score
			game.contextText.fillText("Level:" + game.level, 10, 70); //printing level
			
			for (i = 0; i < game.lives; i++){
			game.contextText.fillText("Hangar:", 10, 110); //printing lives
			game.contextText.drawImage(game.images[game.player.image], (i * 25 + 90), 90, 30, 30);
			}		
		}
		
		function BulletCollision(first, second){ //detecting rectangles' (image) collision, first is going to be the bullet, second will be the enemies. Note: the function itself can be applied to anything, 'first' and 'second' can be any variable as long as they have x and y values
			return !(first.x > second.x + second.size ||
				first.x + first.width < second.x ||
				first.y > second.y + second.size ||
				first.y + first.height < second.y);
		}
		
		function EnemyCollision(first, second){ //detecting rectangles' (image) collision, first is going to be the bullet, second will be the enemies. Note: the function itself can be applied to anything, 'first' and 'second' can be any variable as long as they have x and y values
			return !(first.x > second.x + second.width ||
				first.x + first.width < second.x ||
				first.y > second.y + second.height ||
				first.y + first.height < second.y);
		}
		
		function checkImages(){	//checking if all images have been loaded. Once all loaded run init
			if(game.doneImages >= game.requiredImages){
				game.contextBackground.clearRect(0, 0, game.width, game.height);
				game.contextBackground.font = "bold 80px monaco"; //the loading screen
				game.contextBackground.fillStyle = "purple";				
				game.contextBackground.fillText("InVaDeRs!", (game.width/3), game.height/2-50);
				game.contextBackground.font = "bold 50px monaco"; //the loading screen
				game.contextBackground.fillStyle = "white";
				if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
					game.contextBackground.fillText("Tap to Start", (game.width/3), game.height/2);
				} else {
					game.contextBackground.fillText("Press Enter to Start", (game.width/3), game.height/2);
				}
				init(); //after checking images run init()
			}else{
				setTimeout(function(){
					checkImages();
				}, 1);
			}
		}
		
		
		//=========================== Game Start =================================== 
		
		game.contextBackground.font = "bold 50px monaco"; //the loading screen
		game.contextBackground.fillStyle = "white";
		game.contextBackground.fillText("loading...", game.width/2 -100, game.height/2);
		
		initImages(["_img/player.png", "_img/enemy.png", "_img/bullet.png", "_img/explosion.png"]); //using initimages function to load our images
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
			if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
				window.setTimeout(callback, 1000 / 30);
			}	
			else {
				window.setTimeout(callback, 1000 / 60);
			}				
			};
})();