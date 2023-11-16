import { log } from '@lskjs/log/log';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const isDebug = false;

// Function to generate a random filename
function generateRandomFilename() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  return `${timestamp}-${randomString}`;
}

// TODO: do not save file on disk, just return buffer
export const downloadFile = async (url, directoryPath) => {
  // Generate a random filename
  const filename = generateRandomFilename();
  const filePath = path.join(directoryPath, filename);

  if (isDebug) log.debug('[downloadFile]', url, filePath);
  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
  });

  // Create a write stream to save the file
  const writer = fs.createWriteStream(filePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      resolve(filePath);
    });

    writer.on('error', (err) => {
      reject(err);
    });
  });
};

// // Usage example
// const fileUrl = 'https://i.ytimg.com/vi/kNTL46NTV2A/maxresdefault.jpg?sqp=-oaymwEmCIAKENAF8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGEYgUyhyMA8=&rs=AOn4CLCozH79onK_Po4m0DC71I_cRBYkzA';
// const downloadDirectory = './images'; // Specify your download directory

// downloadFile(fileUrl, downloadDirectory)
//   .then((filePath) => {
//     console.log(`File downloaded to ${filePath}`);
//   })
//   .catch((error) => {
//     console.error('Error downloading file:', error);
//   });
