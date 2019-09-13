// GLOBAL VARIABLES

var list = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]];
var attackList = [[2, 0], [2, -2], [0, -2], [-2, -2], [-2, 0], [-2, 2], [0, 2], [2, 2]];
var special = [[2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]];
var source;
var possible;
var attack;
var cols;
var playground;
var turnHTML;
var start;
var newTurn;
var dragSrcEl = null;
var buttons = document.querySelector("#mainButtons");
var rotate = false;

// GAME FUNCTIONS

class Playground {
  constructor(map, state, turn) {
    this.map = map;
    this.state = state || "not playing";
    this.turn = turn || "";
    this.chickens = new Array();
    this.foxes = new Array();
    this.removed = 0;
  }
  changeState(state) {
    return this.state = state;
  }
  updateMap(map) {
    return this.map = map;
  }
  changeTurn() {
    this.turn = (this.turn == "Chicken") ? "Fox" : "Chicken";
    return this.turn;
  }
}

function chicken(X, Y) {
  var chicken = {};
  chicken.coord = [X, Y];
  chicken.name = "chicken";
  return chicken;
}

function fox(X, Y) {
  var fox = {};
  fox.coord = [X, Y];
  fox.name = "fox";
  return fox;
}

function createMap() {
  var map = [];
  for (var i = 0; i < 7; i++) {
    for (var j = 0; j < 7; j++) {
      if (typeof map[i] == "undefined") {
        map[i] = [];
      }
      if (checkOutsideBoxes(i, j)) {
        map[i].push({blocked : true});
      }
      else {
        if (findPar(i, j)) {
          map[i].push({coord: [i, j], blocked : false, diagonal: true, creature: {name: ""}, special: false});

        }
        else {
          map[i].push({coord: [i, j], blocked : false, diagonal: false, creature: {name: ""}, special: false});
        }
      }
    }
  }
  for (var el of special) {
    map[el[0]][el[1]].special = true;
  }
  return map;
}

function populateChickens(map) {
  var chickens = new Array();
  for (var col in map) {
    for (var row in map[col]) {
      if (!((col < 2 && row > 4) || (col > 4 && row > 4) || (row < 3))) {
        let newChicken = new chicken(map[col][row].coord[0], map[col][row].coord[1]);
        chickens.push(newChicken);
        map[col][row].blocked = true;
        map[col][row].creature = chickens[chickens.length-1];
      }
    }
  }
  return chickens;
}

function populateFoxes(map) {
  var foxes = new Array();
  foxes.push(new fox(map[2][2].coord[0], map[2][2].coord[1]));
  map[2][2].blocked = true;
  map[2][2].creature = foxes[foxes.length-1];
  foxes.push(new fox(map[4][2].coord[0], map[4][2].coord[1]));
  map[4][2].blocked = true;
  map[4][2].creature = foxes[foxes.length-1];
  return foxes;
}

function findCreature(playground, creature) {
  let found;
  let arr = (creature.name == "chicken") ? playground.chickens : playground.foxes;
  for (var el in arr) {
    if (arr[el].coord[0] == creature.coord[0] && arr[el].coord[1] == creature.coord[1]) {
      found = el;
      return found;
    }
  }
  return;
}

function moveCreature(map, creature, position, possibleMoves) {
  let initial = [creature.coord[0], creature.coord[1]];
  for (var move of possibleMoves) {
    if (move[0] == position[0] && move[1] == position[1]) {
      console.log("Moving " + creature.name + " to " + move);
      creature.coord[0] = move[0];
      creature.coord[1] = move[1];
      map[initial[0]][initial[1]].blocked = false;
      map[initial[0]][initial[1]].creature = {name: ""};
      map[move[0]][move[1]].blocked = true;
      map[move[0]][move[1]].creature = creature;
      return true;
    }
  }
  return false;
}

function findMoves(map, creature) {
  var pos = [creature.coord[0], creature.coord[1]];
  var possibleMoves = new Array();
  for (var l of list) {
    if (map[pos[0]+l[0]] !== undefined && map[pos[0]+l[0]][pos[1]+l[1]] && map[pos[0]+l[0]][pos[1]+l[1]].coord) {
      if (map[pos[0]+l[0]][pos[1]+l[1]].blocked !== true) {
        possibleMoves.push(map[pos[0]+l[0]][pos[1]+l[1]].coord);
      }
    }
  }
  if (!findPar(pos[0], pos[1])) {
    removeImparPossibilities(pos, possibleMoves);
  }
  return possibleMoves;
}

function findAttacks(map, fox) {
  var pos = [fox.coord[0], fox.coord[1]];
  var possibleAttacks = new Array();
  var possibleChickens = new Array();
  for (var l of attackList) {
    if (map[pos[0]+l[0]] !== undefined && map[pos[0]+l[0]][pos[1]+l[1]] !== undefined) {
      let targetPos = [pos[0]+l[0], pos[1]+l[1]];
      let targetChickenPos = [pos[0] + (targetPos[0]-pos[0]) / 2, pos[1] + (targetPos[1]-pos[1]) / 2];
      let targetCreature = (map[targetChickenPos[0]][targetChickenPos[1]]).creature;
      if(map[targetPos[0]][targetPos[1]].blocked !== true && targetCreature && targetCreature.name == "chicken") {
        possibleAttacks.push(map[targetPos[0]][targetPos[1]].coord);
        possibleChickens.push(map[targetChickenPos[0]][targetChickenPos[1]].coord);
      }
    }
  }
  if (!findPar(pos[0], pos[1])) {
    removeImparPossibilities(pos, possibleAttacks);
  }
  return [possibleAttacks, possibleChickens];
}

function attackChicken(map, creature, position, possibleAttacks) {
  for (var idx in possibleAttacks[0]) {
    let chicken = map[possibleAttacks[1][idx][0]][possibleAttacks[1][idx][1]].creature;
    if (position[0] == possibleAttacks[0][idx][0] && position[1] == possibleAttacks[0][idx][1]) {
      removeChicken(playground, map, chicken);
    }
  }
  return creature;
}

function removeChicken(playground, map, chicken) {
  let pos = chicken.coord;
  if (map[pos[0]][pos[1]].creature.name == "chicken") {
    let div = findDiv(pos[0], pos[1]).children[0];
    playground.chickens.splice(findCreature(playground, chicken), 1);
    map[pos[0]][pos[1]].creature = {name: ""};
    playground.removed += 1;
    map[pos[0]][pos[1]].blocked = false;
    div.remove();
    console.log("removed chicken at: " + pos[0] + " " + pos[1]);
  }
  return chicken;
}

function checkConditions(playground) {
  let status = playground.state;
  let specialCount = 0;
  if (playground.removed == 6) {
    status = "El Zorro ganó!";
  } else if (findMoves(playground.map, playground.foxes[0]).length == 0 && findMoves(playground.map, playground.foxes[1]).length == 0) {
    let at1 = findAttacks(playground.map, playground.foxes[0]);
    let at2 = findAttacks(playground.map, playground.foxes[1]);
    if (at1[0].length == 0 && at2[0].length == 0) {
      status = "Las gallinas ganaron!";
    }
  } else {
    for (el of special) {
      if (playground.map[el[0]][el[1]].creature.name == "chicken") {
        specialCount += 1;
      }
      if (specialCount == 9) {
        status = "Las gallinas ganaron!";
        break;
      }
    }
  }
  if (status == "El Zorro ganó!" || status == "Las gallinas ganaron!") {
    showChickenCount(false);
    disableRotate();
    document.querySelector("#winner > p").innerHTML = status;
    document.querySelector("#winner").style.display = "block";
    document.querySelector("#status").innerHTML = "";
  }
  return status;
}

function newGame() {
  let map = createMap();
  playground = new Playground(map, "Jugando", "Chicken");
  console.log("Start");
  playground.chickens = populateChickens(playground.map);
  playground.foxes = populateFoxes(playground.map);
  document.querySelector("#game").innerHTML = "";
  displayMap(playground.map);
  displayCreatures(playground);
  cols = document.querySelectorAll('.square');
  addListenersSquares();
  document.querySelector("#status").innerHTML = checkConditions(playground);
  return playground;
}

// DISPLAY FUNCTIONS

function displayMap(map) {
  let gameWrap = document.querySelector("#game");
  for (var i = 0; i < map.length; i++) {
    let col = document.createElement("div");
    col.className = "column";
    for (var j = map[i].length - 1; j >= 0; j--) {
      let square = document.createElement("div");
      if (checkOutsideBoxes(i, j)) {
        square.className = "outside";
      } else {
        square.className = "square";
        if (map[i][j].special) {
          square.classList.add("special");
        }
      }
      square.setAttribute('data-x', i.toString());
      square.setAttribute('data-y', j.toString());
      col.appendChild(square);
    }
    gameWrap.appendChild(col);
  }
  return gameWrap;
}

function displayCreatures(playground) {
  let chickens = playground.chickens;
  let foxes = playground.foxes;
  let map = playground.map;
  for (var chicken of chickens) {
    let pos = [chicken.coord[0], chicken.coord[1]];
    let div = findDiv(pos[0], pos[1]);
    let newDiv = document.createElement("div");
    newDiv.className = "chicken";
    newDiv.setAttribute("draggable", true);
    div.appendChild(newDiv);
  }
  for (var fox of foxes) {
    let pos = [fox.coord[0], fox.coord[1]];
    let div = findDiv(pos[0], pos[1]);
    let newDiv = document.createElement("div");
    newDiv.className = "fox";
    newDiv.setAttribute("draggable", true);
    div.appendChild(newDiv);
  }
  return document.querySelector("#game");
}

function displayPossibleMoves(possibleMoves, display) {
  // possibleMoves: Array of Moves
  // display: boolean show/hide
  if (possibleMoves.length) {
    for (var el of possibleMoves) {
      let possible = findDiv(el[0], el[1]);
      if (display) {
        possible.classList.add("possibleMoves");
      } else {
        possible.classList.remove("possibleMoves");
      }
    }
  }
  return;
}

function displayPossibleAttacks(possibleAttacks, display) {
  // possibleMoves: Array of Moves
  // display: boolean show/hide
  if (possibleAttacks && possibleAttacks.length) {
    for (var el of possibleAttacks) {
      let possibleDiv = findDiv(el[0], el[1]);
      if (display) {
        possibleDiv.classList.add("possibleAttacks");
      } else {
        possibleDiv.classList.remove("possibleAttacks");
      }
    }
  } else {
    for (var el of document.querySelectorAll(".possibleAttacks")) {
      el.classList.remove("possibleAttacks");
    }
  }
  return;
}

// HELPER FUNCTIONS

function findPar(x, y) {
  return (x + y) % 2 == 0;
}

function checkOutsideBoxes(x, y) {
  if ((x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4) || (x > 4 && y > 4)) {
    return true;
  } else { return false; }
}

function findDiv(x, y) {
  let game = document.querySelector("#game");
  let found;
  let columns = elementChildren(game);
  for (var el in columns) {
    if (el == x) {
      let row = elementChildren(columns[el]);
      for (j in row) {
        if (row[j].getAttribute("data-y") == y) {
          found = row[j];
        }
      }
    }
  }
  return found;
}

function matchAttack(possibleAttacks, target) {
  for (var el of possibleAttacks) {
    if (el[0] == target[0] && el[1] == target[1]) { return true;}
  }
  return false;
}

function elementChildren (element) {
    var childNodes = element.childNodes,
        children = [],
        i = childNodes.length;

    while (i--) {
        if (childNodes[i].nodeType == 1) {
            children.unshift(childNodes[i]);
        }
    }

    return children;
}

function removeImparPossibilities(pos, possibleArr) {
  if (possibleArr.length) {
    for (var i = possibleArr.length - 1; i >= 0; i--) {
      if (!findPar(possibleArr[i][0], possibleArr[i][1])) {
        if (pos[0] == possibleArr[i][0] || pos[1] == possibleArr[i][1]) {
          continue;
        } else {
          console.log("found diag move: " + "(" + possibleArr[i][0] + " , " + possibleArr[i][1] + ")");
          possibleArr.splice(i, 1);
        }
      }
    }
  }
  return possibleArr;
}

function introductionHandle(show) {
  // show: boolean true/false show or hide introduction
  
  let intro = document.querySelector("#introduction");

  if (show) {
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
  let slides = document.querySelectorAll(".slide");
  for (var el of slides) {
    if (el.style.display == "block") {
      let index = Number(el.getAttribute("data-slide")) + 1;
      el.style.display = "none";
      if (slides[index]) {
        slides[index].style.display = "block";
      } else {
        executeNewGame();
      }
      return;
    }
  }
  return;
}

function showChickenCount(bool) {
  let count = playground.removed;
  let div = document.querySelector("#chickenCount");
  if (bool) {
    div.innerHTML = "Gallinas eliminadas: " + count;
  } else {
    div.innerHTML = "";
  }
  return;
}

function executeNewGame() {
  buttons.style.display = "none";
  document.querySelector("#winner").style.display = "none";
  newGame();
  turnHTML = playground.turn == "Chicken" ? "las gallinas" : "el Zorro";
  document.querySelector("#info").innerHTML = "Turno de " + turnHTML +".";
  document.querySelector("#introduction").style.display = "none";
  console.log(playground);
}

function rotateScreen() {
  let wrapper = document.querySelector("#gameWrapper");
  wrapper.style.transform = (wrapper.style.transform == "rotate(180deg)") ? "rotate(0deg)" : "rotate(180deg)";
  return wrapper;
}

function changeRotate() {
  rotate = (rotate == true) ? false : true;
  return rotate;
}

// LISTENER FUNCTIONS

function addListenersSquares() {
  [].forEach.call(cols, function(col) {
    col.addEventListener('dragstart', handleDragStart, false);
    col.addEventListener('dragenter', handleDragEnter, false)
    col.addEventListener('dragover', handleDragOver, false);
    col.addEventListener('dragleave', handleDragLeave, false);
    col.addEventListener('drop', handleDrop, false);
    col.addEventListener('dragend', handleDragEnd, false);
  });
}

function handleDragStart(e) {
  this.style.opacity = '0.4';  // this / e.target is the source node.
  src = this;
  possible = new Array();
  attack = new Array();
  let source = [this.getAttribute("data-x"), this.getAttribute("data-y")];
  let creature = playground.map[source[0]][source[1]].creature;
  console.log("Grabbed a : " + creature.name);
  possible = findMoves(playground.map, creature);
  attack = creature.name == "fox" ? findAttacks(playground.map, creature) : [];
  displayPossibleMoves(possible, true);
  displayPossibleAttacks(attack[0], true);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  // Don't do anything if dropping the same column we're dragging.
  if (dragSrcEl != this) {
    // Set the source column's HTML to the HTML of the column we dropped on.
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData('text/html');
  }
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }

  e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.

  return false;
}

function handleDragEnter(e) {
  // this / e.target is the current hover target.
  this.classList.add('over');
}

function handleDragLeave(e) {
  this.classList.remove('over');  // this / e.target is previous target element.
}

function handleDrop(e) {
  // this / e.target is current target element.
  let target = [this.getAttribute("data-x"), this.getAttribute("data-y")];
  let source = [src.getAttribute("data-x"), src.getAttribute("data-y")];
  let creature = playground.map[source[0]][source[1]].creature;
  if (creature.name == playground.turn.toLowerCase()) {
    if (attack.length && matchAttack(attack[0], target)) {
      attackChicken(playground.map, creature, target, attack);
      moveCreature(playground.map, creature, target, attack[0]);
      this.appendChild(src.firstChild);
      displayPossibleMoves(possible, false);
      displayPossibleAttacks(attack[0], false);
      attack = creature.name == "fox" ? findAttacks(playground.map, creature) : [];
      showChickenCount(true);
      if (attack[0].length) {
      } else {
        playground.changeTurn();
        if (rotate) {
          rotateScreen();
        }
        turnHTML = playground.turn == "Chicken" ? "las gallinas" : "el Zorro";
        document.querySelector("#info").innerHTML = "Turno de " + turnHTML +".";
      }
    } else {
      if (moveCreature(playground.map, creature, target, possible)) {
        this.appendChild(src.firstChild);
        playground.changeTurn();
        if (rotate) {
          rotateScreen();
        }
        turnHTML = playground.turn == "Chicken" ? "las gallinas" : "el Zorro";
        document.querySelector("#info").innerHTML = "Turno de " + turnHTML +".";
      }
    }
    document.querySelector("#status").innerHTML = checkConditions(playground);
  }
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }

  // See the section on the DataTransfer object.

  return false;
}

function handleDragEnd(e) {
  // this/e.target is the source node.

  [].forEach.call(cols, function (col) {
    col.classList.remove('over');
    col.style.opacity = "1";
  });
  displayPossibleMoves(possible, false);
  displayPossibleAttacks(attack[0], false);
}


// CODE EXECUTION

window.addEventListener("load", function() {
  start = document.querySelector("#btnStart");
  newTurn = document.querySelector("#newTurn");
  start.addEventListener("click", executeNewGame, false);
  newTurn.addEventListener("click", function() {
    if (playground.state == "Jugando") {
      playground.changeTurn();
      if (rotate) {
        rotateScreen();
      }
      turnHTML = playground.turn == "Chicken" ? "las gallinas" : "el Zorro";
      document.querySelector("#info").innerHTML = "Turno de " + turnHTML +".";
    }
  }, false);
}, false);
document.querySelector("#btnIntro").addEventListener("click", introductionHandle, false);
document.querySelector("#newGame").addEventListener("click", executeNewGame, false);
document.querySelector("#autoRotate").addEventListener("click", changeRotate, false);
document.querySelector("#rotate").addEventListener("click", rotateScreen, false);
