import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Annotation {
  highlightId: string;
  text: string;
  comment: string;
  pageUrl: string;
}

const dataPath = path.resolve(__dirname, 'annotations.json');

export function saveAnnotation(annotation: Annotation) {
  let annotations: Annotation[] = [];
  if (fs.existsSync(dataPath)) {
    annotations = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }
  annotations.push(annotation);
  fs.writeFileSync(dataPath, JSON.stringify(annotations, null, 2));
}

export function getAnnotations(pageUrl: string): Annotation[] {
  if (!fs.existsSync(dataPath)) return [];
  const annotations = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return annotations.filter((a: Annotation) => a.pageUrl === pageUrl);
}