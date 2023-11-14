/* eslint-disable max-len */
import { delay } from 'fishbird';
import { readFileSync } from 'fs';
import { Context } from 'telegraf';
import { Update } from 'telegraf/types';

export const mdExample = `
*bold \\*text*
_italic \\*text_
__underline__
~strikethrough~
||spoiler||
*bold _italic bold ~italic bold strikethrough ||italic bold strikethrough spoiler||~ __underline italic bold___ bold*
[inline URL](http://www.example.com/)
[inline mention of a user](tg://user?id=123456789)
![👍](tg://emoji?id=5368324170671202286)
\`inline fixed-width code\`
\`\`\`
pre-formatted fixed-width code block
\`\`\`
\`\`\`python
pre-formatted fixed-width code block written in the Python programming language
\`\`\`  
  `;

export const htmlExample = `
<b>bold *text*</b>
<i>italic *text*</i>
<u>underline</u>
<del>strikethrough</del>
<span class="tg-spoiler">poiler</span>
<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>
`;

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
