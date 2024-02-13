export function getMessageText(message: any) {
  if (!message) return null;
  if (message.text) return message.text;
  if (message.caption) return message.caption;
  if (message.photo?.caption) return message.photo?.caption;
  if (message.video?.caption) return message.video?.caption;
  // TODO: ?
  return null;
}
