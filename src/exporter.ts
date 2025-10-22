import { Client } from '@notionhq/client';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as cliProgress from 'cli-progress';

/**
 * Retrieves the Notion API client.
 * It first checks for the NOTION_TOKEN environment variable.
 * If not found, it prompts the user to enter the token.
 * @returns {Promise<Client>} A Notion client instance.
 */
async function getNotionClient(): Promise<Client> {
  let token = process.env.NOTION_TOKEN;
  if (!token) {
    console.log('NOTION_TOKEN environment variable not found.');
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

/**
 * Converts a Notion block object to its Markdown representation.
 * @param {any} block - The Notion block object.
 * @returns {string} The Markdown string.
 */
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

/**
 * Formats a list of comments into either a Markdown string or a JSON object.
 * @param {any[]} comments - The list of comment objects.
 * @param {boolean} isMarkdown - Whether to format as Markdown or JSON.
 * @param {Client} notion - The Notion client instance.
 * @param {Map<string, string>} userCache - A cache for user names.
 * @returns {Promise<any>} The formatted comments.
 */
async function formatComments(comments: any[], isMarkdown: boolean, notion: Client, userCache: Map<string, string>): Promise<any> {
    // Group comments by their discussion thread
    const commentsByDiscussionId = new Map<string, any[]>();
    for (const comment of comments) {
        const discussionId = (comment as any).discussion_id;
        if (!commentsByDiscussionId.has(discussionId)) {
            commentsByDiscussionId.set(discussionId, []);
        }
        commentsByDiscussionId.get(discussionId)?.push(comment);
    }

    /**
     * Retrieves the name of a user, using a cache to avoid redundant API calls.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<string>} The user's name.
     */
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
            // If the user can't be fetched, return a default name
            userCache.set(userId, 'Unknown User');
            return 'Unknown User';
        }
    };

    if (isMarkdown) {
        let markdown = "> ---\n"; // Visual separator for comment threads
        for (const [discussionId, discussionComments] of commentsByDiscussionId.entries()) {
            for (const comment of discussionComments) {
                const author = await getUserName((comment as any).created_by.id);
                const timestamp = new Date(comment.created_time).toLocaleString();
                markdown += `> **${author}** (${timestamp}): ${comment.rich_text.map((t: any) => t.plain_text).join("")}\n`;
            }
            markdown += ">\n"; // Add a space between replies in the same thread
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

/**
 * Determines the final output paths for the files.
 * @param {string} pageId - The ID of the Notion page.
 * @param {string} [outputPath] - The user-provided output path (can be a directory or a filename).
 * @returns {{jsonPath: string, markdownPath: string, outputDir: string}} The resolved paths.
 */
function getOutputPaths(pageId: string, outputPath?: string) {
    const CWD = process.cwd();
    let outputDir = outputPath ? path.resolve(CWD, path.dirname(outputPath)) : CWD;
    let baseFilename = pageId;

    if (outputPath) {
        const extension = path.extname(outputPath);
        if (extension === '.md' || extension === '.json') {
            baseFilename = path.basename(outputPath, extension);
        } else {
            // If outputPath is a directory
            outputDir = path.resolve(CWD, outputPath);
        }
    }

    return {
        jsonPath: path.join(outputDir, `${baseFilename}.json`),
        markdownPath: path.join(outputDir, `${baseFilename}.md`),
        outputDir: outputDir,
    };
}

/**
 * The main function for exporting a Notion page.
 * @param {string} pageId - The ID of the Notion page to export.
 * @param {string} [outputPath] - The path to save the output file(s).
 * @param {string} format - The output format (markdown, json, or both).
 */
export async function exportNotionPage(pageId: string, outputPath?: string, format: string = 'markdown') {
  const notion = await getNotionClient();
  const userCache = new Map<string, string>(); // Cache for user names

  // 1. Fetch page-level comments and the page's content (blocks)
  console.log('Fetching page content...');
  const pageComments = await notion.comments.list({ block_id: pageId });
  const pageContent = await notion.blocks.children.list({ block_id: pageId });

  // 2. For each block, fetch its associated comments
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  console.log('Fetching comments for each block...');
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

  const { jsonPath, markdownPath, outputDir } = getOutputPaths(pageId, outputPath);
  await fs.mkdir(outputDir, { recursive: true }); // Ensure output directory exists

  // 3. Write the output files based on the chosen format
  if (format === 'json' || format === 'both') {
    const jsonContent = {
        page_level_comments: await formatComments(pageData.page_level_comments, false, notion, userCache),
        blocks: await Promise.all(pageData.blocks.map(async (block) => ({
            ...block,
            comments: await formatComments(block.comments, false, notion, userCache)
        })))
    };
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
    await fs.writeFile(markdownPath, markdown);
    console.log(`Successfully exported Markdown to ${markdownPath}`);
  }
}
