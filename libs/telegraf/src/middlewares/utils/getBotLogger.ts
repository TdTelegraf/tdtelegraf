import type { ILogger } from '@lsk4/log';
import { createLogger } from '@lsk4/log';

const loggers: Record<string, ILogger> = {};
export const getBotLogger = (botInfo: any) => {
  const botUsername = botInfo?.username || botInfo?.id;
  if (!loggers[botUsername]) {
    loggers[botUsername] = createLogger(`bot:${botUsername}`);
  }
  return loggers[botUsername];
};
