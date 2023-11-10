import { delay } from 'fishbird';
import { readFileSync } from 'fs';
import { Context } from 'telegraf';
import { Update } from 'telegraf/types';

import { htmlExample, mdExample } from './examples';

const wait = () => delay(2000);

export async function onTestCommand(ctx: Context<Update>) {
  await ctx.reply('Test start', { reply_to_message_id: ctx.message?.message_id });

  await wait();
  await ctx.sendChatAction('typing');

  await wait();
  await ctx.reply('1. Text Message');

  await ctx.sendChatAction('typing');
  await wait();
  await ctx.replyWithMarkdown(`2\\. Text Message with MarkDown and some formatting\n${mdExample}`, {
    parse_mode: 'MarkdownV2',
  });

  await ctx.sendChatAction('typing');
  await wait();
  await ctx.replyWithHTML(`3. Text Message with HTML and some formatting\n${htmlExample}`);

  await ctx.sendChatAction('upload_photo');
  await wait();
  await ctx.replyWithPhoto(
    { source: `${__dirname}/../assets/photo1.jpg` },
    { caption: '4. Image with caption' },
  );

  // export type InputFile =
  // | InputFileByPath
  // | InputFileByReadableStream
  // | InputFileByBuffer
  // | InputFileByURL
  await ctx.sendChatAction('upload_photo');
  await wait();
  await ctx.sendMediaGroup([
    {
      type: 'photo',
      media: {
        source: readFileSync(`${__dirname}/../assets/photo2.png`),
        filename: 'Фотка 2',
      },
      caption: '5. Media Group with images with caption',
    },
    {
      type: 'photo',
      media: {
        source: readFileSync(`${__dirname}/../assets/photo3.webp`),
        filename: 'Фотка 3',
      },
      // caption: 'Second image',
    },
  ]);

  await ctx.sendChatAction('upload_video');
  await wait();
  await ctx.replyWithVideo(
    { source: `${__dirname}/../assets/video.mov` },
    { caption: '6. Video with caption' },
  );

  await ctx.sendChatAction('record_video_note');
  await wait();
  await ctx.replyWithVideoNote({ source: `${__dirname}/../assets/videoNote.mp4` }); // '7. VideoNote'

  await ctx.sendChatAction('upload_document');
  await wait();
  await ctx.replyWithDocument(
    { source: `${__dirname}/../assets/gif.mp4` },
    { caption: '*. Document aka GIF with caption' },
  );

  await ctx.sendChatAction('upload_document');
  await wait();
  await ctx.replyWithDocument(
    { source: `${__dirname}/../assets/like-gif.mp4` },
    { caption: '9. MP4 without sound aka GIF with caption' },
  );

  await ctx.sendChatAction('upload_document');
  await wait();
  await ctx.replyWithDocument(
    { source: `${__dirname}/../assets/file.json` },
    { caption: '10. File with caption' },
  );

  await wait();
  await ctx.reply('Test finish');
}
