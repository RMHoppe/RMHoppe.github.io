// ============================================
// DoodleCar - Turn-Based Racing Game
// ============================================

// --- Configuration ---
const CONFIG = {
  GRID_WIDTH: 50,
  GRID_HEIGHT: 35,
  TILE_SIZE: 16,
  LAPS_TO_WIN: 1,
  // Start line horizontal: left post at (0.1*nx, 0.5*ny), right post at (0.1*nx+6, 0.5*ny)
  get START_LINE_X() { return Math.floor(this.GRID_WIDTH * 0.1); },
  get START_LINE_Y() { return Math.floor(this.GRID_HEIGHT * 0.5); },
  START_LINE_WIDTH: 6, // Width of start line in tiles (horizontal)
  INITIAL_VELOCITY: { x: 0, y: -2 }, // Initial velocity (going up)
};

// --- Game States ---
const GameState = {
  DRAWING_INNER: 'drawing_inner',
  DRAWING_OUTER: 'drawing_outer',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
};

// --- Logger ---
const Logger = {
  log: (className, methodName, ...args) => {
    console.log(`[${className}] ${methodName}`, ...args);
  }
};

// ============================================
// Grid Class
// ============================================
// Tile types
const TileType = {
  TRACK: 'track',      // Driveable track
  GRASS: 'grass',      // Outer area (grass)
  TIRES: 'tires',      // Inner area (tire stacks)
};

class Grid {
  constructor(width, height, tileSize) {
    Logger.log('Grid', 'constructor', width, height, tileSize);
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tiles = [];
    this.init();
  }

  init() {
    Logger.log('Grid', 'init');
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = TileType.TRACK; // All tiles start as track
      }
    }
  }

  isEnabled(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const isTrack = this.tiles[y][x] === TileType.TRACK;
    Logger.log('Grid', 'isEnabled', x, y, '=>', isTrack);
    return isTrack;
  }

  setTileType(x, y, type) {
    Logger.log('Grid', 'setTileType', x, y, type);
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = type;
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.tiles[y][x];
  }

  // Keep for compatibility
  setEnabled(x, y, enabled) {
    // This will be overridden by specific tile type setting
  }

  screenToGrid(screenX, screenY) {
    return {
      x: Math.floor(screenX / this.tileSize),
      y: Math.floor(screenY / this.tileSize),
    };
  }

  gridToScreen(gridX, gridY) {
    return {
      x: gridX * this.tileSize,
      y: gridY * this.tileSize,
    };
  }

  draw(ctx) {
    const ts = this.tileSize;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const sx = x * ts;
        const sy = y * ts;
        const tileType = this.tiles[y][x];

        if (tileType === TileType.GRASS) {
          // Grass pattern
          ctx.fillStyle = (x + y) % 2 === 0 ? '#7CB342' : '#8BC34A';
          ctx.fillRect(sx, sy, ts, ts);
          // Grass blades (subtle)
          ctx.strokeStyle = '#689F38';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const bx = sx + 3 + i * 5;
            const by = sy + ts - 2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 1, by - 4);
            ctx.stroke();
          }
        } else if (tileType === TileType.TIRES) {
          // Tire stack pattern
          ctx.fillStyle = '#455A64';
          ctx.fillRect(sx, sy, ts, ts);
          // Draw tire circles
          ctx.fillStyle = '#37474F';
          ctx.strokeStyle = '#263238';
          ctx.lineWidth = 1;
          const r = ts * 0.35;
          ctx.beginPath();
          ctx.arc(sx + ts / 2, sy + ts / 2, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Inner circle
          ctx.fillStyle = '#546E7A';
          ctx.beginPath();
          ctx.arc(sx + ts / 2, sy + ts / 2, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Track (asphalt-like)
          ctx.fillStyle = '#E8E0D5';
          ctx.fillRect(sx, sy, ts, ts);
        }

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, ts, ts);
      }
    }
  }
}

// ============================================
// Car Class
// ============================================
class Car {
  constructor(id, color, startX, startY) {
    this.id = id;
    this.color = color;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.laps = 0;
    this.crossedStart = false; // For lap detection
    this.isSkippingTurn = false;
    this.moveHistory = []; // Array of {from: {x,y}, to: {x,y}}
  }

  getLandingTile() {
    return {
      x: this.x + this.vx,
      y: this.y + this.vy,
    };
  }

  getValidMoves(grid) {
    Logger.log('Car', 'getValidMoves', this.id);
    const landing = this.getLandingTile();
    const moves = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = landing.x + dx;
        const ny = landing.y + dy;

        if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
          moves.push({
            x: nx,
            y: ny,
            isOffTrack: !grid.isEnabled(nx, ny)
          });
        }
      }
    }
    return moves;
  }

  moveTo(newX, newY) {
    Logger.log('Car', 'moveTo', this.id, newX, newY);
    this.moveHistory.push({
      from: { x: this.x, y: this.y },
      to: { x: newX, y: newY }
    });
    this.vx = newX - this.x;
    this.vy = newY - this.y;
    this.x = newX;
    this.y = newY;
  }

  reset(startX, startY, initialVx = 0, initialVy = 0) {
    Logger.log('Car', 'reset', this.id, startX, startY);
    this.x = startX;
    this.y = startY;
    this.vx = initialVx;
    this.vy = initialVy;
    this.crossedStart = false;
    this.isSkippingTurn = false;
    this.moveHistory = [];
  }

  drawHistory(ctx, tileSize) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 3; // Thicker line
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.3; // Fainter history arrows

    this.moveHistory.forEach(move => {
      const fromX = move.from.x * tileSize + tileSize / 2;
      const fromY = move.from.y * tileSize + tileSize / 2;
      const toX = move.to.x * tileSize + tileSize / 2;
      const toY = move.to.y * tileSize + tileSize / 2;

      // Draw dashed line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLen = 8;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    });
    ctx.restore();
  }

  draw(ctx, tileSize) {
    const cx = this.x * tileSize + tileSize / 2;
    const cy = this.y * tileSize + tileSize / 2;

    // Calculate rotation based on velocity
    let angle = 0;
    if (this.vx !== 0 || this.vy !== 0) {
      angle = Math.atan2(this.vy, this.vx) + Math.PI / 2; // +90deg so car points in direction
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Car dimensions
    const carLength = tileSize * 1.2;
    const carWidth = tileSize * 0.75;

    // Tires
    ctx.fillStyle = '#333';
    const tireW = carWidth * 0.3;
    const tireH = carLength * 0.25;
    const tireXOffset = carWidth / 2 - tireW / 2;
    const tireYOffset = carLength / 2 - tireH;

    // Front tires
    ctx.beginPath();
    ctx.roundRect(-tireXOffset - tireW, -carLength / 2 + 2, tireW, tireH, 2);
    ctx.roundRect(tireXOffset, -carLength / 2 + 2, tireW, tireH, 2);
    // Rear tires
    ctx.roundRect(-tireXOffset - tireW, tireYOffset - 2, tireW, tireH, 2);
    ctx.roundRect(tireXOffset, tireYOffset - 2, tireW, tireH, 2);
    ctx.fill();

    // Car body (rounded rectangle)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-carWidth / 2, -carLength / 2, carWidth, carLength, 3);
    ctx.fill();

    // Windshield (darker area at front)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-carWidth / 2 + 2, -carLength / 2 + 2, carWidth - 4, carLength * 0.25);

    // Rear spoiler
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-carWidth / 2, carLength / 2 - 3, carWidth, 3);

    ctx.restore();
  }
}

// ============================================
// TrackDrawer Class
// ============================================
class TrackDrawer {
  constructor(grid) {
    this.grid = grid;
    this.points = [];
    this.isDrawing = false;
    this.innerPolygon = null;
    this.outerPolygon = null;
  }

  startDrawing(x, y) {
    Logger.log('TrackDrawer', 'startDrawing', x, y);
    this.points = [{ x, y }];
    this.isDrawing = true;
  }

  addPoint(x, y) {
    if (this.isDrawing) {
      Logger.log('TrackDrawer', 'addPoint', x, y);
      const last = this.points[this.points.length - 1];
      // Only add if moved enough distance
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist > 5) {
        this.points.push({ x, y });
      }
    }
  }

  finishDrawing() {
    Logger.log('TrackDrawer', 'finishDrawing');
    this.isDrawing = false;
    if (this.points.length > 2) {
      // Close the polygon
      this.points.push({ ...this.points[0] });
      return [...this.points];
    }
    return null;
  }

  // Point-in-polygon using ray casting algorithm
  isPointInPolygon(px, py, polygon) {
    if (!polygon || polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      if (((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  applyInnerPolygon(polygon) {
    Logger.log('TrackDrawer', 'applyInnerPolygon');
    this.innerPolygon = polygon;
    const tileSize = this.grid.tileSize;

    // Set all tiles INSIDE the polygon to GRASS temporarily
    // (will be converted to TIRES if adjacent to track after outer polygon)
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const cx = x * tileSize + tileSize / 2;
        const cy = y * tileSize + tileSize / 2;
        if (this.isPointInPolygon(cx, cy, polygon)) {
          this.grid.setTileType(x, y, TileType.GRASS);
        }
      }
    }
  }

  applyOuterPolygon(polygon) {
    Logger.log('TrackDrawer', 'applyOuterPolygon');
    this.outerPolygon = polygon;
    const tileSize = this.grid.tileSize;

    // Set all tiles OUTSIDE the polygon to GRASS
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const cx = x * tileSize + tileSize / 2;
        const cy = y * tileSize + tileSize / 2;
        if (!this.isPointInPolygon(cx, cy, polygon)) {
          this.grid.setTileType(x, y, TileType.GRASS);
        }
      }
    }

    // Now convert GRASS tiles that are adjacent to TRACK tiles into TIRES
    this.applyTireEdges();
  }

  applyTireEdges() {
    // Find all GRASS tiles adjacent to TRACK tiles and mark them as TIRES
    const adjacentToTrack = [];

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        if (this.grid.tiles[y][x] === TileType.GRASS) {
          // Check all 8 neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < this.grid.width && ny >= 0 && ny < this.grid.height) {
                if (this.grid.tiles[ny][nx] === TileType.TRACK) {
                  adjacentToTrack.push({ x, y });
                  break;
                }
              }
            }
            if (adjacentToTrack.length > 0 &&
              adjacentToTrack[adjacentToTrack.length - 1].x === x &&
              adjacentToTrack[adjacentToTrack.length - 1].y === y) {
              break;
            }
          }
        }
      }
    }

    // Set all adjacent tiles to TIRES
    adjacentToTrack.forEach(({ x, y }) => {
      this.grid.setTileType(x, y, TileType.TIRES);
    });
  }

  drawCurrentPath(ctx) {
    if (this.points.length < 2) return;

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  reset() {
    this.points = [];
    this.isDrawing = false;
    this.innerPolygon = null;
    this.outerPolygon = null;
  }
}

// ============================================
// Game Class
// ============================================
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Set canvas size
    this.canvas.width = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
    this.canvas.height = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;

    // Initialize components
    this.grid = new Grid(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT, CONFIG.TILE_SIZE);
    this.trackDrawer = new TrackDrawer(this.grid);

    // Start line is horizontal at 10% X, 50% Y, spanning 6 tiles
    this.startLineX = CONFIG.START_LINE_X;
    this.startLineY = CONFIG.START_LINE_Y;

    // Cars start ON the start line, side by side
    this.startY = CONFIG.START_LINE_Y;
    this.startX1 = this.startLineX + 2;
    this.startX2 = this.startLineX + 4;

    // Post positions (left and right ends of horizontal start line)
    this.leftPostX = this.startLineX - 1;
    this.rightPostX = this.startLineX + CONFIG.START_LINE_WIDTH;
    this.postY = CONFIG.START_LINE_Y;

    // Cars with initial velocity (going down)
    this.cars = [
      new Car(1, '#8E24AA', this.startX1, this.startY),
      new Car(2, '#1E88E5', this.startX2, this.startY),
    ];
    // Set initial velocity for both cars
    this.cars[0].vx = CONFIG.INITIAL_VELOCITY.x;
    this.cars[0].vy = CONFIG.INITIAL_VELOCITY.y;
    this.cars[1].vx = CONFIG.INITIAL_VELOCITY.x;
    this.cars[1].vy = CONFIG.INITIAL_VELOCITY.y;

    this.currentPlayer = 0;
    this.state = GameState.DRAWING_INNER;
    this.validMoves = [];
    this.hoveredTile = null;

    // UI elements
    this.instructionsPanel = document.getElementById('instructions');
    this.instructionText = document.getElementById('instruction-text');
    this.currentPlayerDisplay = document.getElementById('current-player');
    this.gameoverPanel = document.getElementById('gameover-overlay');
    this.winnerText = document.getElementById('winner-text');

    this.setupEventListeners();
    this.updateUI();
    this.render();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onMouseUp({});
    });

    // Buttons
    document.getElementById('restart-btn').addEventListener('click', () => this.reset());
    document.getElementById('reset-btn').addEventListener('click', () => this.reset());
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  onMouseDown(e) {
    const pos = this.getMousePos(e);
    const gridPos = this.grid.screenToGrid(pos.x, pos.y);
    Logger.log('Game', 'onMouseDown', gridPos.x, gridPos.y, 'State:', this.state);

    if (this.state === GameState.DRAWING_INNER) {
      // Must start from right post (for inner polygon)
      if (gridPos.x === this.rightPostX && gridPos.y === this.postY) {
        this.trackDrawer.startDrawing(pos.x, pos.y);
      }
    } else if (this.state === GameState.DRAWING_OUTER) {
      // Must start from left post (for outer polygon)
      if (gridPos.x === this.leftPostX && gridPos.y === this.postY) {
        this.trackDrawer.startDrawing(pos.x, pos.y);
      }
    } else if (this.state === GameState.PLAYING) {
      this.tryMove(gridPos.x, gridPos.y);
    }
  }

  onMouseMove(e) {
    const pos = this.getMousePos(e);

    if (this.state === GameState.DRAWING_INNER || this.state === GameState.DRAWING_OUTER) {
      this.trackDrawer.addPoint(pos.x, pos.y);
    }

    // Update hovered tile for playing state
    if (this.state === GameState.PLAYING) {
      const gridPos = this.grid.screenToGrid(pos.x, pos.y);
      this.hoveredTile = gridPos;
    }

    this.render();
  }

  onMouseUp(e) {
    if (this.state === GameState.DRAWING_INNER) {
      const polygon = this.trackDrawer.finishDrawing();
      if (polygon) {
        this.trackDrawer.applyInnerPolygon(polygon);
        this.state = GameState.DRAWING_OUTER;
        this.trackDrawer.points = [];
        this.updateUI();
      }
    } else if (this.state === GameState.DRAWING_OUTER) {
      const polygon = this.trackDrawer.finishDrawing();
      if (polygon) {
        this.trackDrawer.applyOuterPolygon(polygon);
        this.state = GameState.PLAYING;
        this.updateValidMoves();
        this.updateUI();
      }
    }
    this.render();
  }

  onMouseLeave() {
    this.hoveredTile = null;
    this.render();
  }

  tryMove(x, y) {
    Logger.log('Game', 'tryMove', x, y, 'Player:', this.currentPlayer + 1);
    const isValidMove = this.validMoves.some(m => m.x === x && m.y === y);
    if (!isValidMove) return;

    const car = this.cars[this.currentPlayer];
    const prevY = car.y;
    const impact = this.findImpactPoint(car.x, car.y, x, y);
    car.isSkippingTurn = impact.x !== x || impact.y !== y;
    car.moveTo(impact.x, impact.y);

    // Lap detection
    this.checkLapProgress(car, prevY);

    // Check win
    if (car.laps >= CONFIG.LAPS_TO_WIN) {
      Logger.log('Game', 'WIN detected', 'Player:', car.id);
      this.state = GameState.GAME_OVER;
      this.winnerText.textContent = `Player ${car.id} Wins!`;
      this.gameoverPanel.classList.remove('hidden');
      this.updateUI();
      this.render();
      return;
    }

    // Switch player
    this.currentPlayer = (this.currentPlayer + 1) % 2;
    this.updateValidMoves();
    this.updateUI();
    this.render();
  }

  findImpactPoint(startX, startY, endX, endY) {
    Logger.log('Game', 'findImpactPoint', startX, startY, '=>', endX, endY);
    // Simple line traversal to find last track tile
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = (startX < endX) ? 1 : -1;
    const sy = (startY < endY) ? 1 : -1;
    let err = dx - dy;

    let currX = startX;
    let currY = startY;
    let lastTrackX = startX;
    let lastTrackY = startY;

    while (true) {
      if (currX === endX && currY === endY) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currY += sy;
      }

      // If we hit a non-track tile, stop and return the last valid one
      if (this.grid.getTile(currX, currY) !== TileType.TRACK) {
        break;
      }
      lastTrackX = currX;
      lastTrackY = currY;
    }

    return { x: lastTrackX, y: lastTrackY };
  }

  checkLapProgress(car, prevY) {
    Logger.log('Game', 'checkLapProgress', 'Player:', car.id, 'prevY:', prevY, 'currY:', car.y);
    const startY = CONFIG.START_LINE_Y;
    const startX = this.startLineX;
    const endX = startX + CONFIG.START_LINE_WIDTH;

    // Check if car is within the horizontal bounds of the start line
    const isInLineX = car.x >= startX && car.x < endX;

    // Upward crossing: moving from at/below to above
    const crossedUpward = prevY >= startY && car.y < startY;
    // Downward crossing: moving from above to at/below
    const crossedDownward = prevY < startY && car.y >= startY;

    if (isInLineX) {
      if (crossedUpward) {
        if (car.crossedStart) {
          car.laps++;
          Logger.log('Game', 'LAP COMPLETED', 'Player:', car.id, 'Total:', car.laps);
        }
        car.crossedStart = true;
      } else if (crossedDownward) {
        // If they go back across the line, reset their "starting" state
        // to prevent counting multiple laps by oscillating
        car.crossedStart = false;
        Logger.log('Game', 'BACKWARD crossing', 'Player:', car.id);
      }
    }
  }

  updateValidMoves() {
    Logger.log('Game', 'updateValidMoves', 'Player:', this.currentPlayer + 1);
    let car = this.cars[this.currentPlayer];

    // Handle skip turn (with safety check to prevent infinite loop)
    let skipCounter = 0;
    while (car.isSkippingTurn && skipCounter < 2) {
      Logger.log('Game', 'SKIPPING TURN', 'Player:', this.currentPlayer + 1);
      car.isSkippingTurn = false;
      this.currentPlayer = (this.currentPlayer + 1) % 2;
      car = this.cars[this.currentPlayer];
      skipCounter++;
    }

    this.validMoves = car.getValidMoves(this.grid);

    // If a car has NO possible moves (even off-track), it hits the world boundary
    if (this.validMoves.length === 0) {
      Logger.log('Game', 'NO VALID MOVES (boundary hit)', 'Player:', this.currentPlayer + 1);
      const landing = car.getLandingTile();
      // Clamp to grid boundaries for the "crash target"
      const targetX = Math.max(0, Math.min(CONFIG.GRID_WIDTH - 1, landing.x));
      const targetY = Math.max(0, Math.min(CONFIG.GRID_HEIGHT - 1, landing.y));

      // Find where they actually hit the wall
      const impact = this.findImpactPoint(car.x, car.y, targetX, targetY);

      // Move to impact point and record in history
      car.moveTo(impact.x, impact.y);

      // Reset velocity and flag for skip
      car.vx = 0;
      car.vy = 0;
      car.isSkippingTurn = true;

      // Re-run for the other player
      this.currentPlayer = (this.currentPlayer + 1) % 2;
      this.updateValidMoves();
    }
  }

  updateUI() {
    // Instructions
    if (this.state === GameState.DRAWING_INNER) {
      this.instructionsPanel.classList.remove('hidden');
      this.instructionText.textContent = 'Click GREEN post (right) to draw inner boundary';
    } else if (this.state === GameState.DRAWING_OUTER) {
      this.instructionsPanel.classList.remove('hidden');
      this.instructionText.textContent = 'Click ORANGE post (left) to draw outer boundary';
    } else if (this.state === GameState.PLAYING) {
      this.instructionsPanel.classList.add('hidden');
    }

    // Lap counts
    document.getElementById('p1-laps').textContent = this.cars[0].laps;
    document.getElementById('p2-laps').textContent = this.cars[1].laps;
    document.getElementById('p1-max-laps').textContent = CONFIG.LAPS_TO_WIN;
    document.getElementById('p2-max-laps').textContent = CONFIG.LAPS_TO_WIN;

    // Current player indicator
    if (this.currentPlayerDisplay) {
      this.currentPlayerDisplay.textContent = `Player ${this.currentPlayer + 1}`;
      this.currentPlayerDisplay.className = `current-player player${this.currentPlayer + 1}`;
    }
  }

  render() {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.grid.draw(this.ctx);

    // Draw start/finish line
    this.drawStartLine();

    // Draw current drawing path
    if (this.state === GameState.DRAWING_INNER || this.state === GameState.DRAWING_OUTER) {
      this.trackDrawer.drawCurrentPath(this.ctx);
    }

    // Draw game elements when playing
    if (this.state === GameState.PLAYING || this.state === GameState.GAME_OVER) {
      // Draw valid moves first
      this.drawValidMoves();

      // Draw move history for all cars ON TOP of valid moves
      this.cars.forEach(car => car.drawHistory(this.ctx, this.grid.tileSize));

      // Draw velocity arrow
      this.drawVelocityArrow();

      // Draw cars
      this.cars.forEach(car => car.draw(this.ctx, this.grid.tileSize));
    }
  }

  drawStartLine() {
    const tileSize = this.grid.tileSize;
    const startX = this.startLineX * tileSize;
    const startY = CONFIG.START_LINE_Y * tileSize;

    // Checkered pattern for horizontal start/finish line
    for (let i = 0; i < CONFIG.START_LINE_WIDTH; i++) {
      for (let j = 0; j < 2; j++) {
        const px = (this.startLineX + i) * tileSize + (j * tileSize / 2);
        const py = startY;
        this.ctx.fillStyle = (i + j) % 2 === 0 ? '#2c3e50' : '#ecf0f1';
        this.ctx.fillRect(px, py, tileSize / 2, tileSize);
      }
    }

    // Border
    this.ctx.strokeStyle = '#9b59b6';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(startX, startY, CONFIG.START_LINE_WIDTH * tileSize, tileSize);

    // Left Post (Orange) - for outer polygon
    const leftPostColor = this.state === GameState.DRAWING_OUTER ? '#e67e22' : '#f39c12';
    this.ctx.fillStyle = leftPostColor;
    this.ctx.fillRect(this.leftPostX * tileSize, this.postY * tileSize, tileSize, tileSize);
    this.ctx.strokeStyle = '#d35400';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.leftPostX * tileSize, this.postY * tileSize, tileSize, tileSize);

    // Right Post (Green) - for inner polygon
    const rightPostColor = this.state === GameState.DRAWING_INNER ? '#27ae60' : '#2ecc71';
    this.ctx.fillStyle = rightPostColor;
    this.ctx.fillRect(this.rightPostX * tileSize, this.postY * tileSize, tileSize, tileSize);
    this.ctx.strokeStyle = '#1e8449';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.rightPostX * tileSize, this.postY * tileSize, tileSize, tileSize);

    // Start/Finish label (above the line)
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.font = 'bold 8px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START', startX + (CONFIG.START_LINE_WIDTH * tileSize) / 2, startY - 4);
  }

  drawValidMoves() {
    const tileSize = this.grid.tileSize;
    const car = this.cars[this.currentPlayer];
    const playerColor = car.color;

    this.validMoves.forEach(move => {
      const sx = move.x * tileSize;
      const sy = move.y * tileSize;

      // Check if hovered
      const isHovered = this.hoveredTile &&
        this.hoveredTile.x === move.x &&
        this.hoveredTile.y === move.y;

      if (move.isOffTrack) {
        // "Disabled" / Crash Tiles: Red-ish and semi-transparent
        this.ctx.fillStyle = isHovered ? 'rgba(231, 76, 60, 0.5)' : 'rgba(231, 76, 60, 0.2)';
        this.ctx.fillRect(sx + 2, sy + 2, tileSize - 4, tileSize - 4);
        if (isHovered) {
          this.ctx.strokeStyle = '#e74c3c';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(sx + 2, sy + 2, tileSize - 4, tileSize - 4);
        }
      } else {
        // Normal Track Moves: Player color
        this.ctx.fillStyle = playerColor + (isHovered ? 'B3' : '66'); // Add alpha hex
        this.ctx.fillRect(sx + 2, sy + 2, tileSize - 4, tileSize - 4);

        if (isHovered) {
          this.ctx.strokeStyle = playerColor;
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(sx + 2, sy + 2, tileSize - 4, tileSize - 4);
        }
      }
    });
  }

  drawLandingTile() {
    const car = this.cars[this.currentPlayer];
    const landing = car.getLandingTile();
    const tileSize = this.grid.tileSize;
    const sx = landing.x * tileSize;
    const sy = landing.y * tileSize;

    // Yellow indicator for landing tile
    this.ctx.fillStyle = 'rgba(241, 196, 15, 0.6)';
    this.ctx.fillRect(sx, sy, tileSize, tileSize);
    this.ctx.strokeStyle = '#f39c12';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(sx, sy, tileSize, tileSize);

    // Crosshair
    this.ctx.strokeStyle = '#e67e22';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(sx + tileSize / 2, sy + 2);
    this.ctx.lineTo(sx + tileSize / 2, sy + tileSize - 2);
    this.ctx.moveTo(sx + 2, sy + tileSize / 2);
    this.ctx.lineTo(sx + tileSize - 2, sy + tileSize / 2);
    this.ctx.stroke();
  }

  drawVelocityArrow() {
    const car = this.cars[this.currentPlayer];
    const landing = car.getLandingTile();
    const tileSize = this.grid.tileSize;

    const startX = car.x * tileSize + tileSize / 2;
    const startY = car.y * tileSize + tileSize / 2;
    const endX = landing.x * tileSize + tileSize / 2;
    const endY = landing.y * tileSize + tileSize / 2;

    // Only draw if there's actual velocity
    if (car.vx === 0 && car.vy === 0) return;

    // Arrow line
    this.ctx.strokeStyle = car.color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLen = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
    this.ctx.stroke();
  }

  reset() {
    Logger.log('Game', 'reset');
    this.grid.init();
    this.trackDrawer.reset();
    this.cars[0].reset(this.startX1, this.startY, CONFIG.INITIAL_VELOCITY.x, CONFIG.INITIAL_VELOCITY.y);
    this.cars[1].reset(this.startX2, this.startY, CONFIG.INITIAL_VELOCITY.x, CONFIG.INITIAL_VELOCITY.y);
    this.cars[0].laps = 0;
    this.cars[1].laps = 0;
    this.currentPlayer = 0;
    this.state = GameState.DRAWING_INNER;
    this.validMoves = [];
    this.gameoverPanel.classList.add('hidden');
    this.updateUI();
    this.render();
  }
}

// ============================================
// Initialize Game
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  window.game = new Game(canvas);
});
