const fs = require('fs').promises;
const { statSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { PurgeCSS } = require('purgecss');

const config = require('./purge.config.js');

async function main() {
  try {
    // find the styles css file
    const files = await getFilesFromPath(config.sourceDir, '.css');
    const data = [];

    if (!files || files.length <= 0) {
      console.log('Cannot find style files to purge');
      return;
    }

    for (const f of files) {
      // get original file size
      const originalSize = getFilesizeInKiloBytes(join(config.sourceDir, f)) + 'kb';
      const o = { file: f, originalSize: originalSize, newSize: '' };
      data.push(o);
    }

    console.log('Running PurgeCSS...');

    try {
      // Process each CSS file
      for (const d of data) {
        const cssFile = join(config.sourceDir, d.file);
        const cssContent = readFileSync(cssFile, 'utf8');

        const purgeCSS = new PurgeCSS();
        const result = await purgeCSS.purge({
          content: config.content,
          css: [{ raw: cssContent }],
          safelist: config.safelist,
          ...config.options
        });

        if (result && result.length > 0) {
          // Write purged CSS back to the file
          writeFileSync(cssFile, result[0].css);
          // get new file size
          const newSize = getFilesizeInKiloBytes(cssFile) + 'kb';
          d.newSize = newSize;
        } else {
          console.warn(`Warning: No purged content for ${d.file}`);
          d.newSize = 'N/A';
        }
      }

      console.log('PurgeCSS completed');
      console.log();
      console.table(data);

    } catch (err) {
      console.error('Error during purge:', err);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function getFilesizeInKiloBytes(filename) {
  const stats = statSync(filename);
  const fileSizeInBytes = stats.size / 1024;
  return fileSizeInBytes.toFixed(2);
}

async function getFilesFromPath(dir, extension) {
  const files = await fs.readdir(dir);
  return files.filter(e => e.toLowerCase().endsWith(extension));
}

main();
