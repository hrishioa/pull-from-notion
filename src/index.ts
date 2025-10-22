#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { exportNotionPage } from './exporter';
import { isNotionClientError } from '@notionhq/client';

dotenv.config({ quiet: true });

const program = new Command();

import * as path from 'path';

// ... (imports)

program
  .name('pull-from-notion')
  .description('Export a Notion page with comments to Markdown, JSON, or both.')
  .version('1.1.0') // Bump version for new features
  .argument('<pageId>', 'The ID or full URL of the Notion page to export')
  .option('-o, --output-path <outputPath>', 'The output directory or filename')
  .option('-f, --format <format>', 'The output format (markdown, json, or both)', 'markdown')
  .action(async (pageId, options) => {
    try {
      let format = options.format;
      const outputPath = options.outputPath;

      // Infer format from output path extension, overriding the format option.
      if (outputPath) {
        const extension = path.extname(outputPath);
        if (extension === '.md') {
          format = 'markdown';
        } else if (extension === '.json') {
          format = 'json';
        }
      }

      // Check if the input is a URL and extract the page ID
      const urlRegex = /([a-f0-9]{32})/;
      const match = pageId.match(urlRegex);
      if (match) {
        pageId = match[1];
      }

      if (!/^[a-f0-9]{32}$/.test(pageId)) {
        console.error(`
Error: Invalid Notion page ID or URL.
A page ID is a 32-character string, like "2915fec70db180ef94c9fa1a52227e77".
You can find it in the Notion page URL.
        `);
        process.exit(1);
      }

      await exportNotionPage(pageId, outputPath, format);
    } catch (error) {
        console.error('\nAn error occurred while exporting the Notion page.');
        if (isNotionClientError(error)) {
            switch (error.code) {
                case 'unauthorized':
                    console.error(`
Error: Invalid Notion API token.
Please make sure your NOTION_TOKEN is correct and has the necessary permissions.
You can create an integration here: https://www.notion.so/my-integrations
                    `);
                    break;
                case 'object_not_found':
                    console.error(`
Error: Page not found.
Please make sure the page ID is correct and that your integration has been shared with the page.
                    `);
                    break;
                default:
                    console.error(error.message);
            }
        } else {
            console.error(error);
        }
        process.exit(1);
    }
  });


program.parse(process.argv);
