(function (root) {
  function solve8(A, b) {
    const M = A.map((row, i) => row.concat(b[i]));
    for (let col = 0; col < 8; col++) {
      let pivot = col;
      for (let row = col + 1; row < 8; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
      }
      [M[col], M[pivot]] = [M[pivot], M[col]];
      const div = M[col][col] || 1e-12;
      for (let j = col; j <= 8; j++) M[col][j] /= div;
      for (let row = 0; row < 8; row++) {
        if (row === col) continue;
        const factor = M[row][col];
        for (let j = col; j <= 8; j++) M[row][j] -= factor * M[col][j];
      }
    }
    return M.map((row) => row[8]);
  }

  function homography(q, w, h) {
    const src = [[0, 0], [w, 0], [w, h], [0, h]], A = [], B = [];
    for (let i = 0; i < 4; i++) {
      const [u, v] = src[i], [x, y] = q[i];
      A.push([u, v, 1, 0, 0, 0, -u * x, -v * x], [0, 0, 0, u, v, 1, -u * y, -v * y]);
      B.push(x, y);
    }
    return solve8(A, B);
  }

  function quad(x, y, w, h) {
    return [
      [x - w * 0.5, y - h * 0.5],
      [x + w * 0.5, y - h * 0.36],
      [x + w * 0.42, y + h * 0.5],
      [x - w * 0.5, y + h * 0.34]
    ];
  }

  function css(q, w, h) {
    const [a, b, c, d, e, f, g, hh] = homography(q, w, h);
    return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
  }

  function drawTri(ctx, img, s0, s1, s2, d0, d1, d2) {
    const su1 = s1[0] - s0[0], sv1 = s1[1] - s0[1], su2 = s2[0] - s0[0], sv2 = s2[1] - s0[1];
    const det = su1 * sv2 - su2 * sv1;
    if (Math.abs(det) < 1e-10) return;
    const idet = 1 / det;
    const dx1 = d1[0] - d0[0], dy1 = d1[1] - d0[1], dx2 = d2[0] - d0[0], dy2 = d2[1] - d0[1];
    const a = (dx1 * sv2 - dx2 * sv1) * idet, c = (su1 * dx2 - su2 * dx1) * idet;
    const b = (dy1 * sv2 - dy2 * sv1) * idet, d = (su1 * dy2 - su2 * dy1) * idet;
    const e = d0[0] - a * s0[0] - c * s0[1], f = d0[1] - b * s0[0] - d * s0[1];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0[0], d0[1]);
    ctx.lineTo(d1[0], d1[1]);
    ctx.lineTo(d2[0], d2[1]);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  function draw(ctx, img, q, steps = 8) {
    const sw = img.naturalWidth || img.videoWidth || img.width;
    const sh = img.naturalHeight || img.videoHeight || img.height;
    if (!sw || !sh) return;
    const [a, b, c, d, e, f, g, hh] = homography(q, sw, sh);
    const proj = (u, v) => {
      const w = g * u + hh * v + 1;
      return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
    };
    for (let iy = 0; iy < steps; iy++) {
      const v0 = (iy / steps) * sh, v1 = ((iy + 1) / steps) * sh;
      for (let ix = 0; ix < steps; ix++) {
        const u0 = (ix / steps) * sw, u1 = ((ix + 1) / steps) * sw;
        const s00 = [u0, v0], s10 = [u1, v0], s11 = [u1, v1], s01 = [u0, v1];
        const d00 = proj(u0, v0), d10 = proj(u1, v0), d11 = proj(u1, v1), d01 = proj(u0, v1);
        drawTri(ctx, img, s00, s10, s11, d00, d10, d11);
        drawTri(ctx, img, s00, s11, s01, d00, d11, d01);
      }
    }
  }

  const api = { quad, css, draw };
  if (typeof window !== "undefined") window.SleeveProject = api;
  root.SleeveProject = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
