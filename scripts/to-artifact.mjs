// Converte o dist/index.html de arquivo único no formato de página do artifact do claude.ai:
// sem <!doctype>, <html>, <head> e <body> (o host adiciona o esqueleto), com <title> no topo.
import { readFileSync, writeFileSync } from 'node:fs';

const [input = 'dist/index.html', output = 'dist/artifact.html'] = process.argv.slice(2);
const html = readFileSync(input, 'utf8');

const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? '';

const pick = (re) => [...head.matchAll(re)].map((m) => m[0]);
const title = pick(/<title>[\s\S]*?<\/title>/gi);
const metas = pick(/<meta name="(?:claude:viewport-fit-sides|description)"[^>]*>/gi);
// Manifesto e ícones não existem na página avulsa; as fontes já vão embutidas no CSS.
const links = [];
const styles = pick(/<style[^>]*>[\s\S]*?<\/style>/gi);
const scripts = pick(/<script[^>]*>[\s\S]*?<\/script>/gi);

const out = [...title, ...metas, ...links, ...styles, body.trim(), ...scripts].join('\n');
writeFileSync(output, out);
console.log(`${output}: ${(out.length / 1024).toFixed(0)} KB`);
