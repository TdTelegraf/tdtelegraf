import fs from 'fs/promises';
import path from 'path';

import { downloadFile } from './downloadFile';

// Function to generate a random filename
function generateRandomFilename() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  return `${timestamp}-${randomString}`;
}

const isUrl = (str) => str.startsWith('http://') || str.startsWith('https://');

export const uploadMedia = async (media, directoryPath = '/tmp') => {
  if (!media) return null; // error maybe?
  const mediaItem = media?.source || media;
  if (typeof mediaItem === 'string') {
    if (isUrl(mediaItem)) {
      const filePath = await downloadFile(mediaItem, directoryPath);
      return filePath;
    }
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
