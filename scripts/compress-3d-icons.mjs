import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const imagesDir = path.resolve('assets/images');
const files = [
  '3d_analytics_v2.png',
  '3d_create_card_v2.png',
  '3d_scan_card_v2.png',
  '3d_share_card_v2.png',
  '3d_signals_v2.png',
  '3d_track_card_v2.png'
];

console.log('Starting compression of 3D icons...');

for (const file of files) {
  const inputPath = path.join(imagesDir, file);
  const tempPath = path.join(imagesDir, `temp_${file}`);
  
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${file}: not found`);
    continue;
  }
  
  const origSize = fs.statSync(inputPath).size;
  
  try {
    // Resize width to 180px and quantize palette for massive KB reduction while keeping transparency
    execSync(`npx -y sharp-cli -i "${inputPath}" -o "${tempPath}" --palette --effort 6 resize 180`, { stdio: 'inherit' });
    
    if (fs.existsSync(tempPath)) {
      const newSize = fs.statSync(tempPath).size;
      fs.renameSync(tempPath, inputPath);
      console.log(`Compressed ${file}: ${(origSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (${Math.round((1 - newSize/origSize)*100)}% reduction)`);
    }
  } catch (err) {
    console.error(`Error compressing ${file}:`, err.message);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

console.log('Compression complete!');
