/* eslint-disable default-case */
import { map } from 'fishbird';

export function convertToMessageEntity(item) {
  let type = '';
  switch (item.type._) {
    case 'textEntityTypeMention':
      type = 'mention';
      break;
    case 'textEntityTypeHashtag':
      type = 'hashtag';
      break;
    case 'textEntityTypeCashtag':
      type = 'cashtag';
      break;
    case 'textEntityTypeBotCommand':
      type = 'bot_command';
      break;
    case 'textEntityTypeUrl':
      type = 'url';
      break;
    case 'textEntityTypeEmailAddress':
      type = 'email';
      break;
    case 'textEntityTypePhoneNumber':
      type = 'phone_number';
      break;
    case 'textEntityTypeBold':
      type = 'bold';
      break;
    case 'textEntityTypeItalic':
      type = 'italic';
      break;
    case 'textEntityTypeUnderline':
      type = 'underline';
      break;
    case 'textEntityTypeStrikethrough':
      type = 'strikethrough';
      break;
    case 'textEntityTypeSpoiler':
      type = 'spoiler';
      break;
    case 'textEntityTypeCode':
      type = 'code';
      break;
    case 'textEntityTypePre':
      type = 'pre';
      break;
    case 'textEntityTypeTextUrl':
      type = 'text_link';
      break;
    case 'textEntityTypeMentionName':
      type = 'text_mention';
      break;
    case 'textEntityTypeCustomEmoji':
      type = 'custom_emoji';
      break;
  }
  return {
    type,
    offset: item.offset,
    length: item.length,
    custom_emoji_id: item.type.custom_emoji_id,
  };
}

export function convertToPhotoSize(item) {
  let key = 'photo';
  if (item._ === 'thumbnail') {
    key = 'file';
  }
  return {
    file_id: item[key].remote.id,
    file_unique_id: item[key].remote.unique_id,
    width: item.width,
    height: item.height,
    file_size: item[key].size,
  };
}

export function convertBotInfo(rawBotInfo) {
  const username = rawBotInfo.usernames.editable_username;
  return {
    id: rawBotInfo.id,
    is_bot: false,
    first_name: rawBotInfo.first_name,
    last_name: rawBotInfo.last_name,
    username,
    phone: rawBotInfo.phone_number,
    _raw: rawBotInfo,
  };
}

export async function convertToTelegrafMessage(message) {
  const user = await this.tdlib.invoke({
    _: 'getUser',
    user_id: message.sender_id.user_id,
  });
  const chat = await this.tdlib.invoke({
    _: 'getChat',
    chat_id: message.chat_id,
  });
  let chatType = '';
  if (chat.type._ === 'chatTypeBasicGroup') {
    chatType = 'group';
  }
  if (chat.type._ === 'chatTypePrivate') {
    chatType = 'private';
  }
  if (chat.type._ === 'chatTypeSecret') {
    chatType = 'secret';
  }
  if (chat.type._ === 'chatTypeSupergroup') {
    chatType = 'supergroup';
  }
  const from = {
    id: user.id,
    is_bot: user.type._ === 'userTypeBot',
    first_name: user.first_name,
    last_name: user.last_name,
    username: user?.usernames?.editable_username || user.username || '',
    language_code: user.language_code,
  };
  const chat2 =
    chat.id === from.id
      ? from
      : {
          id: chat.id,
          title: chat.title,
          // first_name: '<First Name not supported yet>',
          // last_name: '<Last Name not supported yet>',
          // username: '<Username not supported yet>',
          type: chatType,
        };
  const newMessage: any = {
    message_id: message.id,
    from,
    chat: chat2,
    date: message.date,
    originalContent: message.content._,
    _raw: message,
  };
  if (message.content._ === 'messageText') {
    newMessage.text = message.content.text.text;
    newMessage.entities = message.content.text.entities.map(convertToMessageEntity);
  }
  if (message.content.caption) {
    newMessage.caption = message.content.caption.text;
    newMessage.caption_entities = message.content.caption.entities.map(convertToMessageEntity);
  }
  if (message.content._ === 'messagePhoto') {
    newMessage.photo = message.content.photo.sizes.map(convertToPhotoSize);
  }
  if (message.content._ === 'messageVideo') {
    const { video } = message.content;
    newMessage.video = {
      file_id: video.video.remote.id,
      file_unique_id: video.video.remote.id,
      width: video.width,
      height: video.height,
      duration: video.duration,
      thumbnail: video.thumbnail ? convertToPhotoSize(video.thumbnail) : undefined,
      file_name: video.file_name,
      mime_type: video.mime_type,
      file_size: video.video.size,
    };
  }
  if (message.content._ === 'messageVideoNote') {
    const video = message.content.video_note;
    newMessage.video_note = {
      file_id: video.video.remote.id,
      file_unique_id: video.video.remote.id,
      length: video.length,
      duration: video.duration,
      thumbnail: video.thumbnail ? convertToPhotoSize(video.thumbnail) : undefined,
      file_size: video.video.size,
    };
  }
  if (message.content._ === 'messageDocument') {
    const { document } = message.content;
    newMessage.document = {
      file_id: document.document.remote.id,
      file_unique_id: document.document.remote.id,
      thumbnail: document.thumbnail ? convertToPhotoSize(document.thumbnail) : undefined,
      file_name: document.file_name,
      mime_type: document.mime_type,
      file_size: document.document.size,
    };
  }
  if (message.content._ === 'messageAnimation') {
    const { animation } = message.content;
    newMessage.animation = {
      file_id: animation.animation.remote.id,
      file_unique_id: animation.animation.remote.id,
      width: animation.width,
      height: animation.height,
      duration: animation.duration,
      thumbnail: animation.thumbnail ? convertToPhotoSize(animation.thumbnail) : undefined,
      file_name: animation.file_name,
      mime_type: animation.mime_type,
      file_size: animation.animation.size,
    };
  }
  if (message.content._ === 'messageSticker') {
    const { sticker } = message.content;
    let type = '';
    switch (sticker.full_type._) {
      case 'stickerFullTypeRegular':
        type = 'regular';
        break;
      case 'stickerFullTypeMask':
        type = 'mask';
        break;
      case 'stickerFullTypeCustomEmoji':
        type = 'custom_emoji';
        break;
    }
    newMessage.sticker = {
      file_id: sticker.sticker.remote.id,
      file_unique_id: sticker.sticker.remote.id,
      type,
      width: sticker.width,
      height: sticker.height,
      is_animated: sticker.format._ === 'stickerFormatTgs',
      is_video: sticker.format._ === 'stickerFormatWebm',
      thumbnail: sticker.thumbnail ? convertToPhotoSize(sticker.thumbnail) : undefined,
      emoji: sticker.emoji,
      set_name: undefined, // TODO:
      premium_animation: undefined, // TODO:
      mask_position: undefined, // TODO:
      custom_emoji_id: undefined, // TODO:
      needs_repainting: undefined, // TODO:
      file_size: sticker.sticker.size,
    };
  }
  if (message.content._ === 'messageLocation') {
    const { location } = message.content;
    newMessage.location = {
      longitude: location.longitude,
      latitude: location.latitude,
      horizontal_accuracy: location.horizontal_accuracy,
      live_period: message.content.live_period,
      heading: message.content.heading,
      proximity_alert_radius: message.content.proximity_alert_radius,
    };
  }
  if (message.content._ === 'messagePoll') {
    const { poll } = message.content;
    let type = '';
    switch (poll.type._) {
      case 'pollTypeRegular':
        type = 'regular';
        break;
      case 'pollTypeQuiz':
        type = 'quiz';
        break;
    }
    newMessage.poll = {
      id: poll.id,
      question: poll.question,
      options: poll.options.map((item) => {
        if (item._ === 'pollOption') {
          return {
            text: item.text,
            voter_count: item.voter_count,
          };
        }
        return {};
      }),
      total_voter_count: poll.total_voter_count,
      is_closed: poll.is_closed,
      is_anonymous: poll.is_anonymous,
      type,
      allows_multiple_answers: poll.allow_multiple_answers || false,
      correct_option_id: undefined, // TODO:
      explanation: undefined, // TODO:
      explanation_entities: undefined, // TODO:
      open_period: poll.open_period,
      close_date: poll.close_date,
    };
  }
  if (message.content._ === 'messageVoiceNote') {
    const voiceNote = message.content.voice_note;
    newMessage.voice = {
      file_id: voiceNote.voice.remote.id,
      file_unique_id: voiceNote.voice.remote.id,
      duration: voiceNote.duration,
      mime_type: voiceNote.mime_type,
      file_size: voiceNote.voice.size,
    };
  }
  if (message.content._ === 'messageContact') {
    const { contact } = message.content;
    newMessage.contact = {
      phone_number: contact.phone_number,
      first_name: contact.first_name,
      last_name: contact.last_name,
      user_id: contact.user_id,
      vcard: contact.vcard,
    };
  }
  if (message.forward_info) {
    if (message.forward_info.origin._ === 'messageForwardOriginUser') {
      const user2 = await this.tdlib.invoke({
        _: 'getUser',
        user_id: message.forward_info.origin.sender_user_id,
      });
      newMessage.forward_from = {
        id: user2.id,
        is_bot: user2.type._ === 'userTypeBot',
        first_name: user2.first_name,
        last_name: user2.last_name,
        username: user?.usernames?.editable_username || user2.username || '',
        language_code: user2.language_code,
      };
    }
    newMessage.forward_date = message.forward_info.date;
  }
  if (message.content._ === 'messageChatAddMembers') {
    newMessage.new_chat_members = await map(message.content.member_user_ids, (id) =>
      // TODO: user get
      ({
        id,
      }),
    );
  }

  this.log.trace('[convertToTelegrafMessage]', message, newMessage);
  return newMessage;
}
