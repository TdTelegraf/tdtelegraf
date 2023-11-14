export const getMessageTypes = (message) => {
  const types = [];
  if (message?.photo) types.push('photo');
  if (message?.video) types.push('video');
  if (message?.video_note) types.push('video_note');
  if (message?.media_group_id) types.push('media');
  if (message?.voice) types.push('voice');
  if (message?.document) types.push('document');
  if (message?.location) types.push('location');
  if (message?.poll) types.push('poll');
  if (message?.contact) types.push('contact');
  if (message?.sticker) types.push('sticker');
  return types;
};

export function getMessageType(message) {
  // console.log('getMessageType', message);
  // const { message } = ctx;
  if (message.audio) return 'audio';
  if (message.document) return 'document';
  if (message.animation) return 'animation';
  if (message.photo) return 'photo';
  if (message.sticker) return 'sticker';
  if (message.video) return 'video';
  if (message.video_note) return 'video_note';
  if (message.voice) return 'voice';
  if (message.contact) return 'contact';
  if (message.dice) return 'dice';
  if (message.game) return 'game'; // TODO: проверить
  if (message.poll) return 'poll';
  if (message.location) return 'location';
  if (message.venue) return 'venue'; // TODO: проверить
  if (message.text) return 'text';

  // СПОРНО
  if (message.pinned_message) return 'pinned_message';
  if (message.left_chat_member) return 'left_chat_member';
  if (message.new_chat_members) return 'new_chat_members';
  if (message.new_chat_title) return 'new_chat_title';
  if (message.new_chat_photo) return 'new_chat_photo';
  if (message.invoice) return 'invoice'; // TODO: проверить
  if (message.successful_payment) return 'successful_payment'; // TODO: проверить
  if (message.passport_data) return 'passport_data'; // TODO: проверить
  // if (message.reply_markup) return 'reply_markup'; // TODO: проверить
  return null;
}

export async function onChatIdCommand(ctx) {
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
