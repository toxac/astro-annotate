import fs from 'fs';
import path from 'path';
const dataPath = path.resolve(__dirname, 'annotations.json');
export function saveAnnotation(annotation) {
    let annotations = [];
    if (fs.existsSync(dataPath)) {
        annotations = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    annotations.push(annotation);
    fs.writeFileSync(dataPath, JSON.stringify(annotations, null, 2));
}
export function getAnnotations(pageUrl) {
    if (!fs.existsSync(dataPath))
        return [];
    const annotations = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return annotations.filter((a) => a.pageUrl === pageUrl);
}
