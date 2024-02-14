import { omitNull } from '@lsk4/algos';
import { isDev } from '@lsk4/env';
import { Err } from '@lsk4/err';
import { map } from 'fishbird';
import { mkdir, writeFile } from 'fs/promises';

import { log } from './log';
import { uploadMedia } from './uploadMedia';
import {
  convertBotChatActionToTDL,
  convertInputMessageContentTypeToTDL,
  convertTDLChatTypeToTelegraf,
  convertToPhotoSize,
} from './utils';

const saveMock = async (name: string, data: any) => {
  if (isDev) {
    const dirname = `${__dirname}/../../../__mocks`;
    await mkdir(dirname, { recursive: true });
    await writeFile(`${dirname}/${name}`, JSON.stringify(data, null, 2));
  }
};

const transformRes = (res: any) => {
  if (Array.isArray(res?.messages)) {
    return res?.messages?.map((item: any) => transformRes(item));
  }
  return {
    message_id: res.id,
    date: res.date,
    from: {
      id: res.sender_id?.user_id,
      // is_bot: true, // NOTE: подумать поб этом
      is_tdl: true,
    },
    chat: {
      id: res.chat_id,
    },
    text: res.content?.text?.text || res.content?.caption?.text,
  };
};
export async function callApi(this: any, name: string, props: any, clientOptions: any) {
  try {
    await saveMock(`${name}.callApi.req.json`, props);
    const extra = {
      reply_to: null,
      // reply_to: props.reply_to_message_id
      //   ? {
      //       _: 'messageReplyToMessage',
      //       message_id: props.reply_to_message_id,
      //     }
      //   : null,
    };
    const wrapText = (rawText: any) => {
      if (['Markdown', 'MarkdownV2', 'HTML'].includes(props.parse_mode)) {
        let version: number | undefined;
        let _ = 'textParseModeHTML';
        if (['Markdown', 'MarkdownV2'].includes(props.parse_mode)) {
          _ = 'textParseModeMarkdown';
          version = props.parse_mode === 'MarkdownV2' ? 1 : 0;
        }
        // console.log('wrapText', props.parse_mode, rawText);
        const res = this.tdlib.execute({
          _: 'parseTextEntities',
          parse_mode: {
            _,
            version,
          },
          text: rawText,
        });

        if (res._ === 'error') {
          log.warn('[wrapText]', res, rawText);
          return {
            _: 'formattedText',
            text: rawText,
          };
        }

        return res;
      }
      return {
        _: 'formattedText',
        text: rawText,
      };
    };
    if (name === 'getUserProfilePhotos') {
      const { user_id: userId, offset = 0, limit = 100 } = props;
      await this.tdlib.invoke({
        _: 'getUser',
        user_id: userId,
      });
      const response = await this.tdlib.invoke({
        _: 'getUserProfilePhotos',
        user_id: userId,
        offset,
        limit,
      });

      const photos = response.photos.map((ph: any) =>
        ph.sizes.map((size: any) => convertToPhotoSize(size)),
      );

      return {
        total_count: response.total_count,
        photos,
      };
    }
    if (name === 'getChat') {
      const { chat_id: chatId } = props;
      if (chatId > 0) {
        const responseUserInfo = await this.tdlib.invoke({
          _: 'getUser',
          user_id: chatId,
        });
        const responseFullInfo = await this.tdlib.invoke({
          _: 'getUserFullInfo',
          user_id: chatId,
        });
        let photo = null;
        if (responseUserInfo?.profile_photo?.small) {
          photo = {
            small_file_id: responseUserInfo?.profile_photo?.small.remote.id,
            small_file_unique_id: responseUserInfo?.profile_photo?.small.remote.unique_id,
            big_file_id: responseUserInfo?.profile_photo?.big.remote.id,
            big_file_unique_id: responseUserInfo?.profile_photo?.big.remote.unique_id,
          };
        }
        return omitNull({
          id: responseUserInfo.id,
          first_name: responseUserInfo.first_name,
          last_name: responseUserInfo.last_name,
          username: responseUserInfo?.usernames?.editable_username,
          type: 'private', // TODO: inspect this
          active_usernames: responseUserInfo?.usernames?.active_usernames,
          emoji_status_custom_emoji_id: responseUserInfo?.emoji_status?.custom_emoji_id,
          bio: responseFullInfo?.bio?.text,
          has_private_forwards: responseFullInfo.has_private_forwards,
          photo,
        });
      }
      const response = await this.tdlib.invoke({
        _: 'getChat',
        chat_id: chatId,
      });
      const { permissions } = response;
      return {
        id: response.id,
        title: response.title,
        type: convertTDLChatTypeToTelegraf(response.type._),
        permissions: {
          can_send_messages: permissions.can_send_basic_messages,
          can_send_audios: permissions.can_send_audios,
          can_send_documents: permissions.can_send_documents,
          can_send_photos: permissions.can_send_photos,
          can_send_videos: permissions.can_send_videos,
          can_send_video_notes: permissions.can_send_video_notes,
          can_send_voice_notes: permissions.can_send_voice_notes,
          can_send_polls: permissions.can_send_polls,
          can_send_other_messages: permissions.can_send_other_messages,
          can_add_web_page_previews: permissions.can_add_web_page_previews,
          can_change_info: permissions.can_change_info,
          can_invite_users: permissions.can_invite_users,
          can_pin_messages: permissions.can_pin_messages,
          can_manage_topics: permissions.can_manage_topics,
        },
      };
    }
    if (name === 'getChatAdministrators') {
      const { chat_id: chatId } = props;
      const response = await this.tdlib.invoke({
        _: 'getChatAdministrators',
        chat_id: chatId,
      });
      if (Array.isArray(response.administrators)) {
        return map(response.administrators, async (admin: any) => {
          const responseUserInfo = await this.tdlib.invoke({
            _: 'getUser',
            user_id: admin.user_id,
          });
          let status = '';
          if (admin.is_owner) {
            status = 'creator';
          } else {
            status = 'administrator';
          }
          return {
            user: {
              id: responseUserInfo.id,
              is_bot: responseUserInfo.type._ === 'userTypeBot',
              first_name: responseUserInfo.first_name,
              last_name: responseUserInfo.last_name,
              username: responseUserInfo?.usernames?.editable_username,
              language_code: responseUserInfo.language_code,
              is_premium: responseUserInfo.is_premium,
            },
            status,
          };
        });
      }
      return [];
    }
    if (name === 'sendChatAction') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      const { action } = props;

      const data = {
        _: 'sendChatAction',
        chat_id: chatId,
        action: {
          _: convertBotChatActionToTDL(action),
        },
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      // this.log.trace('[callApi]', `[${name}] res`, res);
      return res;
    }
    // TODO: unionize sendMessage
    if (name === 'sendMessage') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      const { text } = props;

      const data = omitNull({
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'inputMessageText',
          text: wrapText(text),
        },
        ...extra,
      });
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendPhoto') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      const { photo } = props;
      if (!photo) throw new Err('!props.photo');
      const filePath = await uploadMedia(props.photo, '/tmp');
      const data = {
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'inputMessagePhoto',
          photo: {
            _: 'inputFileLocal',
            path: filePath,
          },
          caption: props?.caption ? wrapText(props?.caption) : null,
        },
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendVideo') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      if (!props.video) throw new Err('!props.video');
      const filePath = await uploadMedia(props.video, '/tmp');
      const data = {
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'inputMessageVideo',
          video: {
            _: 'inputFileLocal',
            path: filePath,
          },
          caption: props?.caption ? wrapText(props?.caption) : null,
        },
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendDocument') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      if (!props.document) throw new Err('!props.document');
      const filePath = await uploadMedia(props.document, '/tmp');
      const data = {
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'inputMessageDocument',
          document: {
            _: 'inputFileLocal',
            path: filePath,
          },
          caption: props?.caption ? wrapText(props?.caption) : null,
        },
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendAudio') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      if (!props.audio) throw new Err('!props.audio');
      const filePath = await uploadMedia(props.audio, '/tmp');
      const data = {
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'inputMessageAudio',
          audio: {
            _: 'inputFileLocal',
            path: filePath,
          },
          caption: props?.caption ? wrapText(props?.caption) : null,
        },
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendVoice') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      if (!props.voice) throw new Err('!props.voice');
      const filePath = await uploadMedia(props.voice, '/tmp');
      const data = {
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'messageVoiceNote',
          voice: {
            _: 'inputFileLocal',
            path: filePath,
          },
          caption: props?.caption ? wrapText(props?.caption) : null,
        },
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendVideoNote') {
      this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
      const chatId = props.chat_id;
      if (!props.video_note) throw new Err('!props.video_note');
      const filePath = await uploadMedia(props.video_note, '/tmp');
      const data = {
        _: 'sendMessage',
        chat_id: chatId,
        input_message_content: {
          _: 'inputMessageVideoNote',
          video_note: {
            _: 'inputFileLocal',
            path: filePath,
          },
          caption: props?.caption ? wrapText(props?.caption) : null,
        },
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    if (name === 'sendMediaGroup') {
      this.log.trace('[callApi]', `[${name}]`, props, props?.media, clientOptions);
      const chatId = props.chat_id;
      const data = {
        _: 'sendMessageAlbum',
        chat_id: chatId,
        input_message_contents: await map(props.media, async (mediaItem) =>
          omitNull({
            // @ts-ignore
            _: convertInputMessageContentTypeToTDL(mediaItem?.type),
            // @ts-ignore
            [mediaItem?.type]: {
              _: 'inputFileLocal',
              // @ts-ignore
              path: await uploadMedia(mediaItem?.media, '/tmp'),
            },
            // @ts-ignore
            caption: mediaItem?.caption ? wrapText(mediaItem?.caption) : null,
          }),
        ),
        ...extra,
      };
      await saveMock(`${name}.tdlib.req.json`, data);
      const res = await this.tdlib.invoke(data);
      await saveMock(`${name}.tdlib.res.json`, res);
      const tres = transformRes(res);
      await saveMock(`${name}.callApi.res.json`, tres);
      return tres;
    }
    this.log.trace('[callApi]', `[${name}]`, props, clientOptions);
    return null;
  } catch (err) {
    log.warn('[callApi] err', err, { method: name, payload: props, options: clientOptions });
    throw err;
  }
}
