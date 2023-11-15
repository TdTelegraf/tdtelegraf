import { log } from '@lskjs/log/log';
import fs from 'fs/promises';
import path from 'path';

// Function to generate a random filename
function generateRandomFilename() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  return `${timestamp}-${randomString}`;
}

export const uploadMedia = async (media, directoryPath = '/tmp') => {
  if (!media) return null; // error maybe?
  const mediaItem = media?.source || media;
  if (typeof mediaItem === 'string') {
    // TODO: check for url;
    return mediaItem;
  }
  if (Buffer.isBuffer(mediaItem)) {
    const filename = generateRandomFilename();
    const filePath = path.join(directoryPath, filename);
    await fs.writeFile(filePath, mediaItem);
    return filePath;
  }
  return null; // error too
};
