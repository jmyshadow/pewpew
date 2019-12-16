window.onload = function () {
	//canvas / DOM variables and elements
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	ctx.lineWidth = 3;
	ctx.textAlign = "center";
	var scoreOut = document.getElementById("score");

	var lasers = [];
	var balls = [];
	var pellets = [];

	var isKeyUp = false;
	var isKeyDown = false;
	var isKeyLeft = false;
	var isKeyRight = false;
	var game = false;

	//sfx
	// lasers (multiple to play laser sounds if previous audio clip has not ended)
	var laserSound0 = new Audio("sound/laser.wav");
	laserSound0.volume = .2;
	var laserSound1 = new Audio("sound/laser.wav");
	laserSound1.volume = .2;
	var laserSound2 = new Audio("sound/laser.wav");
	laserSound2.volume = .2;
	var laserSound3 = new Audio("sound/laser.wav");
	laserSound3.volume = .2;
	var laserSounds = [laserSound0, laserSound1, laserSound2, laserSound3];

	//explosions (multiple to play explosion sound if previous audio clip has not ended)
	var explosionSound0 = new Audio("sound/explode.wav");
	var explosionSound1 = new Audio("sound/explode.wav");
	var explosionSound2 = new Audio("sound/explode.wav");
	var explosionSound3 = new Audio("sound/explode.wav");
	var explosions = [explosionSound0, explosionSound1, explosionSound2, explosionSound3];

	//ship explosion
	var shipExplode = new Audio("sound/shipexplode.wav");

	//font formatting plugin
	(function ($) {
		$.fn.fontify = function () {
			this.css("text-align", "center")
				.css("text-transform", "uppercase")
				.css("font-size", "20px")
				.css("font-weight", "bold");
			if (this.css("display") == "block") {
				this.css("display", "none");
			} else {
				this.css("display", "block");
			}
			return this;
		}
	}(jQuery));

	//game's score
	function changeScore() {
		let score = 0;
		return function (s) {
			if (s == 1) {
				return score += 100;
			} else if (s == 0) {
				return score -= 100;
			} else if (s == "refresh") {
				score = 0;
			} else {
				return score;
			}
		}
	}
	var score = changeScore();

	// CONSTRUCTOR FUNCTIONS
	//
	function Ship(width, height) {
		this.width = width;
		this.height = height;
		this.innerHeight = height - 20;
		this.xPos = 200;
		this.yPos = 400;
		this.xVel = 0;
		this.yVel = 0;
	}

	function Laser(x, y ) {
		this.length = 10;
		this.xPos = x;
		this.yPos = y;
		this.isVis = true;
	}

	function Ball(x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.vel = .5 + Math.random() * 2.5;
		this.vel = parseFloat(this.vel.toFixed(2));
		this.isVis = true;
	}

	function Pellet(x,y,dx,dy){
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.r = 5;
		this.ticks = 0;
	}

	// DRAW FUNCTIONS
	//
	Ship.prototype.draw = function () {
		ctx.beginPath();
		ctx.moveTo(this.xPos, this.yPos);
		ctx.lineTo(this.xPos - this.width / 2, this.yPos + this.height);
		ctx.lineTo(this.xPos, this.yPos + this.innerHeight);
		ctx.lineTo(this.xPos + this.width / 2, this.yPos + this.height);
		ctx.lineTo(this.xPos, this.yPos);
		ctx.fill();
	}

	Laser.prototype.draw = function () {
		ctx.beginPath();
		ctx.moveTo(this.xPos, this.yPos);
		ctx.lineTo(this.xPos, this.yPos + this.length);
		ctx.stroke();
	}
	
	Ball.prototype.draw = function () {
		ctx.lineWidth = 5;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = "black";
		ctx.stroke();
		ctx.lineWidth = 3;
	}

	Pellet.prototype.draw = function(){
		ctx.beginPath();
		ctx.fillStyle = "black";
		if(this.ticks%10 == 0){
			this.r -= .4;
		}
		ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = "white";
		ctx.stroke();
	}

	//MOVE FUNCTIONS
	//
	Ship.prototype.move = function () {
		if (this.xPos <= this.width / 2 + 5 || this.xPos >= 400 - this.width / 2 - 5) {
			this.xVel = -this.xVel;
		}
		this.xPos += this.xVel;

		if(this.xPos > 395){
			this.xPos = 395;
		}

		if (this.yPos <= 5 || this.yPos >= 600 - 5 - this.height) {
			this.yVel = -this.yVel;
		}
		this.yPos += this.yVel;
	}

	Laser.prototype.move = function () {
		if (this.length < 50) {
			this.length += 3;
		}
		this.yPos -= 10;
	}

	Ball.prototype.move = function () {
		this.y += this.vel;
	}

	Pellet.prototype.move = function(){
		this.y += this.dy;
		this.x += this.dx;
		this.ticks++;
	}

	// ANIMATION
	//
	setInterval(function () {
		if (game) {
			scoreOut.innerHTML = "Score: " + score();
			animate();
			getShipMovement();
			shipDecel(); //calling a function to slow down the ship if key is not pressed
			checkCollisions();
		}
	}, 10);

	function animate() {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, 400, 600);
		ctx.fillStyle = "white";
		ship.move();
		ship.draw();

		//draw lasers
		ctx.strokeStyle = "white";
		if (lasers.length > 0) {
			//garbage collecting - deleting lasers off screen
			lasers.forEach(function (laser, index, lasers) {
				if (laser.yPos < -50) {
					lasers.splice(index, 1);
				}

			});
			lasers.forEach(function (laser) {
				laser.move();
				if (laser.isVis == true) {
					laser.draw();
				}
			});
		}

		//draw balls
		if (balls.length > 0) {
			//garbage collecting - deleting balls off screen
			balls.forEach(function (ball, index, balls) {
				if (ball.y > 660) {
					balls.splice(index, 1);
					if (ball.isVis == true) {
						if (score() > 0) {
							score(0);
						}
					}
				}
			});
			balls.forEach(function (ball) {
				ball.move();
				if (ball.isVis) {
					ball.draw();
				}
			});
		}

		//draw pellets (explosion)
		pellets.forEach(function(pellet,index,pellets){
			if(pellet.ticks > 100){
				pellets.splice(index, 1);
			}
		});
		pellets.forEach(function(pellet){
			pellet.move();
			pellet.draw();
		});
	}

	// EVENT HANDLERS
	//move the ship
	document.addEventListener("keydown", function (evt) {
		if (evt.key == "ArrowUp") {
			isKeyUp = true;
		} else if (evt.key == "ArrowDown") {
			isKeyDown = true;
		} else if (evt.key == "ArrowLeft") {
			isKeyLeft = true;
		} else if (evt.key == "ArrowRight") {
			isKeyRight = true;
		}

		//shoot the laser
		else if (evt.key == " ") {
			if (game) {
				var laser = new Laser(ship.xPos, ship.yPos);
				lasers.push(laser);
				for (var i = 0; i < laserSounds.length; i++) {
					if (laserSounds[i].ended || laserSounds[i].currentTime == 0) {
						laserSounds[i].play();
						break;
					}
				}
			}
		} else if (evt.key == "Enter") {
			if (!game) {
				game = true;
				stylizeHeader();
			}
		}
	});

	document.addEventListener("keyup", function (evt) {
		if (evt.key == "ArrowUp") {
			isKeyUp = false;
		} else if (evt.key == "ArrowDown") {
			isKeyDown = false;
		} else if (evt.key == "ArrowLeft") {
			isKeyLeft = false;
		} else if (evt.key == "ArrowRight") {
			isKeyRight = false;
		}
	});

	//MAIN LOGIC
	//create the Ship
	stylizeHeader();
	stylizeHeader();
	var ship = new Ship(30, 50);
	ship.draw();

	// function to generate balls
	//
	//create test ball
	/*
		var radius = getNewRadius();
			var ball = new Ball(400,-100,radius);
			balls.push(ball); 
	*/

	//generate multiple balls
	setInterval(function () {
		if (game) {
			var radius = getNewRadius();
			var ball = new Ball(Math.random() * (400 - 2 * radius) + radius, -100, radius);
			balls.push(ball);
		}
	}, 100 + Math.random() * 500);

	//UTILITY FUNCTIONS
	// function to change velocity of ship
	function getShipMovement() {
		if (isKeyUp) {
			if (ship.yVel >= -3) {
				ship.yVel -= .25; //capping the speed of the ship
				ship.yVel = parseFloat(ship.yVel.toFixed(2));
			}
		}
		if (isKeyDown) {
			if (ship.yVel <= 3) {
				ship.yVel += .25; // capping speed of the ship
				ship.yVel = parseFloat(ship.yVel.toFixed(2));
			}
		}
		if (isKeyLeft) {
			if (ship.xVel >= -4) {
				ship.xVel -= .5; // capping speed of the ship
				ship.xVel = parseFloat(ship.xVel.toFixed(2));
			}
		}
		if (isKeyRight) {
			if (ship.xVel <= 4) {
				ship.xVel += .5; // capping speed of the ship
				ship.xVel = parseFloat(ship.xVel.toFixed(2));
			}
		}
	}

	//generates random radius for a Ball Object
	//returns a value between 20-60
	function getNewRadius() {
		radius = Math.random() * 40 + 20;
		return radius;
	}

	//function to slow down the ship if button is not pressed
	function shipDecel() {
		// slow down vertical speed 
		if (ship.yVel < 0) {
			ship.yVel += .03;
		} else if (ship.yVel > 0) {
			ship.yVel -= .03;
		}

		//slowdown horizontal speed
		if (ship.xVel < 0) {
			ship.xVel += .05;
		} else if (ship.xVel > 0) {
			ship.xVel -= .05;
		}
	}

	// Ball Collision checking
	function checkCollisions() {
		for (var i = 0; i < balls.length; i++) {
			//laser collisions
			for (var j = 0; j < lasers.length; j++) {
				if (pointDistance(lasers[j].xPos, lasers[j].yPos,
						balls[i].x, balls[i].y, balls[i].r)) {
					if (lasers[j].isVis) {
						if (balls[i].isVis == true) {
							balls[i].isVis = false;
							lasers[j].isVis = false;
							score(1);
							makeItExplode(balls[i].x,balls[i].y);
							for (var i = 0; i < explosions.length; i++) {
								if (explosions[i].ended || explosions[i].currentTime == 0) {
									explosions[i].play();
									break;
								}
							}
						}
					}
				}
			}

			//ship collision 
			if (balls[i].isVis == true) {
				if (pointDistance(ship.xPos, ship.yPos + 10, // adding 10 to ship.yPos to detect collsion more towards center of ship
						balls[i].x, balls[i].y, balls[i].r)) {
					game = false;
					ctx.fillStyle = "white";
					ctx.fillRect(0, 0, 400, 600);
					ctx.fillStyle = "black";
					ctx.font = "50px Arial";
					ctx.fillText("YOU ARE DEAD", ctx.canvas.width / 2, 100);
					ctx.font = "30px Arial";
					ctx.fillText("Final Score: " + score(), ctx.canvas.width / 2, 300);
					shipExplode.play();
					score("refresh");
					stylizeHeader();
					balls = [];
					lasers = [];
					pellets = [];
					ship = new Ship(30, 50);
					ship.draw();
				}
			}
		}
	}

	//function to check collisions. If distance between center of ball
	// and impact point is less than radius of the ball, there is a collision 
	function pointDistance(x, y, a, b, r) { //Sqrt(a − x)^2 + (b − y)^2
		return Math.sqrt(Math.pow((x - a), 2) + Math.pow((y - b), 2)) < r;
	}

	function stylizeHeader() {
		$("#rules").fontify();
		$("#score").fontify();
	}

	function makeItExplode(x,y){
		for(var i = 0; i < 10; i++){
			pellet = new Pellet(x,y,(Math.random()*3) *  (Math.round(Math.random()) * 2 - 1),
			(Math.random()*3)* (Math.round(Math.random()) * 2 - 1));
			pellets.push(pellet);
		}
	}

};