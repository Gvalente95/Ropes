var winSize = v2(window.innerWidth, window.innerHeight);
var winCenter = v2(winSize.x / 2, winSize.y / 2);
var mapSize = v2(5000, winSize.y * 1.5);
// var mapSize = winSize;
var groundLevel = mapSize.y * 0.8;
var grass = [];

var backgroundColor1 = getRandomColor();
var backgroundColor2 = getRandomColor();

var input = new Input();
var mouse = new Mouse();
var snakeBasketball = new SnakeBasketball();
var startPreset = platformGame;
let minimap = null;

let paused = false;
let showHovMenu = true;

//	COLLISIONS
var colGrid = null;
let collisionSegmentInteval = 2;
let colCellSize = window.innerWidth / 8;
let SelfCollisionsInterval = 4;
let showColAmount = false;
let overlapFactor = 1;
let ropeGroundFriction = 0.65;
let ropeShaker = 0;

//	ELEMENTS
let ropes = [];
let entities = [];
let shapes = [];
let airPushers = [];

//	SELECTION
let selSegment = null;
let hovSegment = null;
let selShape = null;
let hovShape = null;
let hovDirPusher = null;
let selDirPusher = null;
let selAirPusher = null;
let hovAirPusher = null;
let player = null;
let player2 = null;

//	ROPES GLOBAL PARAMS
let gravity = v2(0, 100);
let segAmount = 50;
let segSpace = 10;
let segThickness = 30;
let dampingFactor = 0.95;
let numOfConstraintsRuns = 50;
let showDots = false;
let showArrows = false;
let showAnchors = false;

// SHAPES
let shapeSize = v2(30, 30);

// TIME
let frame = 0;
let dt = 1;
let now = performance.now();
let curFps = 0;
let fps = 0;
let lastFpsTimer = performance.now();
