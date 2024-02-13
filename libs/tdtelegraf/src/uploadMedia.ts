import { createWriteStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';

import path from 'path';

import { downloadFile } from './downloadFile';

// Function to generate a random filename
function generateRandomFilename() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  return `${timestamp}-${randomString}`;
}

const isUrl = (str: string) =>
  typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://'));

export const uploadMedia = async (media: any, directoryPath = '/tmp') => {
  if (!media) return null; // TODO: think about error maybe?
  const mediaItem = media?.source || media;
  if (media?.url) {
    const filePath = await downloadFile(media?.url, directoryPath);
    return filePath;
  }
  if (isUrl(mediaItem)) {
    const filePath = await downloadFile(mediaItem, directoryPath);
    return filePath;
  }
  if (typeof mediaItem === 'string') {
    return mediaItem;
  }
  const filename = generateRandomFilename();
  const filePath = path.join(directoryPath, filename);
  if (Buffer.isBuffer(mediaItem)) {
    await writeFile(filePath, mediaItem);
    return filePath;
  }
  if (typeof mediaItem?.pipe === 'function') {
    const writeStream = createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      mediaItem
        .pipe(writeStream)
        .on('finish', () => resolve(filePath))
        .on('error', reject);
    });
  }
  return null; // TODO: think about error maybe?
};
