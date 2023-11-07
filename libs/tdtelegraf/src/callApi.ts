import { omitNull } from '@lskjs/algos';
import { isDev } from '@lskjs/env';
import { Err } from '@lskjs/err';
import { map } from 'fishbird';
import { mkdir, writeFile } from 'fs/promises';

import { downloadFile } from './downloadFile';

const saveMock = async (name, data) => {
  if (isDev) {
    const dirname = `${__dirname}/../../../__mocks`;
    await mkdir(dirname, { recursive: true });
    await writeFile(`${dirname}/${name}`, JSON.stringify(data, null, 2));
  }
};

const transformRes = (res) => {
  if (Array.isArray(res?.messages)) {
    return res?.messages?.map((item) => transformRes(item));
  }
  return {
    message_id: res.id,
    date: res.date,
    from: {
      id: res.sender_id?.user_id,
      is_bot: true, // NOTE: подумать поб этом
      is_tdl: true,
    },
    chat: {
      id: res.chat_id,
    },
    text: res.content?.text?.text || res.content?.caption?.text,
  };
};
export async function callApi(name, props: any, clientOptions: any) {
  await saveMock(`${name}.callApi.req.json`, props);
  const extra = {
    reply_to: props.reply_to_message_id
      ? {
          _: 'messageReplyToMessage',
          message_id: props.reply_to_message_id,
        }
      : null,
  };
  const wrapText = (rawText) =>
    props.parse_mode
      ? this.tdlib.execute({
          _: 'parseTextEntities',
          parse_mode: { _: 'textParseModeMarkdown' },
          text: rawText,
        })
      : {
          _: 'formattedText',
          text: rawText,
        };
  if (name === 'sendChatAction') {
    this.log.debug('[callApi]', `[${name}]`, props, clientOptions);
    const chatId = props.chat_id;
    const { action } = props;

    const data = {
      _: 'sendChatAction',
      chat_id: chatId,
      action: {
        _: action === 'typing' ? 'chatActionTyping' : null,
      },
    };
    await saveMock(`${name}.tdlib.req.json`, data);
    const res = await this.tdlib.invoke(data);
    await saveMock(`${name}.tdlib.res.json`, res);
    // this.log.debug('[callApi]', `[${name}] res`, res);
    return res;
  }
  if (name === 'sendMessage') {
    this.log.debug('[callApi]', `[${name}]`, props, clientOptions);
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
  if (name === 'sendVideo') {
    this.log.debug('[callApi]', `[${name}]`, props, clientOptions);
    const chatId = props.chat_id;
    if (!props.video?.url) throw new Err('!props.video?.url');
    const filePath = await downloadFile(props.video?.url, '/tmp');
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
  if (name === 'sendAudio') {
    this.log.debug('[callApi]', `[${name}]`, props, clientOptions);
    const chatId = props.chat_id;
    if (!props.audio?.url) throw new Err('!props.audio?.url');
    const filePath = await downloadFile(props.audio?.url, '/tmp');
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
    this.log.debug('[callApi]', `[${name}]`, props, clientOptions);
    const chatId = props.chat_id;
    if (!props.voice?.url) throw new Err('!props.voice?.url');
    const filePath = await downloadFile(props.voice?.url, '/tmp');
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
    this.log.debug('[callApi]', `[${name}]`, props, clientOptions);
    const chatId = props.chat_id;
    if (!props.video_note?.url) throw new Err('!props.video_note?.url');
    const filePath = await downloadFile(props.video_note?.url, '/tmp');
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
    this.log.debug('[callApi]', `[${name}]`, props, props?.media, clientOptions);
    const chatId = props.chat_id;
    const data = {
      _: 'sendMessageAlbum',
      chat_id: chatId,
      input_message_contents: await map(props.media, async (mediaItem) =>
        omitNull({
          _: mediaItem?.type === 'video' ? 'inputMessageVideo' : 'inputMessagePhoto',
          [mediaItem?.type]: {
            _: 'inputFileLocal',
            path: await downloadFile(mediaItem?.media.url, '/tmp'),
          },
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
  this.log.warn('[callApi]', `[${name}]`, props, clientOptions);
  return null;
}
