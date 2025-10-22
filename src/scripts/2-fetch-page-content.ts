import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const pageId = "2915fec70db180ef94c9fa1a52227e77";

async function main() {
  try {
    const response = await notion.blocks.children.list({ block_id: pageId });
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error(error);
  }
}

main();
