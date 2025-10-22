import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const pageId = "2915fec70db180ef94c9fa1a52227e77";

async function main() {
  try {
    console.log("Fetching page content...");
    const pageContent = await notion.blocks.children.list({ block_id: pageId });
    console.log("Page Content:", JSON.stringify(pageContent, null, 2));

    console.log("\nFetching comments...");
    const comments = await notion.comments.list({ block_id: pageId });
    console.log("Comments:", JSON.stringify(comments, null, 2));

  } catch (error) {
    console.error(error);
  }
}

main();
