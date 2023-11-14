export interface SaveService {
  hasUser: ({ botId, userId }: { botId: number; userId: number }) => boolean;
  upsertUser: ({ botId, userId }: { botId: number; userId: number }, data: any) => Promise<void>;

  hasChat: ({ botId, chatId }: { botId: number; chatId: number }) => boolean;
  upsertChat: ({ botId, chatId }: { botId: number; chatId: number }, data: any) => Promise<void>;

  upsertMessage: (
    {
      botId,
      chatId,
      messageId,
    }: {
      botId: number;
      chatId: number;
      messageId: number;
    },
    data: any,
  ) => Promise<void>;

  upsertDialog({ botId, chatId }: { botId: number; chatId: number }, data: any): Promise<void>;

  eventEmitter: {
    emit: (event: string, data: any) => void;
  };
}
