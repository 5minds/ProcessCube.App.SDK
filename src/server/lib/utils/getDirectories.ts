import { promises as fs, PathLike } from 'fs';
import { join } from 'path';

/**
 * Recursively get all directories in a directory.
 * It gives the full path to the directory.
 * @param source The directory to search in
 * @returns A list of all directories in the directory
 **/
export async function getDirectories(source: PathLike): Promise<string[]> {
  const dirents = await fs.readdir(source, { withFileTypes: true });
  const directories = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = join(source.toString(), dirent.name);

      return dirent.isDirectory() ? [fullPath, ...(await getDirectories(fullPath))] : [];
    })
  );

  return Array.prototype.concat(...directories);
}
