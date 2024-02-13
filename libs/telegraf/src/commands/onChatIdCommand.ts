import { getMessageType } from '../utils/getMessageType';

export async function onChatIdCommand(ctx: any) {
  const renderMessage = (message: any) =>
    `id: \`${message.message_id}\` [${getMessageType(message)}]`;
  const renderChat = (chat: any) =>
    `chatId: \`${chat.id}\` ${chat.type === 'supergroup' ? '[supergroup]' : ''}`; // [${chat.title}]
  const renderUser = (from: any) => `userId: \`${from.id}\` ${from.is_bot ? '[bot]' : ''}`;
  const text = [
    '*Message*',
    renderMessage(ctx.message),
    ctx.message.from && renderUser(ctx.message.from),
    ctx.message.chat && renderChat(ctx.message.chat),
    ctx.message.reply_to_message && '\n*Replied message*',
    ctx.message.reply_to_message && renderMessage(ctx.message.reply_to_message),
    ctx.message.reply_to_message &&
      ctx.message.reply_to_message.from &&
      renderUser(ctx.message.reply_to_message.from),
    ctx.message.reply_to_message &&
      ctx.message.reply_to_message.forward_from &&
      '\n*Forwarded user*',
    ctx.message.reply_to_message &&
      ctx.message.reply_to_message.forward_from &&
      renderUser(ctx.message.reply_to_message.forward_from),
  ]
    .filter(Boolean)
    .join('\n');
  ctx.reply(text, { parse_mode: 'MarkdownV2', reply_to_message_id: ctx.message.message_id });
}
