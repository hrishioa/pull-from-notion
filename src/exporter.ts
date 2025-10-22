import { Client } from '@notionhq/client';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as cliProgress from 'cli-progress';

async function getNotionClient(): Promise<Client> {
  let token = process.env.NOTION_TOKEN;
  if (!token) {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Please enter your Notion API token:',
      },
    ]);
    token = answers.token;
  }
  return new Client({ auth: token });
}

function blockToMarkdown(block: any): string {
    switch (block.type) {
      case "paragraph":
        return block.paragraph.rich_text.map((t: any) => t.plain_text).join("") + "\n\n";
      case "heading_1":
        return `# ${block.heading_1.rich_text.map((t: any) => t.plain_text).join("")}\n\n`;
      case "heading_2":
        return `## ${block.heading_2.rich_text.map((t: any) => t.plain_text).join("")}\n\n`;
      case "heading_3":
        return `### ${block.heading_3.rich_text.map((t: any) => t.plain_text).join("")}\n\n`;
      case "bulleted_list_item":
        return `* ${block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join("")}\n`;
      case "numbered_list_item":
          return `1. ${block.numbered_list_item.rich_text.map((t: any) => t.plain_text).join("")}\n`;
      case "to_do":
          return `[${block.to_do.checked ? "x" : " "}] ${block.to_do.rich_text.map((t: any) => t.plain_text).join("")}\n`;
      case "quote":
          return `> ${block.quote.rich_text.map((t: any) => t.plain_text).join("")}\n\n`;
      case "divider":
          return "---\n\n";
      default:
        return "";
    }
  }

async function formatComments(comments: any[], isMarkdown: boolean, notion: Client, userCache: Map<string, string>): Promise<any> {
    const commentsByDiscussionId = new Map<string, any[]>();
    for (const comment of comments) {
        const discussionId = (comment as any).discussion_id;
        if (!commentsByDiscussionId.has(discussionId)) {
            commentsByDiscussionId.set(discussionId, []);
        }
        commentsByDiscussionId.get(discussionId)?.push(comment);
    }

    const getUserName = async (userId: string): Promise<string> => {
        if (userCache.has(userId)) {
            return userCache.get(userId)!;
        }
        try {
            const user = await notion.users.retrieve({ user_id: userId });
            const name = (user as any).name || 'Unknown User';
            userCache.set(userId, name);
            return name;
        } catch (error) {
            userCache.set(userId, 'Unknown User');
            return 'Unknown User';
        }
    };

    if (isMarkdown) {
        let markdown = "> ---\n";
        for (const [discussionId, discussionComments] of commentsByDiscussionId.entries()) {
            for (const comment of discussionComments) {
                const author = await getUserName((comment as any).created_by.id);
                const timestamp = new Date(comment.created_time).toLocaleString();
                markdown += `> **${author}** (${timestamp}): ${comment.rich_text.map((t: any) => t.plain_text).join("")}\n`;
            }
            markdown += ">\n";
        }
        return markdown;
    } else {
        const json: any[] = [];
        for (const [discussionId, discussionComments] of commentsByDiscussionId.entries()) {
            const formattedComments = [];
            for (const comment of discussionComments) {
                formattedComments.push({
                    id: comment.id,
                    author: await getUserName((comment as any).created_by.id),
                    created_time: comment.created_time,
                    last_edited_time: comment.last_edited_time,
                    text: comment.rich_text.map((t: any) => t.plain_text).join(""),
                });
            }
            json.push({
                discussion_id: discussionId,
                comments: formattedComments
            });
        }
        return json;
    }
}


export async function exportNotionPage(pageId: string, outputPath: string = process.cwd(), format: string) {
  const notion = await getNotionClient();
  const userCache = new Map<string, string>();

  console.log('Fetching page content...');
  const pageComments = await notion.comments.list({ block_id: pageId });
  const pageContent = await notion.blocks.children.list({ block_id: pageId });

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  console.log('Fetching block comments...');
  progressBar.start(pageContent.results.length, 0);

  const blocksWithComments: any[] = [];
  for (const block of pageContent.results) {
    const blockComments = await notion.comments.list({ block_id: block.id });
    blocksWithComments.push({
      ...block,
      comments: blockComments.results,
    });
    progressBar.increment();
  }
  progressBar.stop();

  const pageData = {
    page_level_comments: pageComments.results,
    blocks: blocksWithComments,
  };

  if (format === 'json' || format === 'both') {
    const jsonContent = {
        page_level_comments: await formatComments(pageData.page_level_comments, false, notion, userCache),
        blocks: await Promise.all(pageData.blocks.map(async (block) => ({
            ...block,
            comments: await formatComments(block.comments, false, notion, userCache)
        })))
    };
    const jsonPath = path.join(outputPath, `${pageId}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(jsonContent, null, 2));
    console.log(`\nSuccessfully exported JSON to ${jsonPath}`);
  }

  if (format === 'markdown' || format === 'both') {
    let markdown = "";
    if (pageData.page_level_comments.length > 0) {
        markdown += "## Page Comments\n\n";
        markdown += await formatComments(pageData.page_level_comments, true, notion, userCache);
        markdown += "\n";
    }

    for (const block of pageData.blocks) {
        markdown += blockToMarkdown(block);
        if (block.comments.length > 0) {
            markdown += await formatComments(block.comments, true, notion, userCache);
            markdown += "\n";
        }
    }
    const markdownPath = path.join(outputPath, `${pageId}.md`);
    await fs.writeFile(markdownPath, markdown);
    console.log(`Successfully exported Markdown to ${markdownPath}`);
  }
}
