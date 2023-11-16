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
