import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const pageId = "2915fec70db180ef94c9fa1a52227e77";

async function main() {
  try {
    // 1. Fetch page content and comments in parallel
    const [pageContent, comments] = await Promise.all([
      notion.blocks.children.list({ block_id: pageId }),
      notion.comments.list({ block_id: pageId }),
    ]);

    // 2. Group comments by discussion_id
    const commentsByDiscussionId = new Map<string, any[]>();
    for (const comment of comments.results) {
      const discussionId = (comment as any).discussion_id;
      if (!commentsByDiscussionId.has(discussionId)) {
        commentsByDiscussionId.set(discussionId, []);
      }
      commentsByDiscussionId.get(discussionId)?.push(comment);
    }

    // 3. Associate comments with blocks
    const blocksWithComments = pageContent.results.map((block) => {
      const blockId = block.id;
      const commentsForBlock: any[] = [];
      for (const [discussionId, comments] of commentsByDiscussionId.entries()) {
        const firstComment = comments[0];
        if ((firstComment.parent as any).block_id === blockId) {
          commentsForBlock.push({
            discussion_id: discussionId,
            comments: comments,
          });
        }
      }
      return {
        ...block,
        comments: commentsForBlock,
      };
    });

    // 4. Handle page-level comments
    const pageLevelComments: any[] = [];
    for (const [discussionId, comments] of commentsByDiscussionId.entries()) {
      const firstComment = comments[0];
      if ((firstComment.parent as any).page_id) {
        pageLevelComments.push({
          discussion_id: discussionId,
          comments: comments,
        });
        // Remove page-level comments from the map so they are not processed again
        commentsByDiscussionId.delete(discussionId);
      }
    }

    const result = {
      page_level_comments: pageLevelComments,
      blocks: blocksWithComments,
    };

    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error(error);
  }
}

main();
