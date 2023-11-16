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
