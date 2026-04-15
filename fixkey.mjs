import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const raw = readFileSync('.env.production', 'utf8');
const line = raw.split('\n').find(l => l.startsWith('JUANITA_ANTHROPIC_KEY='));
// line looks like: JUANITA_ANTHROPIC_KEY="sk-ant-...AA\n"
const inner = line.slice('JUANITA_ANTHROPIC_KEY='.length);
// strip surrounding quotes
let val = inner.startsWith('"') ? inner.slice(1, inner.lastIndexOf('"')) : inner;
// strip literal \n (char 92 + char 110)
while (val.charCodeAt(val.length - 1) === 110 && val.charCodeAt(val.length - 2) === 92) {
  val = val.slice(0, -2);
}
const tmpFile = join(tmpdir(), 'anthkey.txt');
writeFileSync(tmpFile, val, 'utf8');
console.log(tmpFile);
console.log('ends:', JSON.stringify(val.slice(-6)));
