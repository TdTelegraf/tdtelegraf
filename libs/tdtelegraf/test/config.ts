import './dotenv';

import { Err } from '@lsk4/err';
import { getTdjson } from 'prebuilt-tdlib';

import { configure } from '../src/configure';

const TDLIB_API_ID = +(process.env.TDLIB_API_ID || '');

if (!TDLIB_API_ID) throw new Err('!TDLIB_API_ID');
if (!process.env.TDLIB_API_HASH) throw new Err('!TDLIB_API_HASH');
if (!process.env.TDLIB_ACCOUNT_PHONE) throw new Err('!TDLIB_ACCOUNT_PHONE');

export const tdlOptions = {
  apiId: TDLIB_API_ID,
  apiHash: process.env.TDLIB_API_HASH,
};

const tdlibDir = `${__dirname}/../../../tdlib`;

export const accountPhone = process.env.TDLIB_ACCOUNT_PHONE;
export const databaseDirectory = `${tdlibDir}/accounts/${accountPhone}/db`;
export const filesDirectory = `${tdlibDir}/accounts/${accountPhone}/files`;

export const tdlibPath = getTdjson();
configure({
  tdjson: tdlibPath,
});

export const debugChatId = -4034510711;
export const debugUserId = 1227280;

export const telegrafOptions = {
  token: process.env.TELEGRAM_BOT_TOKEN,
};
