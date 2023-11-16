/* eslint-disable max-len */
import { createReadStream, readFileSync } from 'node:fs';

import { log } from '@lskjs/log/log';
import { delay } from 'fishbird';
import { Context } from 'telegraf';
import { Update } from 'telegraf/types';

const debugUserId = 1227280;

export const mdExampleMin = `
*bold text*
_italic text_
__underline__
[inline URL](http://www.example.com/)
`;

export const htmlExampleMin = `
<b>bold text</b>
<i>italic text</i>
<u>underline</u>
<a href="http://www.example.com/">inline URL</a>
`;

export const mdExample = `
*bold text*
_italic *text_
__underline__
~strikethrough~
||spoiler||
*bold _italic bold ~italic bold strikethrough ||italic bold strikethrough spoiler||~ __underline italic bold___ bold*
[inline URL](http://www.example.com/)
[inline mention of a user](tg://user?id=${debugUserId})
![👍](tg://emoji?id=5368324170671202286)
\`inline fixed-width code\`
\`\`\`
pre-formatted fixed-width code block
\`\`\`
\`\`\`python
pre-formatted fixed-width code block written in the Python programming language
\`\`\`  
`;

export const mdExampleExtended = `
*bold \\*text*
_italic \\*text_
__underline__
~strikethrough~
||spoiler||
*bold _italic bold ~italic bold strikethrough ||italic bold strikethrough spoiler||~ __underline italic bold___ bold*
[inline URL](http://www.example.com/)
[inline mention of a user](tg://user?id=${debugUserId})
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
<a href="tg://user?id=${debugUserId}">inline mention of a user</a>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>
`;

const wait = () => delay(2000);

export const createOnTestCommand = ({ assetsDir }) =>
  async function onTestCommandSample(ctx: Context<Update>) {
    await ctx.reply('Test start', { reply_to_message_id: ctx.message?.message_id });

    // @ts-ignore
    const cases = ctx.message?.text?.split(' ')[1]?.split(',') || null;

    if (!cases || cases.includes('1')) {
      await wait();
      await ctx.sendChatAction('typing');
      await wait();
      await ctx.reply('1. Text Message').catch((err) => {
        log.error('[err] 1. Text Message ', err);
      });
    }

    if (!cases || cases.includes('2')) {
      await wait();
      await ctx.sendChatAction('typing');
      await wait();
      await ctx
        .replyWithMarkdown(`2 Text Message with Markdown\n${mdExampleMin}`, {
          parse_mode: 'MarkdownV2',
        })
        .catch((err) => {
          log.error('[err] 2 Text Message with Markdown ', err);
        });
    }

    if (!cases || cases.includes('3')) {
      await wait();
      await ctx.sendChatAction('typing');
      await wait();
      await ctx.replyWithHTML(`3. Text Message with HTML\n${htmlExampleMin}`).catch((err) => {
        log.error('[err] 3. Text Message with HTML ', err);
      });
    }

    if (!cases || cases.includes('4')) {
      await wait();
      await ctx.sendChatAction('upload_photo');
      await wait();
      await ctx
        .replyWithPhoto(
          { source: `${assetsDir}/photo1.jpg` },
          { caption: '4.1. Image (FileByPath) with caption' },
        )
        .catch((err) => {
          log.error('[err] 4.1. Image (FileByPath) with caption', err);
        });
      await wait();
      await ctx
        .replyWithPhoto(
          { source: readFileSync(`${assetsDir}/photo2.png`) },
          { caption: '4.2. Image (FileByBuffer) with caption' },
        )
        .catch((err) => {
          log.error('[err] 4.2. Image (FileByBuffer) with caption', err);
        });
      await wait();
      await ctx
        .replyWithPhoto(
          {
            // source: `https://raw.githubusercontent.com/TdTelegraf/tdtelegraf/master/libs/tdtelegraf/test/assets/photo1.jpg`,
            url: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/JavaScript_code.png/300px-JavaScript_code.png`,
          },
          { caption: '4.3. Image (FileByUrl) with caption' },
        )
        .catch((err) => {
          log.error('[err] 4.3. Image (FileByUrl) with caption', err);
        });
      await wait();
      await ctx
        .replyWithPhoto(
          {
            source: createReadStream(`${assetsDir}/photo1.jpg`),
          },
          { caption: '4.4. Image (FileByReadableStream) with caption' },
        )
        .catch((err) => {
          log.error('[err] 4.4. Image (FileByReadableStream) with caption', err);
        });
    }

    if (!cases || cases.includes('5')) {
      await wait();
      await ctx.sendChatAction('upload_photo');
      await wait();
      await ctx
        .sendMediaGroup([
          {
            type: 'photo',
            media: {
              source: readFileSync(`${assetsDir}/photo2.png`),
              filename: 'Фотка 2',
            },
            caption: '5. Media Group with images with caption',
          },
          {
            type: 'photo',
            media: {
              source: readFileSync(`${assetsDir}/photo3.webp`),
              filename: 'Фотка 3',
            },
            // caption: 'Second image',
          },
        ])
        .catch((err) => {
          log.error('[err] 5. Media Group with images with caption ', err);
        });
    }

    if (!cases || cases.includes('6')) {
      await wait();
      await ctx.sendChatAction('upload_video');
      await wait();
      await ctx
        .replyWithVideo({ source: `${assetsDir}/video.mov` }, { caption: '6. Video with caption' })
        .catch((err) => {
          log.error('[err] 6. Video with caption', err);
        });
    }

    if (!cases || cases.includes('7')) {
      await wait();
      await ctx.sendChatAction('record_video_note');
      await wait();
      await ctx.replyWithVideoNote({ source: `${assetsDir}/videoNote.mp4` }).catch((err) => {
        log.error('[err] 7. VideoNote', err);
      });
    }

    if (!cases || cases.includes('8')) {
      await wait();
      await ctx.sendChatAction('upload_document');
      await wait();
      await ctx
        .replyWithDocument(
          { source: `${assetsDir}/gif.mp4` },
          { caption: '8. Document aka GIF with caption' },
        )
        .catch((err) => {
          log.error('[err] 8. Document aka GIF with caption', err);
        });
    }

    if (!cases || cases.includes('9')) {
      await wait();
      await ctx.sendChatAction('upload_document');
      await wait();
      await ctx
        .replyWithDocument(
          { source: `${assetsDir}/like-gif.mp4` },
          { caption: '9. MP4 without sound aka GIF with caption' },
        )
        .catch((err) => {
          log.error('[err] 9. MP4 without sound aka GIF with caption', err);
        });
    }

    if (!cases || cases.includes('10')) {
      await wait();
      await ctx.sendChatAction('upload_document');
      await wait();
      await ctx
        .replyWithDocument(
          { source: `${assetsDir}/file.json` },
          { caption: '10. File with caption' },
        )
        .catch((err) => {
          log.error('[err] 10. File with caption', err);
        });
    }

    if (!cases || cases.includes('12')) {
      await wait();
      await ctx.sendChatAction('typing');
      await wait();
      await ctx
        .replyWithMarkdown(`12 Text Message with Markdown - Extendended\n${mdExample}`, {
          parse_mode: 'MarkdownV2',
          // force: true,
        })
        .catch((err) => {
          log.error('[err] 12 Text Message with Markdown - Extendended', err);
          ctx.reply(`[err] ${err.message}`);
        });
    }

    if (!cases || cases.includes('13')) {
      await wait();
      await ctx.sendChatAction('typing');
      await wait();
      await ctx
        .replyWithHTML(`13. Text Message with HTML - Extendended\n${htmlExample}`)
        .catch((err) => {
          log.error('[err] 13. Text Message with HTML - Extendended', err);
        });
    }

    await wait();
    await ctx.reply('Test finish');
  };

export const onTestCommand = createOnTestCommand({ assetsDir: `${process.cwd()}/test/assets` });
