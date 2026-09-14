import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parse } from 'acorn';
import path from 'node:path';

// Inspect published data without executing the reference site's JavaScript.
const source = process.argv[2];
if (!source) throw new Error('Pass the reference assets/app.js path');
const ast = parse(await readFile(source, 'utf8'), { ecmaVersion: 'latest' });
function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => {
    if (p.type !== 'Property' || p.computed || p.kind !== 'init') throw new Error('Nonliteral property');
    return [p.key.name ?? p.key.value, literal(p.value)];
  }));
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' &&
      node.callee.object.name === 'window' && node.callee.property.name === '__vaticanAsset' &&
      node.arguments.length === 1) return literal(node.arguments[0]);
  throw new Error(`Unsupported reference data: ${node.type}`);
}
let works;
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && node.init?.type === 'ArrayExpression') {
    const first = node.init.elements[0];
    const id = first?.properties?.find(p => p.key?.name === 'id')?.value?.value;
    if (typeof id === 'string' && id.startsWith('a-')) {
      if (works) throw new Error('Ambiguous reference catalog');
      works = literal(node.init);
    }
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') walk(value);
  }
}
walk(ast);
if (!works?.length) throw new Error('No reference catalog found');
const directory = path.resolve('work/experience/reference');
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'works.json'), JSON.stringify(works, null, 2));
console.log(JSON.stringify(works.map(({ id, name, images, story, look, fact }) => ({
  id, name, images: images.length, storyLength: story.length, look, fact,
})), null, 2));
