import { stage } from '@lsk4/env';

export async function onPingCommand(ctx: any) {
  ctx.reply(`Pong stage=${stage}`, { reply_to_message_id: ctx.message.message_id });
}
