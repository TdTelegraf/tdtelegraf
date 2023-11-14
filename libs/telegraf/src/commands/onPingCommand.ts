import { stage } from '@lskjs/env';

export async function onPingCommand(ctx) {
  ctx.reply(`Pong stage=${stage}`, { reply_to_message_id: ctx.message.message_id });
}
