import assert from 'node:assert/strict';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export function parseColosseumSurface(text) {
  const records = text.split(/\r?\n/);
  const faces = records.filter(line => /^\s*f\s/.test(line));
  const looseEdges = records.filter(line => /^\s*l\s/.test(line));
  assert.ok(faces.length > 0, 'No mesh faces');
  assert.ok(faces.every(line => line.trim().split(/\s+/).length === 4), 'Expected triangular source faces');
  // OBJLoader changes a mixed face/line object into LineSegments. Keep only
  // face surfaces; loose-edge records are inventoried, never triangulated.
  const source = new OBJLoader().parse(records.filter(line => !/^\s*l\s/.test(line)).join('\n'));
  const meshes = [];
  source.traverse(object => { if (object.isMesh) meshes.push(object); });
  assert.equal(meshes.length, 1, 'Review additional source objects before conversion');
  const geometry = meshes[0].geometry;
  assert.deepEqual(Object.keys(geometry.attributes).sort(), ['normal', 'position', 'uv']);
  assert.equal(geometry.attributes.position.count / 3, faces.length, 'Unexpected face conversion');
  return { geometry, sourceFaceCount: faces.length, sourceLineCount: looseEdges.length };
}
