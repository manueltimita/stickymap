const Tile = require('./tile');
const TileLayerLoadError = require('./errors').TileLayerLoadError;
const bbox = require('./bbox');
const merc = require('./merc');
const xyz = require('./xyz');

function TileLayer(config) {
  this.id = config.id;
  this.bbox = config.bbox;
  this.layerBbox = config.layerBbox;
  this.resolution = config.resolution;
  this.context = config.context;
  this.urls = config.urls;
  this.onTileLoad = config.onTileLoad;
  this.onLoad = config.onLoad;
  this.maxZoom = config.maxZoom;
  this.loadedTiles = [];
  this.errors = [];
}

TileLayer.prototype.load = function() {
  let z = xyz.getZ(this.resolution);
  if (!isNaN(this.maxZoom) && z > this.maxZoom) {
    z = this.maxZoom;
  }
  const range = xyz.getRange(bbox.intersect(this.bbox, this.layerBbox), z);
  this.loading = 0;
  const handleTileLoad = this.handleTileLoad.bind(this);
  for (let x = range.minX; x <= range.maxX; ++x) {
    for (let y = range.minY; y <= range.maxY; ++y) {
      ++this.loading;
      const tile = new Tile(this.urls, x, y, z);
      tile.load(handleTileLoad);
    }
  }
};

TileLayer.prototype.handleTileLoad = function(error, tile) {
  if (error) {
    this.errors.push(error);
  }
  --this.loading;
  if (tile) {
    this.loadedTiles.push(tile);
    if (this.onTileLoad) {
      this.onTileLoad(error);
    }
  }
  if (this.loading <= 0 && this.onLoad) {
    let loadError;
    if (this.errors.length > 0) {
      loadError = new TileLayerLoadError(
        'Layer failed to load completely',
        this
      );
    }
    this.onLoad(loadError);
  }
};

TileLayer.prototype.render = function() {
  const numLoadedTiles = this.loadedTiles.length;
  if (!numLoadedTiles) {
    return;
  }
  let z = xyz.getZ(this.resolution);
  if (!isNaN(this.maxZoom) && z > this.maxZoom) {
    z = this.maxZoom;
  }
  const tileResolution = xyz.getResolution(z);
  const scale = tileResolution / this.resolution;
  this.context.save();
  this.context.scale(scale, scale);

  const offsetX = (this.bbox[0] + merc.EDGE) / tileResolution;
  const offsetY = (merc.EDGE - this.bbox[3]) / tileResolution;
  this.context.translate(-offsetX, -offsetY);

  for (let i = 0; i < numLoadedTiles; ++i) {
    const tile = this.loadedTiles[i];
    const dx = tile.x * xyz.SIZE;
    const dy = tile.y * xyz.SIZE;
    this.context.drawImage(tile.image, dx, dy);
  }
  this.context.restore();
};

module.exports = TileLayer;
