//let infoText = "Not connected to stellarium!";
//var fetchInterval = 500;

// synchronized GET, returns as JSON
function getjson(url){
  var x = new XMLHttpRequest();
  x.open("GET",url,false); x.send();
  return JSON.parse(x.responseText);
}

// parallel "thread" pushing out commands in order without blocking UI
var reqqueue = [];

//try websockets
var sock = null;
if (window.WebSocket)
  sock = new WebSocket(location.origin.replace('http','ws'));
if (sock != null) { //if something happens, fall back to Ajax
  sock.onerror = function(){ sock = null; }
  sock.onclose = function(){ sock = null; }
  if (sock.readyState>1)
    sock = null;
}

function pushCommands() {
  if (reqqueue.length==0) {
    setTimeout(pushCommands,25);
    return;
  } else {

    var cmds = "";
    while (reqqueue.length>0) {
      cmds += reqqueue.shift() + '|'
    }
    cmds = cmds.substr(0,cmds.length-1);

    if (sock != null) { //use websockets

      sock.send(cmds);
      pushCommands();

    } else {

      cmds = "/exec/"+cmds;

      var xmlhttp = new XMLHttpRequest(); //use http GET
      xmlhttp.open("GET",cmds,true);
      xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState==4) pushCommands();
      };
      xmlhttp.send();

    }
  }
}
pushCommands();

// ----------------------------------------------------------------------------

//load keymap for keyboard once from server on startup
var keymap = getjson('keymap.json');
//list of keysym -> printable mappings (what to write on the key button)
var labels = getjson('labels.json');
//get keycode layout of virtual keyboard
var layout = getjson('layout.json');

var c = document.getElementById('mycanvas');
var st = new createjs.Stage('mycanvas');

var mode = 0; //current mode (0 = default (keyboard 0), 1 = keyboard 1)

var currkeys = null; //references to current key objects of keyboard
//state of modifiers affecting key labels
var shiftPressed=false;
var capsLocked=false;
var l3shiftPressed=false;
var l5shiftPressed=false;

//remember coordinates from last event while drag-moving
var ox=null;
var oy=null;
//remember coordinates of mousedown on touchpad
var sx=null;
var sy=null;

function isdef(x){ return (typeof x != 'undefined') }

function xdo(url) { reqqueue.push(url); }

function newRect(x,y,w,h,borderclr,fillclr,buttonText) {
  var button = new createjs.Container();
  var r = new createjs.Shape();
  var text = new createjs.Text();
  r.setBounds(x,y,w,h);
  r.x = x;
  r.y = y;
  r.graphics.beginStroke(borderclr).beginFill(fillclr)
    .drawRect(0,0,w,h);
  var fonth = Math.min(Math.abs(h/2), w);
  text.set({
    text: buttonText,
    textAlign: "center",
    textBaseline: "middle",
    color: "#FF0000",
    font: fonth+"px",
    x: x + w / 2,
    y: y + h / 2
  })
  button.addChild(r, text);
  return button;
}

/* function fetchStatus() {
  let skytime, timespeed, selection, fov = "";

  fetch('http://10.0.0.1:8090/api/main/status')
    .then(response => {
	return response.json();
    })
    .then(data => {
      skytime = data.time.local.substring(0,10) + " " + data.time.local.substring(11,19);
      timespeed = " (" + Math.round(parseFloat(data.time.timerate)/0.0000115740).toString() + "x)";
      selection = data.selectioninfo;
      if (selection != "") {
        selection = selection.substr(5, selection.length);
        selection = " Selected:" + selection.substring(0, selection.indexOf('<'));
      } else {
        selection = " No selection";
      }
      fov = " FOV: " + data.view.fov;
      infoText = skytime + timespeed + fov + selection;
      console.log(infoText);
    })
    .catch(function (err) {
      infoText = "Not connected to stellarium!";
      console.log('error: ' + err);
    });
} */

function reloadPage() {
	resizeCanvas();
}

function generateFooter(x,y,w,h) {
  var fscrw = (c.height-y)*2;

  var fscr = newRect(x+fscrw,y,w-(fscrw*2),h,"#770000","#000000","");
  var togk = newRect(x,y,fscrw,h,"#770000","#000000","Toggle");
  var reload = newRect(w-fscrw,y,fscrw,h,"#770000","#000000","Reload");

  togk.touchstart = toggleMode;
  reload.touchstart = reloadPage;

  //function drawFooter() {
 //   removeChild(container.txt);
  //  container.txt = text;
  //  container.addChildAt(text,1);
 // };

  //setInterval(drawFooter, fetchInterval);
  
  st.addChild(fscr);
  st.addChild(togk);
  st.addChild(reload);
}

function generateMouse(x,y,w,h) {
  var th = h/5*4;
  var mouseX = w/3;
  var tpad = newRect(x,y,mouseX,th,"#770000","#000000","Touchpad");
  var lbtn = newRect(x,th,mouseX/2,h-th,"#770000","#111111","Select");
  // var mbtn = newRect(w/6*1,th,w/5,h-th,"black","#808080","");
  var rbtn = newRect(mouseX/2,th,mouseX/2,h-th,"#770000","#111111","DEselect");

  tpad.touchstart = function(evt){
    ox = sx = evt.clientX;
    oy = sy = evt.clientY;
  }
  tpad.touchmove = function(evt){
    var nx=evt.clientX;
    var ny=evt.clientY;
    var sc=2; //scale factor (movement speed)
    if (Math.abs(nx-ox)>1 || Math.abs(ny-oy)>1) {
      var dx = Math.round(nx-ox)*sc;
      var dy = Math.round(ny-oy)*sc;
      xdo("mousemove_relative "+dx+" "+dy);
    }
    ox = nx;
    oy = ny;
  };
  tpad.touchend = function(evt){
    var x = evt.clientX;
    var y = evt.clientY;
    if (Math.abs(sx-x)<3 && Math.abs(sy-y)<3)
      xdo("click 1")
    sx=sy=ox=oy=null;
  };

  lbtn.touchstart = function(){xdo("mousedown 1")}
  lbtn.touchend = function(){xdo("mouseup 1")}
  // mbtn.touchstart = function(){xdo("mousedown 2")}
  // mbtn.touchend = function(){xdo("mouseup 2")}
  rbtn.touchstart = function(){xdo("mousedown 3")}
  rbtn.touchend = function(){xdo("mouseup 3")}

  st.addChild(tpad);
  st.addChild(lbtn);
  // st.addChild(mbtn);
  st.addChild(rbtn);

  generateKeyboard(mouseX, y, w-mouseX, h);
}

function newKey(keycode,x,y,w,h) {
  var container = new createjs.Container();
  container.setBounds(x,y,w,h);
  container.x = x;
  container.y = y;

  var rect = newRect(0,0,w,h,"#770000","#000000","");
  container.addChild(rect);

  //keysym which will be sent
  var ksym = 'question';
  if (isdef(keymap[keycode][0]))
    ksym = keymap[keycode][0];

  container.touchstart=function(){keyDown(ksym);}
  container.touchend=function(){keyUp(ksym);}

  container.showLevel = function(idx) {
    container.removeChild(container.txt);

    //keysym which will really be shown depending on modifiers
    var keysym = 'question';
    if (isdef(keymap[keycode][idx]))
      keysym = keymap[keycode][idx];
    else if (isdef(keymap[keycode][0]))
      keysym = keymap[keycode][0];

    var label = keysym.length==1 ? keysym : '?';
    if (isdef(labels[keysym]))
      label = labels[keysym];

    var fonth = Math.min(Math.abs(h/2), w);
    var text = new createjs.Text(label,fonth+"px ButtonSans","red");
    //center text
    text.x = w/2-text.getBounds().width/2;
    text.y = h/2-text.getBounds().height/2;

    container.txt = text;
    container.addChildAt(text,1);
  }

  container.showLevel(0);
  return container;
}

function generateKeyboard(x,y,w,h) {
  var ynum = layout.length;
  var xnum = layout[0].length;
  var kw = w/xnum ;
  var kh = h/ynum;
  currkeys = [];
  for (var j=0; j<ynum; j++) {
    currkeys.push([]);
    for (var i=0; i<xnum; i++) {
      var keycode = layout[j][i];
      key = newKey(keycode,i*kw+x,j*kh+y,kw,kh);
      st.addChild(key);
      currkeys[(currkeys.length-1)].push(key); //store objects to change text later
    }
  }
}

function keyDown(ksym) {
  xdo("keydown "+ksym);

  if (ksym=='Shift_L' || ksym=='Shift_R') {
    shiftPressed=true; updateKeyLabels();
  } else if (ksym=='ISO_Level3_Shift') {
    l3shiftPressed=true; updateKeyLabels();
  } else if (ksym=='ISO_Level5_Shift') {
    l5shiftPressed=true; updateKeyLabels();
  }

  if (ksym=='Caps_Lock') {
    capsLocked = !capsLocked; updateKeyLabels();
  }
}

function keyUp(ksym){
  xdo("keyup "+ksym);

  if (ksym=='Shift_L' || ksym=='Shift_R') {
    shiftPressed=false; updateKeyLabels();
  } else if (ksym=='ISO_Level3_Shift') {
    l3shiftPressed=false; updateKeyLabels();
  } else if (ksym=='ISO_Level5_Shift') {
    l5shiftPressed=false; updateKeyLabels();
  }
}

function updateKeyLabels() {
  var idx = 0;
  if (shiftPressed && !l3shiftPressed && !l5shiftPressed)
    idx = 1;
  else if (capsLocked && shiftPressed)
    idx = 2;
  else if (capsLocked && !shiftPressed)
    idx = 3;
  else if (!shiftPressed && l3shiftPressed && !l5shiftPressed)
    idx = 4;
  else if (shiftPressed && l3shiftPressed && !l5shiftPressed)
    idx = 5;
  else if (!shiftPressed && !l3shiftPressed && l5shiftPressed)
    idx = 6;
  else if (shiftPressed && !l3shiftPressed && l5shiftPressed)
    idx = 7;

  for (var j=0; j<layout.length; j++) {
    for (var i=0; i<layout[j].length; i++) {
      currkeys[j][i].showLevel(idx);
    }
  }
  st.update();
}

//update sizes of objects relative to canvas size
function updateObjects() {
  st.removeAllChildren();
  currkeys = null;

  // var uh = c.height;
  var uh = c.height/3*2+c.height/4;
  var bh = c.height-uh;

  if (mode==0) {
    generateMouse(0,0,c.width,uh);
 } else {
   generateMouse(0,0,c.width,uh);
  //  generateKeyboard(0,0,c.width,uh);
  }
  generateFooter(0,uh,c.width,bh);

  st.update();
}

function toggleMode() {
  if (mode==0) {
    mode=1;
  } else {
    mode=0;
  }
  updateObjects();
}

function fullscreen() {
    if(c.webkitRequestFullScreen) { c.webkitRequestFullScreen(); }
    else { c.mozRequestFullScreen(); }
}

// Runs each time the DOM window resize event fires.
// Resets the canvas dimensions to match window, updates contents.
function resizeCanvas() {
  //low level
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  //update wrapper
  st.canvas.width = c.width;
  st.canvas.height = c.height;
  //update objects and redraw
   updateObjects();
}

function initialize() {
  document.body.addEventListener('touchmove', //prevent scrolling
      function(event) { event.preventDefault(); }, false);

  // Register an event listener to call the resizeCanvas() function
  // each time the window is resized.
  window.addEventListener('resize', resizeCanvas, false);

  //custom touch event handling because official loses events
  window.addEventListener('touchstart',function(evt){handleTouch('touchstart',evt)},false);
  window.addEventListener('touchmove',function(evt){handleTouch('touchmove',evt)},false);
  window.addEventListener('touchend',function(evt){handleTouch('touchend',evt)},false);

  //get info from stellarium every 0.5s
  //window.addEventListener('load', function () {
    //setInterval(fetchStatus, fetchInterval);
 // });
  //fetchStatus();

  resizeCanvas(); //adjust canvas size to window size the first time
}

function getShapeOwningTouch(touch) {
  var shape = null;
  for (var j=0; isdef(st.getChildAt(j)); j++) {
    var curr = st.getChildAt(j);
    if (!isdef(curr.touches))
      curr.touches = {};
    if (curr.touches[touch.identifier]===true) {
      shape = curr;
      break;
    }
  }
  return shape;
}
function getShapeBoundingTouch(touch) {
  var shape = null;
  for (var j=0; isdef(st.getChildAt(j)); j++) {
    var curr = st.getChildAt(j);
    var a = curr.getBounds();
    var x = touch.clientX;
    var y = touch.clientY;
    if (x>=a.x && x<=(a.x+a.width) && y>=a.y && y<=(a.y+a.height)) {
      shape = curr;
      break;
    }
  }
  return shape;
}

//own touch event dispatcher
function handleTouch(name, evt) {
  evt.preventDefault();
  //fetchStatus();
  var ts = evt.changedTouches;

  for (var i=0; i<ts.length; i++) {
    var t = ts[i];
    var victim = getShapeBoundingTouch(t);
    var owner = getShapeOwningTouch(t);
    //if we have no owning shape, use the effective shape below touch
    if (owner==null)
      owner = victim;

    if (name == 'touchstart') {
      if (!isdef(owner.touches))
        owner.touches = {};
      owner.touches[t.identifier] = true;
      if (isdef(victim.touchstart))
        owner.touchstart(t);
    } else if (name == 'touchmove') {
      if (isdef(victim.touchmove))
        owner.touchmove(t);
    } else if (name == 'touchend') {
      if (isdef(victim.touchend))
        owner.touchend(t);
      owner.touches[t.identifier] = false;
    }

  }
}
