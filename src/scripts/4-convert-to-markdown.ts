import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const pageId = "2915fec70db180ef94c9fa1a52227e77";

// Helper function to convert block to Markdown
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

// Helper function to format comments
function formatComments(comments: any[]): string {
    let markdown = "";
    const commentsByDiscussionId = new Map<string, any[]>();
    for (const comment of comments) {
        const discussionId = (comment as any).discussion_id;
        if (!commentsByDiscussionId.has(discussionId)) {
            commentsByDiscussionId.set(discussionId, []);
        }
        commentsByDiscussionId.get(discussionId)?.push(comment);
    }

    for (const [discussionId, discussionComments] of commentsByDiscussionId.entries()) {
        for (const comment of discussionComments) {
            markdown += `> **${(comment as any).created_by.name || 'User'}**: ${comment.rich_text.map((t: any) => t.plain_text).join("")}\n`;
        }
        markdown += ">\n"; // Add a separator between discussions
    }
    return markdown;
}


async function main() {
  try {
    let markdown = "";

    // 1. Fetch page-level comments
    const pageComments = await notion.comments.list({ block_id: pageId });
    if (pageComments.results.length > 0) {
        markdown += "## Page Comments\n\n";
        markdown += formatComments(pageComments.results);
        markdown += "\n";
    }

    // 2. Fetch all blocks on the page
    const pageContent = await notion.blocks.children.list({ block_id: pageId });

    // 3. Iterate through each block to fetch its comments and convert to Markdown
    for (const block of pageContent.results) {
      // Add block content to markdown
      markdown += blockToMarkdown(block);

      // Fetch comments for the block
      const blockComments = await notion.comments.list({ block_id: block.id });
      if (blockComments.results.length > 0) {
        markdown += formatComments(blockComments.results);
        markdown += "\n";
      }
    }

    console.log(markdown);

  } catch (error) {
    console.error(error);
  }
}

main();