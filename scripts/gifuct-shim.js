// Vendor shim: exposes gifuct-js 2.x function API behind the class API
// that public/js/tool.js expects (`new window.GIFuct(arrayBuffer)`).
import { parseGIF, decompressFrames } from 'gifuct-js';

class GIFuct {
  constructor(arrayBuffer) {
    this._parsed = parseGIF(arrayBuffer);
  }
  decompressFrames(buildImagePatches, maxFrames) {
    // tool.js calls `gif.decompressFrames(true)` (build patches flag).
    // 2.x signature: decompressFrames(parsed, maxFrames, buildImagePatches)
    return decompressFrames(this._parsed, maxFrames, buildImagePatches);
  }
}

window.GIFuct = GIFuct;