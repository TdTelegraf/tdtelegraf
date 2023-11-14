import { createLogger } from '@lskjs/log';

const loggers = {};
export const getBotLogger = (botInfo) => {
  const botUsername = botInfo?.username || botInfo?.id;
  if (!loggers[botUsername]) {
    loggers[botUsername] = createLogger(`bot:${botUsername}`);
  }
  return loggers[botUsername];
};
