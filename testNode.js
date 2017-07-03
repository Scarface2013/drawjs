#!/usr/bin/node
var blessed = require('blessed');
var contrib = require('blessed-contrib');

var screen = blessed.screen({
  smartCSR: true
});

screen.title = 'Game';

// Renderable object definitions

// Assumed terminal size is 80x24 (default for putty and legacy stuff)
var gameScreen = blessed.box({
  top: 0,
  left: 0,
  width: 80,
  height: 20,
  style: {
    fg: 'white',
    bg: 'green',
  },
});
var character = blessed.box({
  top: 2,
  left: 2,
  width: 1,
  height: 1,
  sytle: {
    bg: "black"
  }
});
var statusBar = blessed.box({
  top: 20,
  left: 0,
  width: 80,
  height: 4,
  style: {
    fg: 'black',
    bg: 'white',
  },
});
var healthBar = blessed.box({
  top: 1,
  left: 1,
  width: 10,
  height: 1,
  content: 'health',
  align: 'center',
  style: {
    fg: 'black',
    bg: 'red',
  },
});
var manaBar = blessed.box({
  top: 1,
  left: 14,
  width: 10,
  height: 1,
  content: 'mana',
  align: 'center',
  style: {
    fg: 'black',
    bg: 'cyan',
  },
});

screen.append(gameScreen);
  gameScreen.append(character);

screen.append(statusBar);
  statusBar.append(healthBar);
  statusBar.append(manaBar);

screen.key(['q', 'escape'], function(ch, key){
  return process.exit(0);
});

// Character controls
gameScreen.key(['up'], function(){
  character.top -= 1;
  screen.render();
});
gameScreen.key(['down'], function(){
  character.top += 1;
  screen.render();
});
gameScreen.key(['left'], function(){
  character.left -= 1;
  screen.render();
});
gameScreen.key(['right'], function(){
  character.left += 1;
  screen.render();
});

// Helper functions
function clip(val,min,max){
  return min?val<min:max?val>max:val;
}

gameScreen.focus();
screen.render();
