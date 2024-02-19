const fs = require('fs-extra');
const path = require('path');

const rootDir = path.resolve(__dirname); // Assuming this script is in the root directory
const protoSource = path.join(rootDir, 'packages', 'proto');
const packagesDir = path.join(rootDir, 'packages');

fs.readdir(packagesDir, { withFileTypes: true }, (err, entries) => {
  if (err) {
    console.error('Failed to read packages directory:', err);
    return;
  }

  entries.forEach((entry) => {
    if (entry.isDirectory() && entry.name !== 'proto') {
      const destDir = path.join(
        packagesDir,
        entry.name,
        'node_modules',
        'juno-proto',
      );

      // Check if the juno-proto directory exists and is not a symbolic link
      fs.lstat(destDir, (lstatError, stats) => {
        if (lstatError) {
          console.log(
            `Skipping ${entry.name}, either does not have a juno-proto directory or it's a symbolic link.`,
          );
          return;
        }

        if (stats.isDirectory()) {
          // Proceed to copy, ensuring not to copy into self or subdirectories of self
          fs.copy(
            protoSource,
            destDir,
            {
              overwrite: true,
              filter: (src, dest) => {
                // Exclude symbolic links and prevent copying into self or subdirectories of self
                return (
                  !fs.lstatSync(src).isSymbolicLink() &&
                  !dest.includes(protoSource)
                );
              },
            },
            (err) => {
              if (err) {
                console.error(`Failed to copy proto to ${destDir}:`, err);
              } else {
                console.log(`Successfully copied proto to ${destDir}`);
              }
            },
          );
        } else {
          console.log(
            `Skipping ${entry.name}, as it does not have a juno-proto directory.`,
          );
        }
      });
    }
  });
});
