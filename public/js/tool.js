(function() {
  'use strict';

  // ── DOM refs ──
  var dropZone = document.getElementById('drop-zone');
  var fileInput = document.getElementById('file-input');
  var uploadPrompt = document.getElementById('upload-prompt');
  var uploadPreview = document.getElementById('upload-preview');
  var resultImage = document.getElementById('result-image');
  var resultEmpty = document.getElementById('result-empty');
  var sizeBadge = document.getElementById('size-badge');
  var origSizeEl = document.getElementById('orig-size');
  var newSizeEl = document.getElementById('new-size');
  var reductionPct = document.getElementById('reduction-pct');
  var procTimeEl = document.getElementById('proc-time');
  var controls = document.getElementById('controls');
  var qualitySlider = document.getElementById('quality-slider');
  var qualityValue = document.getElementById('quality-value');
  var downloadBtn = document.getElementById('download-btn');
  var copyBtn = document.getElementById('copy-img-btn');
  var resetBtn = document.getElementById('reset-btn');
  var advancedToggle = document.getElementById('advanced-toggle');
  var advancedPanel = document.getElementById('advanced-panel');
  var advChevron = document.getElementById('adv-chevron');
  var batchPanel = document.getElementById('batch-panel');
  var batchGrid = document.getElementById('batch-grid');
  var batchCount = document.getElementById('batch-count');
  var batchDownloadAll = document.getElementById('batch-download-all');
  var targetSizeInput = document.getElementById('target-size-input');
  var targetSizeApply = document.getElementById('target-size-apply');
  var targetSizeClear = document.getElementById('target-size-clear');
  var targetSizeStatus = document.getElementById('target-size-status');

  // ── State ──
  var originalImage = null;
  var originalBlob = null;
  var processedBlob = null;
  var processedUrl = null;
  var currentFormat = 'jpeg';
  var pixelVal = 1, noiseVal = 0, blurVal = 0, brightnessVal = 0;
  var batchFiles = [];
  var batchResults = [];
  var rafId = null;
  var isGif = false;
  var gifFrames = null;
  var gifAnimId = null;

  // ── Format helpers ──
  function fmtBytes(b) { return b < 1024 ? b + ' B' : (b / 1024).toFixed(1) + ' KB'; }
  function mime(format) { return format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg'; }
  function ext(format) { return format === 'webp' ? 'webp' : format === 'png' ? 'png' : 'jpg'; }

  // ── Show state ──
  function enableControls() {
    controls.classList.remove('opacity-40', 'pointer-events-none');
    downloadBtn.disabled = false;
    copyBtn.disabled = false;
  }

  // ── Load image from File ──
  function loadImage(file) {
    return new Promise(function(resolve, reject) {
      var blobUrl = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function() { resolve({ img: img, blob: file }); };
      img.onerror = reject;
      img.src = blobUrl;
    });
  }

  // ── Core processing pipeline ──
  function processImage(img, quality, pixel, noise, blur, brightness, format, presetLabel) {
    var t0 = performance.now();
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // Step 1: Pixelation
    if (pixel > 1) {
      var pw = Math.max(1, Math.floor(w / pixel));
      var ph = Math.max(1, Math.floor(h / pixel));
      var tmp = document.createElement('canvas'); tmp.width = pw; tmp.height = ph;
      tmp.getContext('2d').drawImage(canvas, 0, 0, pw, ph);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tmp, 0, 0, pw, ph, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
    }

    // Step 2: Blur (downscale-upscale)
    if (blur > 0) {
      var scale = Math.max(0.05, 1 - (blur / 20) * 0.95);
      var bw = Math.max(1, Math.floor(w * scale));
      var bh = Math.max(1, Math.floor(h * scale));
      var tmp = document.createElement('canvas'); tmp.width = bw; tmp.height = bh;
      tmp.getContext('2d').drawImage(canvas, 0, 0, bw, bh);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tmp, 0, 0, bw, bh, 0, 0, w, h);
    }

    // Step 3: Noise
    if (noise > 0) {
      var id = ctx.getImageData(0, 0, w, h);
      var d = id.data;
      var intensity = noise * 2.55;
      for (var i = 0; i < d.length; i += 4) {
        var n = (Math.random() - 0.5) * intensity * 2;
        d[i]     = Math.min(255, Math.max(0, d[i]     + n));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
      }
      ctx.putImageData(id, 0, 0);
    }

    // Step 4: Brightness
    if (brightness !== 0) {
      var id = ctx.getImageData(0, 0, w, h);
      var d = id.data;
      var bv = brightness * 2.55;
      for (var i = 0; i < d.length; i += 4) {
        d[i]     = Math.min(255, Math.max(0, d[i]     + bv));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + bv));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + bv));
      }
      ctx.putImageData(id, 0, 0);
    }

    // Step 5: Preset-specific overlays
    if (presetLabel === 'nuked') {
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(255,255,200,0.3)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    } else if (presetLabel === 'crt') {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (var y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    } else if (presetLabel === 'vintage') {
      ctx.fillStyle = 'rgba(100,150,255,0.1)';
      ctx.fillRect(0, 0, w, h);
    }

    return new Promise(function(resolve) {
      canvas.toBlob(function(blob) {
        var elapsed = (performance.now() - t0).toFixed(1);
        resolve({ blob: blob, url: URL.createObjectURL(blob), size: blob.size, time: elapsed, canvas: canvas });
      }, mime(format), quality / 100);
    });
  }

  // ── Binary search for target file size ──
  async function autoMatchTarget(img, targetKB, pixel, noise, blur, brightness, format) {
    var targetBytes = targetKB * 1024;
    var lo = 1, hi = 100, bestQ = 1;
    var bestResult = null;

    for (var iter = 0; iter < 9; iter++) {
      var mid = Math.floor((lo + hi) / 2);
      var result = await processImage(img, mid, pixel, noise, blur, brightness, format, '');
      if (result.size <= targetBytes) {
        bestQ = mid;
        bestResult = result;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (!bestResult) {
      bestResult = await processImage(img, 1, pixel, noise, blur, brightness, format, '');
      bestQ = 1;
    }

    return { result: bestResult, quality: bestQ };
  }

  // ── GIF support ──
  function parseGifFrames(arrayBuffer) {
    var gif = new window.GIFuct(arrayBuffer);
    var frames = gif.decompressFrames(true);
    return frames;
  }

  function drawGifFrame(frame, ctx, w, h) {
    var imageData = ctx.createImageData(w, h);
    imageData.data.set(frame.patch);
    ctx.putImageData(imageData, frame.dims.left, frame.dims.top);
  }

  function stopGifPreview() {
    if (gifAnimId) { cancelAnimationFrame(gifAnimId); gifAnimId = null; }
  }

  function startGifPreview() {
    if (!gifFrames || gifFrames.length === 0) return;
    stopGifPreview();
    var w = gifFrames[0].dims.width;
    var h = gifFrames[0].dims.height;
    var offscreen = document.createElement('canvas');
    offscreen.width = w; offscreen.height = h;
    var octx = offscreen.getContext('2d');
    var prevCtx = null;

    function renderFrame(frameIdx) {
      var frame = gifFrames[frameIdx];
      var pixel = pixelVal, noise = noiseVal, blur = blurVal, brightness = brightnessVal;

      // Apply effects to this frame
      var fc = document.createElement('canvas'); fc.width = w; fc.height = h;
      var fctx = fc.getContext('2d');

      // Handle disposal: clear if needed
      if (frame.disposalType === 2) { octx.clearRect(0, 0, w, h); }
      drawGifFrame(frame, octx, w, h);

      // Draw current state to working canvas
      fctx.drawImage(offscreen, 0, 0, w, h);

      // Apply pixelation
      if (pixel > 1) {
        var pw = Math.max(1, Math.floor(w / pixel));
        var ph = Math.max(1, Math.floor(h / pixel));
        var tmp = document.createElement('canvas'); tmp.width = pw; tmp.height = ph;
        tmp.getContext('2d').drawImage(fc, 0, 0, pw, ph);
        fctx.imageSmoothingEnabled = false;
        fctx.clearRect(0, 0, w, h);
        fctx.drawImage(tmp, 0, 0, pw, ph, 0, 0, w, h);
        fctx.imageSmoothingEnabled = true;
      }
      // Apply blur
      if (blur > 0) {
        var scale = Math.max(0.05, 1 - (blur / 20) * 0.95);
        var bw = Math.max(1, Math.floor(w * scale));
        var bh = Math.max(1, Math.floor(h * scale));
        var tmp = document.createElement('canvas'); tmp.width = bw; tmp.height = bh;
        tmp.getContext('2d').drawImage(fc, 0, 0, bw, bh);
        fctx.clearRect(0, 0, w, h);
        fctx.drawImage(tmp, 0, 0, bw, bh, 0, 0, w, h);
      }
      // Apply noise
      if (noise > 0) {
        var id = fctx.getImageData(0, 0, w, h);
        var d = id.data;
        var intensity = noise * 2.55;
        for (var i = 0; i < d.length; i += 4) {
          var n = (Math.random() - 0.5) * intensity * 2;
          d[i] = Math.min(255, Math.max(0, d[i] + n));
          d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
          d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
        }
        fctx.putImageData(id, 0, 0);
      }
      // Apply brightness
      if (brightness !== 0) {
        var id = fctx.getImageData(0, 0, w, h);
        var d = id.data;
        var bv = brightness * 2.55;
        for (var i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, d[i] + bv));
          d[i+1] = Math.min(255, Math.max(0, d[i+1] + bv));
          d[i+2] = Math.min(255, Math.max(0, d[i+2] + bv));
        }
        fctx.putImageData(id, 0, 0);
      }

      // Draw to result image
      resultImage.src = fc.toDataURL('image/jpeg', parseInt(qualitySlider.value) / 100);
      resultEmpty.classList.add('hidden');

      // Update size estimate
      var estSize = Math.round(originalBlob.size * (parseInt(qualitySlider.value) / 100) * (0.5 + pixel / 20));
      newSizeEl.textContent = '~' + fmtBytes(Math.max(100, estSize));
      reductionPct.textContent = '~\u2212' + ((1 - estSize / originalBlob.size) * 100).toFixed(0) + '%';

      var delay = frame.delay || 100;
      gifAnimId = setTimeout(function() {
        gifAnimId = requestAnimationFrame(function() {
          renderFrame((frameIdx + 1) % gifFrames.length);
        });
      }, Math.max(50, delay));
    }

    renderFrame(0);
  }

  // ── Render preview and update UI ──
  async function renderResult(img, quality, presetLabel) {
    var result = await processImage(img, quality, pixelVal, noiseVal, blurVal, brightnessVal, currentFormat, presetLabel);
    processedBlob = result.blob;
    processedUrl = result.url;

    resultEmpty.classList.add('hidden');
    resultImage.classList.remove('hidden');
    resultImage.src = processedUrl;
    sizeBadge.classList.remove('hidden');
    origSizeEl.textContent = fmtBytes(originalBlob.size);
    newSizeEl.textContent = fmtBytes(processedBlob.size);
    var pct = ((1 - processedBlob.size / originalBlob.size) * 100).toFixed(0);
    reductionPct.textContent = '\u2212' + pct + '%';
    procTimeEl.classList.remove('hidden');
    procTimeEl.textContent = result.time + 'ms';
    downloadBtn.textContent = 'Download (' + fmtBytes(processedBlob.size) + ')';
  }

  // ── Handle image upload ──
  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    stopGifPreview();
    isGif = false;
    gifFrames = null;

    var firstFile = files[0];
    var isGifFile = firstFile.type === 'image/gif' || (firstFile.name && firstFile.name.toLowerCase().endsWith('.gif'));

    if (isGifFile) {
      isGif = true;
      // Read as arraybuffer for gifuct-js
      var buf = await new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.readAsArrayBuffer(firstFile);
      });

      try {
        gifFrames = parseGifFrames(buf);
        originalBlob = firstFile;

        // Also load first frame as regular image for thumbnail
        var img = new Image();
        await new Promise(function(resolve) {
          img.onload = resolve;
          img.src = URL.createObjectURL(firstFile);
        });
        originalImage = img;

        uploadPrompt.classList.add('hidden');
        uploadPreview.classList.remove('hidden');
        uploadPreview.src = img.src;
        enableControls();
        resultImage.classList.remove('hidden');
        resultEmpty.classList.add('hidden');
        sizeBadge.classList.remove('hidden');
        origSizeEl.textContent = fmtBytes(firstFile.size);
        newSizeEl.textContent = '~' + fmtBytes(firstFile.size) + ' (' + gifFrames.length + ' frames)';
        reductionPct.textContent = 'GIF animated';
        procTimeEl.classList.add('hidden');
        downloadBtn.textContent = 'Download (JPEG frame)';
        processedBlob = firstFile;
        startGifPreview();
        return;
      } catch (e) {
        // Fall back to treating as regular image
        isGif = false;
        gifFrames = null;
      }
    }

    // Standard image handling
    var loaded = await loadImage(firstFile);
    originalImage = loaded.img;
    originalBlob = loaded.blob;

    uploadPrompt.classList.add('hidden');
    uploadPreview.classList.remove('hidden');
    uploadPreview.src = URL.createObjectURL(loaded.blob);
    enableControls();

    await renderResult(originalImage, parseInt(qualitySlider.value), '');

    if (files.length > 1) {
      batchFiles = Array.prototype.slice.call(files, 1);
      batchPanel.classList.remove('hidden');
      batchCount.textContent = batchFiles.length;
      processBatch();
    }
  }

  async function processBatch() {
    batchGrid.innerHTML = '';
    batchResults = [];
    var q = parseInt(qualitySlider.value);

    for (var i = 0; i < batchFiles.length; i++) {
      (function(file, idx) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = async function() {
            var result = await processImage(img, q, pixelVal, noiseVal, blurVal, brightnessVal, currentFormat, '');
            batchResults.push({ file: file, blob: result.blob, url: result.url, size: result.size, name: file.name });
            renderBatchCard(file, result, idx);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      })(batchFiles[i], i);
    }
  }

  function renderBatchCard(file, result, idx) {
    var card = document.createElement('div');
    card.className = 'bg-surface rounded-lg overflow-hidden border border-zinc-300';
    card.innerHTML =
      '<img src="' + result.url + '" alt="Batch result ' + (idx + 2) + '" class="w-full object-cover" style="aspect-ratio:1" loading="lazy" />' +
      '<div class="px-2 py-1.5 flex items-center justify-between">' +
      '<span class="text-[10px] text-zinc-700 font-mono truncate max-w-[60%]" title="' + (file.name || 'image') + '">' + (file.name || 'image') + '</span>' +
      '<span class="text-[10px] text-brand-400 font-mono">' + fmtBytes(result.size) + '</span>' +
      '</div>';
    batchGrid.appendChild(card);
  }

  // ── Event: Upload ──
  dropZone.addEventListener('click', function() { fileInput.click(); });
  dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drop-glow'); });
  dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('drop-glow'); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drop-glow');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', function() { handleFiles(fileInput.files); });

  // ── Sample images ──
  function generateSample(type) {
    var SIZE = 512;
    var c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    var ctx = c.getContext('2d');

    if (type === 'meme') {
      var grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      grad.addColorStop(0, '#ff6b6b'); grad.addColorStop(0.5, '#ffd93d'); grad.addColorStop(1, '#6bcb77');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
      ctx.font = 'bold 48px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.strokeText('WHEN YOU', SIZE/2, SIZE/2 - 20); ctx.fillText('WHEN YOU', SIZE/2, SIZE/2 - 20);
      ctx.fillStyle = '#ff0'; ctx.strokeStyle = '#000';
      ctx.strokeText('FIND THE TOOL', SIZE/2, SIZE/2 + 40); ctx.fillText('FIND THE TOOL', SIZE/2, SIZE/2 + 40);
    } else if (type === 'photo') {
      ctx.fillStyle = '#f5d0a9'; ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#e8d5b7'; ctx.beginPath(); ctx.ellipse(SIZE/2, SIZE/2-30, 120, 150, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a2518';
      ctx.beginPath(); ctx.ellipse(SIZE/2, SIZE/2-160, 140, 80, 0, Math.PI, 2*Math.PI); ctx.fill();
      ctx.fillRect(SIZE/2-140, SIZE/2-170, 280, 60);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(SIZE/2-40, SIZE/2-60, 22, 18, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(SIZE/2+40, SIZE/2-60, 22, 18, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a3728'; ctx.beginPath(); ctx.arc(SIZE/2-40, SIZE/2-60, 10, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(SIZE/2+40, SIZE/2-60, 10, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#c4846d'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.arc(SIZE/2, SIZE/2-20, 30, 0.1*Math.PI, 0.9*Math.PI); ctx.stroke();
    } else if (type === 'screen') {
      ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#dee2e6'; ctx.fillRect(0, 0, SIZE, 36);
      ctx.fillStyle = '#ff5f57'; ctx.beginPath(); ctx.arc(22, 18, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffbd2e'; ctx.beginPath(); ctx.arc(44, 18, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#28ca41'; ctx.beginPath(); ctx.arc(66, 18, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#212529'; ctx.font = '13px "Segoe UI", sans-serif';
      var lines = ['Confidential Report - Q3 2026', '', 'Revenue: $12,450,000', 'Expenses: $8,320,000', 'Net Profit: $4,130,000', '', 'Employee Data:', 'John Smith - SSN: ***-**-1234', 'Jane Doe - SSN: ***-**-5678'];
      lines.forEach(function(l, i) { ctx.fillText(l, 30, 60 + i * 18); });
    }

    return new Promise(function(resolve) {
      c.toBlob(function(blob) {
        var file = new File([blob], 'sample-' + type + '.png', { type: 'image/png' });
        resolve(file);
      }, 'image/png');
    });
  }

  document.querySelectorAll('.sample-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var type = this.getAttribute('data-sample');
      if (!type) return;
      var file = await generateSample(type);
      handleFiles([file]);
      // Scroll to result
      var toolRoot = document.getElementById('tool-root');
      if (toolRoot) toolRoot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // ── Event: Quality slider ──
  qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value + '%';
    if (!originalImage) return;
    if (isGif) {
      stopGifPreview();
      startGifPreview();
      return;
    }
    cancelAnimationFrame(rafId);
    var self = this;
    rafId = requestAnimationFrame(async function() {
      await renderResult(originalImage, parseInt(self.value), '');
      if (batchFiles.length > 0) processBatch();
    });
  });

  // ── Event: Presets ──
  var presets = {
    mild:    { q: 30, px: 1, n: 0,  b: 0,  br: 0 },
    classic: { q: 20, px: 2, n: 15, b: 0,  br: 5 },
    nuked:   { q: 10, px: 8, n: 35, b: 0,  br: 20 },
    vintage: { q: 20, px: 6, n: 20, b: 1,  br: -5 },
    crt:     { q: 40, px: 1, n: 8,  b: 0.5,br: -10 },
  };

  document.querySelectorAll('.preset-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var presetName = this.dataset.preset;
      var p = presets[presetName];
      if (!p) return;

      qualitySlider.value = p.q;
      qualityValue.textContent = p.q + '%';
      document.getElementById('pixel-slider').value = p.px;
      document.getElementById('pixel-value').textContent = p.px + 'x';
      document.getElementById('noise-slider').value = p.n;
      document.getElementById('noise-value').textContent = p.n + '%';
      document.getElementById('blur-slider').value = p.b;
      document.getElementById('blur-value').textContent = p.b;
      document.getElementById('brightness-slider').value = p.br;
      document.getElementById('brightness-value').textContent = p.br;

      pixelVal = p.px;
      noiseVal = p.n;
      blurVal = p.b;
      brightnessVal = p.br;

      document.querySelectorAll('.preset-btn').forEach(function(b) {
        b.classList.remove('border-brand-500', 'text-brand-400', 'bg-brand-500/10');
        b.classList.add('border-zinc-300', 'text-zinc-700');
      });
      this.classList.add('border-brand-500', 'text-brand-400', 'bg-brand-500/10');
      this.classList.remove('border-zinc-300', 'text-zinc-700');

      if (originalImage) {
        if (isGif) { stopGifPreview(); startGifPreview(); return; }
        await renderResult(originalImage, p.q, presetName);
        if (batchFiles.length > 0) processBatch();
      }
    });
  });

  // ── Event: Advanced controls ──
  advancedToggle.addEventListener('click', function() {
    var isOpen = !advancedPanel.classList.contains('hidden');
    advancedPanel.classList.toggle('hidden', isOpen);
    advChevron.classList.toggle('rotate-180', !isOpen);
  });

  var advSliders = {
    'pixel-slider':      { el: 'pixel-value',  fmt: function(v) { return v + 'x'; }, key: 'pixelVal' },
    'noise-slider':      { el: 'noise-value',  fmt: function(v) { return v + '%'; }, key: 'noiseVal' },
    'blur-slider':       { el: 'blur-value',   fmt: function(v) { return v; },       key: 'blurVal' },
    'brightness-slider': { el: 'brightness-value', fmt: function(v) { return v; },    key: 'brightnessVal' },
  };

  Object.keys(advSliders).forEach(function(sliderId) {
    var slider = document.getElementById(sliderId);
    var conf = advSliders[sliderId];
    var display = document.getElementById(conf.el);
    slider.addEventListener('input', async function() {
      var v = parseInt(this.value);
      display.textContent = conf.fmt(v);
      window[conf.key] = v;
      if (!originalImage) return;

      document.querySelectorAll('.preset-btn').forEach(function(b) {
        b.classList.remove('border-brand-500', 'text-brand-400', 'bg-brand-500/10');
        b.classList.add('border-zinc-300', 'text-zinc-700');
      });

      cancelAnimationFrame(rafId);
      if (isGif) { stopGifPreview(); startGifPreview(); return; }
      var q = parseInt(qualitySlider.value);
      rafId = requestAnimationFrame(function() {
        renderResult(originalImage, q, '').then(function() {
          if (batchFiles.length > 0) processBatch();
        });
      });
    });
  });

  // ── Event: Output format ──
  document.querySelectorAll('.fmt-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      document.querySelectorAll('.fmt-btn').forEach(function(b) {
        b.classList.remove('border-brand-500/30', 'bg-brand-500/10', 'text-brand-400');
        b.classList.add('border-zinc-300', 'text-zinc-500');
      });
      this.classList.add('border-brand-500/30', 'bg-brand-500/10', 'text-brand-400');
      this.classList.remove('border-zinc-300', 'text-zinc-500');
      currentFormat = this.dataset.format;
      if (originalImage) {
        await renderResult(originalImage, parseInt(qualitySlider.value), '');
        if (batchFiles.length > 0) processBatch();
      }
    });
  });

  // ── Event: Target file size auto-match ──
  targetSizeApply.addEventListener('click', async function() {
    var targetKB = parseInt(targetSizeInput.value);
    if (!targetKB || targetKB < 1 || !originalImage) return;

    targetSizeStatus.classList.remove('hidden');
    targetSizeStatus.textContent = 'Searching for optimal quality...';
    targetSizeApply.disabled = true;

    try {
      var match = await autoMatchTarget(originalImage, targetKB, pixelVal, noiseVal, blurVal, brightnessVal, currentFormat);
      qualitySlider.value = match.quality;
      qualityValue.textContent = match.quality + '%';
      processedBlob = match.result.blob;
      processedUrl = match.result.url;

      resultImage.src = processedUrl;
      newSizeEl.textContent = fmtBytes(processedBlob.size);
      var pct = ((1 - processedBlob.size / originalBlob.size) * 100).toFixed(0);
      reductionPct.textContent = '\u2212' + pct + '%';
      procTimeEl.textContent = match.result.time + 'ms';
      downloadBtn.textContent = 'Download (' + fmtBytes(processedBlob.size) + ')';

      targetSizeStatus.textContent = 'Matched! Quality set to ' + match.quality + '%  \u2192  ' + fmtBytes(processedBlob.size);
      targetSizeClear.classList.remove('hidden');
    } catch (e) {
      targetSizeStatus.textContent = 'Error: ' + e.message;
    }
    targetSizeApply.disabled = false;
  });

  targetSizeClear.addEventListener('click', function() {
    targetSizeInput.value = '';
    targetSizeStatus.classList.add('hidden');
    targetSizeClear.classList.add('hidden');
  });

  // ── Event: Download ──
  downloadBtn.addEventListener('click', function() {
    if (!processedBlob && !isGif) return;
    if (isGif && gifFrames) {
      // Download current rendered frame as JPEG
      resultImage.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'degraded-gif-frame-' + Date.now() + '.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      }, 'image/jpeg', parseInt(qualitySlider.value) / 100);
      return;
    }
    if (!processedBlob) return;
    var url = URL.createObjectURL(processedBlob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'degraded-' + Date.now() + '.' + ext(currentFormat);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  });

  // ── Event: Copy to clipboard ──
  copyBtn.addEventListener('click', async function() {
    if (!processedBlob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem((function() {
        var obj = {};
        obj[processedBlob.type] = processedBlob;
        return obj;
      })())]);
      copyBtn.textContent = 'Copied!';
      setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1500);
    } catch (e) {
      alert('Copy not supported in this browser. Use Download instead.');
    }
  });

  // ── Event: Reset ──
  resetBtn.addEventListener('click', function() {
    originalImage = null;
    originalBlob = null;
    processedBlob = null;
    processedUrl = null;
    batchFiles = [];
    batchResults = [];
    isGif = false;
    gifFrames = null;
    stopGifPreview();

    uploadPrompt.classList.remove('hidden');
    uploadPreview.classList.add('hidden');
    uploadPreview.src = '';
    resultImage.classList.add('hidden');
    resultImage.src = '';
    resultEmpty.classList.remove('hidden');
    sizeBadge.classList.add('hidden');
    procTimeEl.classList.add('hidden');
    batchPanel.classList.add('hidden');
    batchGrid.innerHTML = '';
    targetSizeStatus.classList.add('hidden');
    targetSizeClear.classList.add('hidden');
    targetSizeInput.value = '';

    controls.classList.add('opacity-40', 'pointer-events-none');
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    downloadBtn.textContent = 'Download';
    qualitySlider.value = 15;
    qualityValue.textContent = '15%';
    pixelVal = 1; noiseVal = 0; blurVal = 0; brightnessVal = 0;

    document.querySelectorAll('.preset-btn').forEach(function(b) {
      b.classList.remove('border-brand-500', 'text-brand-400', 'bg-brand-500/10');
      b.classList.add('border-zinc-300', 'text-zinc-700');
    });

    fileInput.value = '';
  });

  // ── Event: Batch download all ──
  batchDownloadAll.addEventListener('click', function() {
    batchResults.forEach(function(r, i) {
      setTimeout(function() {
        var url = URL.createObjectURL(r.blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'degraded-' + (i + 2) + '-' + Date.now() + '.' + ext(currentFormat);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
      }, i * 300);
    });
  });

  // ── Handle Quick Actions from index.astro ──
  var pending = window.__pendingQuickAction;
  if (pending) {
    window.__pendingQuickAction = null;
    var presetBtn = document.querySelector('[data-preset="' + pending + '"]');
    if (presetBtn) setTimeout(function() { presetBtn.click(); }, 200);
  }
  document.querySelectorAll('.quick-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var action = card.getAttribute('data-quick');
      if (action) {
        var btn = document.querySelector('[data-preset="' + action + '"]');
        if (action === 'compress') {
          var toolRoot = document.getElementById('tool-root');
          if (toolRoot) toolRoot.scrollIntoView({ behavior: 'smooth' });
        } else if (action === 'pixelate') {
          if (advancedPanel && advancedPanel.classList.contains('hidden')) {
            advancedToggle.click();
          }
          var pixelSlider = document.getElementById('pixel-slider');
          var pixelValueEl = document.getElementById('pixel-value');
          if (pixelSlider) pixelSlider.value = 8;
          if (pixelValueEl) pixelValueEl.textContent = '8x';
          pixelVal = 8;
          if (btn) btn.click();
        } else if (btn) {
          btn.click();
        }
      }
    });
  });
})();
