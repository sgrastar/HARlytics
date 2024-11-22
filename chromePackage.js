import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const folderName = './build';
const zipName = 'extension.zip';

const output = createWriteStream(resolve(zipName));
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

archive.pipe(output);

output.on('close', () => {
    console.log(`Successfully zipped the ${folderName} directory and stored as ${zipName}`);
    console.log(`Total bytes: ${archive.pointer()}`);
});

archive.on('error', (err) => {
    console.error('Error creating zip file:', err);
    process.exit(1);
});

archive.directory(folderName, false);
await archive.finalize();