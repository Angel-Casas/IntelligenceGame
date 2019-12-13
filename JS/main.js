// GLOBAL VARIABLES
var moves = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]];
var attack = [[2, 0], [2, -2], [0, -2], [-2, -2], [-2, 0], [-2, 2], [0, 2], [2, 2]];
var special = [[2, 4], [2, 5], [2, 6], [3, 4], [3, 5], [3, 6], [4, 4], [4, 5], [4, 6]];
var playground;
var squares;
var dragSrcEl = null;

// GAME CLASS

class Playground {
  constructor(map, state, turn) {
    this.map = map;
    this.state = state || "not playing";
    this.turn = turn;
    this.removed = 0;
    this.chickens = new Array();
    this.foxes = new Array();
    this.winner = "";
  }
  changeState(state) {
    return this.state = state;
  }
  changeTurn() {
    this.turn = (this.turn == "Gallina") ? "Zorro" : "Gallina";
    return this.turn;
  }
  addRemoved() {
    return this.removed += 1;
  }
}

// GAME FUNCTIONS

function creature(X, Y, name) {
  // Create a creature Object containing coordinates and name
  // Returns creature Object
  var creature = new Object();

  creature.coord = [X, Y];
  creature.name = name;

  return creature;
}

function createMap() {
  // Creates and returns an Array of Objects,
  // each object holds coordinates, blocked, creature, special.

  var map = new Array();

  for (var i = 0; i < 7; i++) {
    for (var j = 0; j < 7; j++) {
      if (typeof map[i] == "undefined") {
        map[i] = new Array();
      }
      if (checkOutsideBoundary(i, j)) {
        map[i].push({blocked: true});
      } else {
        if (findPar(i, j)) {
          map[i].push({coord: [Number(i), Number(j)], blocked: false, creature: null, special: false});
        } else {
          map[i].push({coord: [Number(i), Number(j)], blocked: false, creature: null, special: false});
        }
      }
    }
  }

  for (var el of special) {
    map[el[0]][el[1]].special = true;
  }
  return map;
}

function populateMap(map) {
  // Create Creatures and populate the map
  // returns map

  var chickens = new Array();
  var foxes = new Array();

  for (var col in map) {
    for (var row in map[col]) {
      if ((col == 2 && row == 4) || (col == 4 && row == 4)) {
        let newFox = new creature(col, row, "Zorro");

        foxes.push(newFox);
        map[col][row].blocked = true;
        map[col][row].creature = foxes[foxes.length-1];

      } else if (!((col < 2 && row < 2) || (col > 4 && row < 2) || (row > 3))) {
        let newChicken = new creature(col, row, "Gallina");

        chickens.push(newChicken);
        map[col][row].blocked =true;
        map[col][row].creature = chickens[chickens.length-1];
      }
    }
  }

  playground.chickens = chickens;
  playground.foxes = foxes;

  return map;
}

function findCreature(map, coord) {
  // finds Creature based on coord
  // returns creature or null if not found

  return map[coord[0]][coord[1]].creature;
}

function moveCreature(coord, targetCoord, possibleMoves) {
  // Moves creature to targetCoord if possible
  // returns creature

  let creature = findCreature(playground.map, coord);

  if (creature) {
    for (var move of possibleMoves) {
      if (move.toString() == targetCoord.toString()) {

        creature.coord = targetCoord;
        playground.map[coord[0]][coord[1]].blocked = false;
        playground.map[coord[0]][coord[1]].creature = null;

        playground.map[targetCoord[0]][targetCoord[1]].blocked = true;
        playground.map[targetCoord[0]][targetCoord[1]].creature = creature;
        console.log("Moving " + creature.name + " to " + move);
      }
    }
  }

  return creature;
}

function removeChicken(coord) {
  // Remove a chicken from the map and updates playground.removed
  // returns map at coord

  playground.map[coord[0]][coord[1]].creature = null;
  playground.map[coord[0]][coord[1]].blocked = false;
  playground.chickens.splice(findCreature(playground.map, coord), 1);
  playground.addRemoved();

  findHTML(coord).children[0].remove();

  document.querySelector("#chickenCount").innerHTML = "Gallinas eliminadas: " + playground.removed;
  console.log("Removed chicken: " + coord);

  return playground.map[coord[0]][coord[1]];
}

function attackCreature(coord, targetCoord, possibleAttacks) {
  // Removes a chicken and moves the Fox to the target
  // returns creature

  let creature = findCreature(playground.map, coord);

  if (creature) {
    for (var i in possibleAttacks[0]) {
      if (possibleAttacks[0][i].toString() == targetCoord.toString()) {
        moveCreature(coord, targetCoord, possibleAttacks[0]);
        removeChicken(possibleAttacks[1][i]);

        return;
      }
    }
  }

  return creature;
}

function findMoves(map, coord) {
  // Find possible moves based on the coordinate
  // returns Array of possible moves or emptyArray

  var possibleMoves = new Array();

  if (map[coord[0]][coord[1]].creature) {
    for (var l of moves) {
      let targetCoord = [Number(coord[0])+l[0], Number(coord[1])+l[1]];

      if (validateMove(map, coord, targetCoord)) {
        possibleMoves.push(targetCoord);
      }
    }
  }
  return possibleMoves;
}

function findAttacks(map, coord) {
  // Find possible attacks based on coordinate
  // returns Array of [possibleAttack, chicken] or emptyArray

  var possibleAttacks = new Array();
  var possibleChickens = new Array();

  if (map[coord[0]][coord[1]].creature && map[coord[0]][coord[1]].creature.name == "Zorro") {
    for (var l of attack) {
      let targetCoord = [Number(coord[0])+l[0], Number(coord[1])+l[1]];
      if (validateMove(map, coord, targetCoord)) {
        let targetChickenPos = [Number(coord[0]) + (targetCoord[0]-Number(coord[0])) / 2, Number(coord[1]) + (targetCoord[1]-Number(coord[1])) / 2];
        if (map[targetChickenPos[0]][targetChickenPos[1]].creature && map[targetChickenPos[0]][targetChickenPos[1]].creature.name == "Gallina") {

          possibleAttacks.push(targetCoord);
          possibleChickens.push(targetChickenPos);
          console.log("Found attack: " + targetCoord);
        }
      }
    }
  }

  return [possibleAttacks, possibleChickens];
}

function checkConditions() {
  // Check whether any condition is true
  // Returns boolean, finished: true, not finished: false

  if (checkRemoved() || checkFoxes() || checkSpecial()) {
    playground.changeState("VICTORIA");

    document.querySelector("#winner > h2").innerHTML = playground.state;
    document.querySelector("#winner > p").innerHTML = playground.winner + " ganaron!";
    document.querySelector("#winner").style.display = "block";
    document.querySelector("#confetti").style.display = "block";
    document.querySelector("#status").innerHTML = "";
    document.querySelector("#chickenCount").innerHTML = "";
    document.querySelector("#info").innerHTML = "";

    return true;
  }
  return false;
}

function initializeGame() {
  // Initialize a new instance of playground
  // Returns new playground Object populated

  playground = new Playground(createMap(), "Jugando", "Gallina");

  populateMap(playground.map);
  displayMap(playground.map);
  addListenersSquares();
  console.log(playground);

  document.querySelector("#info").innerHTML = "Turno: " + playground.turn +".";
  document.querySelector("#chickenCount").innerHTML = "";
  document.querySelector("#introduction").style.display = "none";
  document.querySelector("#winner").style.display = "none";
  document.querySelector("#confetti").style.display = "none";
  document.querySelector("#mainButtons").style.display = "none";
  document.querySelector("#newTurn").style.display = "block";

  return playground;
}

// DISPLAY FUNCTIONS

function displayMap(map) {
  // Convert map Object into HTML and display

  let gameWrap = document.querySelector("#game");

  gameWrap.innerHTML = "";
  document.querySelector("#mainButtons").style.display = "none";
  document.querySelector("#winner").style.display = "none";

  for (var i = 0; i < map.length; i++) {
    let col = createHTML("div", "column");
    let square;

    for (var j = map[i].length-1; j >= 0; j--) {
      if (checkOutsideBoundary(i, j)) {
        square = createHTML("div", "outside");
      } else {
        square = createHTML("div", "square");

        if (map[i][j].special) {
          square.classList.add("special");
        }
        if (findCreature(map, [i, j])) {
          let name = findCreature(map, [i, j]).name;
          let creature = createHTML("div", (name == "Gallina") ? "chicken" : "fox");

          creature.setAttribute("draggable", true);

          square.appendChild(creature);
        }
      }

      square.setAttribute("data-x", i.toString());
      square.setAttribute("data-y", j.toString());
      col.appendChild(square);
    }
    gameWrap.appendChild(col);
  }

  return;
}


function displayPossible(possibleArray, className, bool) {
  // Display every possible Action in possibleArray if bool = true, else hide

  if (possibleArray && possibleArray.length) {
    for (var el of possibleArray) {
      changeClass(findHTML(el), className, bool);
    }
  }

  return;
}

// HELPER FUNCTIONS

function checkOutsideBoundary(X, Y) {
  // input: Coordinates
  // output: bool, Outside map: true, inside map: false;
  // Checks whether the position is outside the map boundary

  if ((X < 0 || Y < 0 || X > 7 || Y > 7) || (X < 2 && Y < 2) || (X > 4 && Y < 2) || (X < 2 && Y > 4) || (X > 4 && Y > 4)) {
    return true;
  }
  return false;
}

function findPar(X, Y) {
  // Checks wether the position is par or impar
  // input: Coordinates
  // returns  boolean, position is par: true, impar: false

  return (X + Y) % 2 == 0;
}

function validateMove(map, coord, targetCoord) {
  // Checks if a move is possible
  // input: initial Coord and target Coord
  // returns boolean, possible: true, impossible: false

  if (!checkOutsideBoundary(targetCoord[0], targetCoord[1])) {
    if (map[targetCoord[0]] && map[targetCoord[0]][targetCoord[1]] && map[targetCoord[0]][targetCoord[1]].blocked != true) {
      if (!findPar(coord[0], coord[1]) && !findPar(targetCoord[0], targetCoord[1])) {
        if (coord[0] == targetCoord[0] || coord[1] == targetCoord[1]) {
          return true;
        } else {
          // Dont add diagonal moves when not possible
          // (i.e. when coord is impar)
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

function checkRemoved() {
  // Checks if 6 chickens have been removed and sets playground.winner
  // returns boolean, 6: true, other:false

  playground.winner = "Zorros";

  return playground.removed == 6;
}

function checkFoxes() {
  // Checks if foxes can move and sets playground.winner
  // Returns boolean, no: true, yes: false

  let bool = playground.foxes.every(fox => {
    if (findMoves(playground.map, fox.coord).length == 0
      && findAttacks(playground.map, fox.coord)[0].length == 0) {
        playground.winner = "Gallinas";

      return true;
    }
  })

  return bool;
}

function checkSpecial() {
  // Checks if chickens have occupied all 9 special and sets playground.winner
  // Returns boolean, yes: true, no: false

  let count = 0;

  for (var el of special) {
    if (playground.map[el[0]][el[1]].creature && playground.map[el[0]][el[1]].creature.name == "Gallina") {
      count += 1;

      if (count == 9) {
        playground.winner = "Gallinas";
        return true;
      }
    }
  }

  return false;
}

function createHTML(type, ...className) {
  // Create HTML element with given type and className

  let elem = document.createElement(type);

  for (var l of className) {
    elem.classList.add(l);
  }

  return elem;
}

function findHTML(coord) {
  // Find an HTML element based on its coordinates by comparing to data-attribute
  // Returns HTML element or null if not found

  let found = null;

  for (var el of document.querySelector("#game").children) {
    for (var row of el.children) {
      if (row.getAttribute("data-x") == coord[0] && row.getAttribute("data-y") == coord[1]) {
        found = row;
      }
    }
  }

  return found;
}

function changeClass(elem, className,  bool) {
  // Changes className of HTML element if bool == true, else removes className
  // Returns element

  if (elem) {
    if (bool) {
      elem.classList.add(className);
    } else {
      elem.classList.remove(className);
    }
  }

  return elem;
}

function changeTurn() {
  // Changes the turn and display Info

  document.querySelector("#info").innerHTML = "Turno: " + playground.changeTurn() +".";

  return;
}

function rotateScreen() {
  // Toogle .rotate class in #gameWrapper to rotate screen

  let wrapper = document.querySelector("#gameWrapper");

  wrapper.classList.toggle('rotated');

  return;
}

function introductionHandle(bool) {
  // Display or hide Introduction and add EventListener

  let intro = document.querySelector("#introduction");

  if (bool) {
    let buttons = document.querySelector("#mainButtons");

    intro.style.display = "block";
    buttons.style.display = "none";
    document.querySelector(".nextSlide").addEventListener("click", changeSlide, false);
  } else {
    intro.innerHTML = "";
    intro.style.display = "none";
  }

  return;
}

function changeSlide() {
  // Changes slides in #introduction

  let slides = document.querySelectorAll(".slide");

  for (var el of slides) {
    if (el.style.display == "block") {
      let index = Number(el.getAttribute("data-slide")) + 1;

      el.style.display = "none";
      if (slides[index]) {
        slides[index].style.display = "block";
      } else {
        initializeGame();
      }

      return;
    }
  }

  return;
}

function match(possible, targetCoord) {
  // Checks wether move or attack is equal to target position
  // Returns boolean, match: true, not match: false

  for (var el of possible) {
    if (el.toString() == targetCoord.toString()) {

      return true;
    }
  }

  return false;
}

// LISTENER FUNCTIONS

function addListenersSquares() {
  // Add listeners to every square on the map
  // Handles drag Events

  squares = document.querySelectorAll(".square");

  [].forEach.call(squares, function(square) {
    square.addEventListener("dragstart", handleDragStart, false);
    square.addEventListener("dragenter", handleDragEnter, false);
    square.addEventListener("dragover", handleDragOver, false);
    square.addEventListener("dragleave", handleDragLeave, false);
    square.addEventListener("drop", handleDrop, false);
    square.addEventListener("dragend", handleDragEnd, false);
  });

  return;
}

function handleDragStart(e) {
  // handle drag creature and display movements

  let coord = [Number(this.getAttribute("data-x")), Number(this.getAttribute("data-y"))];
  let creature = playground.map[coord[0]][coord[1]].creature;
  dragSrcEl = this;

  console.log("Grabbed a : " + creature.name);
  this.style.opacity = "0.4";

  displayPossible(findMoves(playground.map, coord), "possibleMoves", true);
  displayPossible(findAttacks(playground.map, coord)[0], "possibleAttacks", true);

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);

}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }

  e.dataTransfer.dropEffect = "move";

  return false;
}

function handleDragEnter(e) {
  // this / e.target is the current hover target.

  this.classList.add("over");
}

function handleDragLeave(e) {
  // this / e.target is previous target element.

  this.classList.remove("over");
}

function handleDrop(e) {
  // this / e.target is current target element.

  let target = [Number(this.getAttribute("data-x")), Number(this.getAttribute("data-y"))];
  let source = [Number(dragSrcEl.getAttribute("data-x")), Number(dragSrcEl.getAttribute("data-y"))];
  let creature = playground.map[source[0]][source[1]].creature;
  let moves = findMoves(playground.map, source);
  let attacks = findAttacks(playground.map, source);


  if (creature.name.toLowerCase() == playground.turn.toLowerCase()) {
    if (creature.name == "Zorro" && attacks.length && match(attacks[0], target)) {

      attackCreature(source, target, attacks);
      if (!findAttacks(playground.map, target)[0].length) {
        // keep same turn if new attacks can be made
        playground.changeTurn();
      }
      this.appendChild(dragSrcEl.firstChild);

    } else if (moves.length && match(moves, target)) {

      moveCreature(source,target, moves);
      playground.changeTurn();
      this.appendChild(dragSrcEl.firstChild);
    }
  }

  displayPossible(moves, "possibleMoves", false);
  displayPossible(attacks[0], "possibleAttacks", false);
  checkConditions();

  document.querySelector("#info").innerHTML = "Turno: " + playground.turn +".";
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }
}

function handleDragEnd(e) {
  // this/e.target is the source node.

  let coord = [Number(dragSrcEl.getAttribute("data-x")), Number(dragSrcEl.getAttribute("data-y"))];

  [].forEach.call(squares, function (square) {
    square.classList.remove('over');
    square.style.opacity = "1";
  });

  displayPossible(findMoves(playground.map, coord), "possibleMoves", false);
  displayPossible(findAttacks(playground.map, coord), "possibleAttacks", false);
}

// CODE EXECUTION

window.addEventListener("load", function() {
  var start = document.querySelector("#newGame");
  var newTurn = document.querySelector("#newTurn");
  var rotate = document.querySelector("#rotate");
  var intro = document.querySelector("#btnIntro");

  start.addEventListener("click", initializeGame, false);
  newTurn.addEventListener("click", changeTurn, false);
  rotate.addEventListener("click", rotateScreen, false);
  intro.addEventListener("click", introductionHandle, false);
  document.body.onkeyup = function(e){
    // Change turn when Spacebar clicked

    if(e.keyCode == 32 || e.key === " " || e.key == "Spacebar"){
      changeTurn();

      return;
    }
  }
}, false);

// CONFETTI - EXTRA

var retina = window.devicePixelRatio,

  // Math shorthands
  PI = Math.PI,
  sqrt = Math.sqrt,
  round = Math.round,
  random = Math.random,
  cos = Math.cos,
  sin = Math.sin,

  // Local WindowAnimationTiming interface
  rAF = window.requestAnimationFrame,
  cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame;

// Local WindowAnimationTiming interface polyfill
(function (w) {
  /**
  * Fallback implementation.
  */
  var prev = new Date().getTime();
  function fallback(fn) {
    var curr = _now();
    var ms = Math.max(0, 16 - (curr - prev));
    var req = setTimeout(fn, ms);
    prev = curr;
    return req;
  }

  /**
  * Cancel.
  */
  var cancel = w.cancelAnimationFrame
    || w.webkitCancelAnimationFrame
    || w.clearTimeout;

  rAF = w.requestAnimationFrame
    || w.webkitRequestAnimationFrame
    || fallback;

  cAF = function(id){
    cancel.call(w, id);
  };
}(window));

document.addEventListener("DOMContentLoaded", function() {
  var speed = 50,
    duration = (1.0 / speed),
    confettiRibbonCount = 11,
    ribbonPaperCount = 30,
    ribbonPaperDist = 8.0,
    ribbonPaperThick = 8.0,
    confettiPaperCount = 95,
    DEG_TO_RAD = PI / 180,
    RAD_TO_DEG = 180 / PI,
    colors = [
      ["#df0049", "#660671"],
      ["#00e857", "#005291"],
      ["#2bebbc", "#05798a"],
      ["#ffd200", "#b06c00"]
    ];

  function Vector2(_x, _y) {
    this.x = _x, this.y = _y;
    this.Length = function() {
      return sqrt(this.SqrLength());
    }
    this.SqrLength = function() {
      return this.x * this.x + this.y * this.y;
    }
    this.Add = function(_vec) {
      this.x += _vec.x;
      this.y += _vec.y;
    }
    this.Sub = function(_vec) {
      this.x -= _vec.x;
      this.y -= _vec.y;
    }
    this.Div = function(_f) {
      this.x /= _f;
      this.y /= _f;
    }
    this.Mul = function(_f) {
      this.x *= _f;
      this.y *= _f;
    }
    this.Normalize = function() {
      var sqrLen = this.SqrLength();
      if (sqrLen != 0) {
        var factor = 1.0 / sqrt(sqrLen);
        this.x *= factor;
        this.y *= factor;
      }
    }
    this.Normalized = function() {
      var sqrLen = this.SqrLength();
      if (sqrLen != 0) {
        var factor = 1.0 / sqrt(sqrLen);
        return new Vector2(this.x * factor, this.y * factor);
      }
      return new Vector2(0, 0);
    }
  }
  Vector2.Lerp = function(_vec0, _vec1, _t) {
    return new Vector2((_vec1.x - _vec0.x) * _t + _vec0.x, (_vec1.y - _vec0.y) * _t + _vec0.y);
  }
  Vector2.Distance = function(_vec0, _vec1) {
    return sqrt(Vector2.SqrDistance(_vec0, _vec1));
  }
  Vector2.SqrDistance = function(_vec0, _vec1) {
    var x = _vec0.x - _vec1.x;
    var y = _vec0.y - _vec1.y;
    return (x * x + y * y + z * z);
  }
  Vector2.Scale = function(_vec0, _vec1) {
    return new Vector2(_vec0.x * _vec1.x, _vec0.y * _vec1.y);
  }
  Vector2.Min = function(_vec0, _vec1) {
    return new Vector2(Math.min(_vec0.x, _vec1.x), Math.min(_vec0.y, _vec1.y));
  }
  Vector2.Max = function(_vec0, _vec1) {
    return new Vector2(Math.max(_vec0.x, _vec1.x), Math.max(_vec0.y, _vec1.y));
  }
  Vector2.ClampMagnitude = function(_vec0, _len) {
    var vecNorm = _vec0.Normalized;
    return new Vector2(vecNorm.x * _len, vecNorm.y * _len);
  }
  Vector2.Sub = function(_vec0, _vec1) {
    return new Vector2(_vec0.x - _vec1.x, _vec0.y - _vec1.y, _vec0.z - _vec1.z);
  }

  function EulerMass(_x, _y, _mass, _drag) {
    this.position = new Vector2(_x, _y);
    this.mass = _mass;
    this.drag = _drag;
    this.force = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
    this.AddForce = function(_f) {
      this.force.Add(_f);
    }
    this.Integrate = function(_dt) {
      var acc = this.CurrentForce(this.position);
      acc.Div(this.mass);
      var posDelta = new Vector2(this.velocity.x, this.velocity.y);
      posDelta.Mul(_dt);
      this.position.Add(posDelta);
      acc.Mul(_dt);
      this.velocity.Add(acc);
      this.force = new Vector2(0, 0);
    }
    this.CurrentForce = function(_pos, _vel) {
      var totalForce = new Vector2(this.force.x, this.force.y);
      var speed = this.velocity.Length();
      var dragVel = new Vector2(this.velocity.x, this.velocity.y);
      dragVel.Mul(this.drag * this.mass * speed);
      totalForce.Sub(dragVel);
      return totalForce;
    }
  }

  function ConfettiPaper(_x, _y) {
    this.pos = new Vector2(_x, _y);
    this.rotationSpeed = (random() * 600 + 800);
    this.angle = DEG_TO_RAD * random() * 360;
    this.rotation = DEG_TO_RAD * random() * 360;
    this.cosA = 1.0;
    this.size = 5.0;
    this.oscillationSpeed = (random() * 1.5 + 0.5);
    this.xSpeed = 40.0;
    this.ySpeed = (random() * 60 + 50.0);
    this.corners = new Array();
    this.time = random();
    var ci = round(random() * (colors.length - 1));
    this.frontColor = colors[ci][0];
    this.backColor = colors[ci][1];
    for (var i = 0; i < 4; i++) {
      var dx = cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
      var dy = sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
      this.corners[i] = new Vector2(dx, dy);
    }
    this.Update = function(_dt) {
      this.time += _dt;
      this.rotation += this.rotationSpeed * _dt;
      this.cosA = cos(DEG_TO_RAD * this.rotation);
      this.pos.x += cos(this.time * this.oscillationSpeed) * this.xSpeed * _dt
      this.pos.y += this.ySpeed * _dt;
      if (this.pos.y > ConfettiPaper.bounds.y) {
        this.pos.x = random() * ConfettiPaper.bounds.x;
        this.pos.y = 0;
      }
    }
    this.Draw = function(_g) {
      if (this.cosA > 0) {
        _g.fillStyle = this.frontColor;
      } else {
        _g.fillStyle = this.backColor;
      }
      _g.beginPath();
      _g.moveTo((this.pos.x + this.corners[0].x * this.size) * retina, (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina);
      for (var i = 1; i < 4; i++) {
        _g.lineTo((this.pos.x + this.corners[i].x * this.size) * retina, (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina);
      }
      _g.closePath();
      _g.fill();
    }
  }
  ConfettiPaper.bounds = new Vector2(0, 0);

  function ConfettiRibbon(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
    this.particleDist = _dist;
    this.particleCount = _count;
    this.particleMass = _mass;
    this.particleDrag = _drag;
    this.particles = new Array();
    var ci = round(random() * (colors.length - 1));
    this.frontColor = colors[ci][0];
    this.backColor = colors[ci][1];
    this.xOff = (cos(DEG_TO_RAD * _angle) * _thickness);
    this.yOff = (sin(DEG_TO_RAD * _angle) * _thickness);
    this.position = new Vector2(_x, _y);
    this.prevPosition = new Vector2(_x, _y);
    this.velocityInherit = (random() * 2 + 4);
    this.time = random() * 100;
    this.oscillationSpeed = (random() * 2 + 2);
    this.oscillationDistance = (random() * 40 + 40);
    this.ySpeed = (random() * 40 + 80);
    for (var i = 0; i < this.particleCount; i++) {
      this.particles[i] = new EulerMass(_x, _y - i * this.particleDist, this.particleMass, this.particleDrag);
    }
    this.Update = function(_dt) {
      var i = 0;
      this.time += _dt * this.oscillationSpeed;
      this.position.y += this.ySpeed * _dt;
      this.position.x += cos(this.time) * this.oscillationDistance * _dt;
      this.particles[0].position = this.position;
      var dX = this.prevPosition.x - this.position.x;
      var dY = this.prevPosition.y - this.position.y;
      var delta = sqrt(dX * dX + dY * dY);
      this.prevPosition = new Vector2(this.position.x, this.position.y);
      for (i = 1; i < this.particleCount; i++) {
        var dirP = Vector2.Sub(this.particles[i - 1].position, this.particles[i].position);
        dirP.Normalize();
        dirP.Mul((delta / _dt) * this.velocityInherit);
        this.particles[i].AddForce(dirP);
      }
      for (i = 1; i < this.particleCount; i++) {
        this.particles[i].Integrate(_dt);
      }
      for (i = 1; i < this.particleCount; i++) {
        var rp2 = new Vector2(this.particles[i].position.x, this.particles[i].position.y);
        rp2.Sub(this.particles[i - 1].position);
        rp2.Normalize();
        rp2.Mul(this.particleDist);
        rp2.Add(this.particles[i - 1].position);
        this.particles[i].position = rp2;
      }
      if (this.position.y > ConfettiRibbon.bounds.y + this.particleDist * this.particleCount) {
        this.Reset();
      }
    }
    this.Reset = function() {
      this.position.y = -random() * ConfettiRibbon.bounds.y;
      this.position.x = random() * ConfettiRibbon.bounds.x;
      this.prevPosition = new Vector2(this.position.x, this.position.y);
      this.velocityInherit = random() * 2 + 4;
      this.time = random() * 100;
      this.oscillationSpeed = random() * 2.0 + 1.5;
      this.oscillationDistance = (random() * 40 + 40);
      this.ySpeed = random() * 40 + 80;
      var ci = round(random() * (colors.length - 1));
      this.frontColor = colors[ci][0];
      this.backColor = colors[ci][1];
      this.particles = new Array();
      for (var i = 0; i < this.particleCount; i++) {
        this.particles[i] = new EulerMass(this.position.x, this.position.y - i * this.particleDist, this.particleMass, this.particleDrag);
      }
    }
    this.Draw = function(_g) {
      for (var i = 0; i < this.particleCount - 1; i++) {
        var p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
        var p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
        if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
          _g.fillStyle = this.frontColor;
          _g.strokeStyle = this.frontColor;
        } else {
          _g.fillStyle = this.backColor;
          _g.strokeStyle = this.backColor;
        }
        if (i == 0) {
          _g.beginPath();
          _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
          _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
          _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
          _g.closePath();
          _g.stroke();
          _g.fill();
          _g.beginPath();
          _g.moveTo(p1.x * retina, p1.y * retina);
          _g.lineTo(p0.x * retina, p0.y * retina);
          _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
          _g.closePath();
          _g.stroke();
          _g.fill();
        } else if (i == this.particleCount - 2) {
          _g.beginPath();
          _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
          _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
          _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
          _g.closePath();
          _g.stroke();
          _g.fill();
          _g.beginPath();
          _g.moveTo(p1.x * retina, p1.y * retina);
          _g.lineTo(p0.x * retina, p0.y * retina);
          _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
          _g.closePath();
          _g.stroke();
          _g.fill();
        } else {
          _g.beginPath();
          _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
          _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
          _g.lineTo(p1.x * retina, p1.y * retina);
          _g.lineTo(p0.x * retina, p0.y * retina);
          _g.closePath();
          _g.stroke();
          _g.fill();
        }
      }
    }
    this.Side = function(x1, y1, x2, y2, x3, y3) {
      return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2));
    }
  }
  ConfettiRibbon.bounds = new Vector2(0, 0);
  confetti = {};
  confetti.Context = function(id) {
    var i = 0;
    var canvas = document.getElementById(id);
    var canvasParent = canvas.parentNode;
    var canvasWidth = canvasParent.offsetWidth;
    var canvasHeight = canvasParent.offsetHeight;
    canvas.width = canvasWidth * retina;
    canvas.height = canvasHeight * retina;
    var context = canvas.getContext('2d');
    var interval = null;
    var confettiRibbons = new Array();
    ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
    for (i = 0; i < confettiRibbonCount; i++) {
      confettiRibbons[i] = new ConfettiRibbon(random() * canvasWidth, -random() * canvasHeight * 2, ribbonPaperCount, ribbonPaperDist, ribbonPaperThick, 45, 1, 0.05);
    }
    var confettiPapers = new Array();
    ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
    for (i = 0; i < confettiPaperCount; i++) {
      confettiPapers[i] = new ConfettiPaper(random() * canvasWidth, random() * canvasHeight);
    }
    this.resize = function() {
      canvasWidth = canvasParent.offsetWidth;
      canvasHeight = canvasParent.offsetHeight;
      canvas.width = canvasWidth * retina;
      canvas.height = canvasHeight * retina;
      ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
      ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
    }
    this.start = function() {
      this.stop()
      var context = this;
      this.update();
    }
    this.stop = function() {
      cAF(this.interval);
    }
    this.update = function() {
      var i = 0;
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (i = 0; i < confettiPaperCount; i++) {
        confettiPapers[i].Update(duration);
        confettiPapers[i].Draw(context);
      }
      for (i = 0; i < confettiRibbonCount; i++) {
        confettiRibbons[i].Update(duration);
        confettiRibbons[i].Draw(context);
      }
      this.interval = rAF(function() {
        confetti.update();
      });
    }
  }
  var confetti = new confetti.Context('confetti');
  confetti.start();
  window.addEventListener('resize', function(event){
    confetti.resize();
  });
});
