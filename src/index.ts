#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { exportNotionPage } from './exporter';

dotenv.config();

const program = new Command();

program
  .name('notion-comments-exporter')
  .description('Export a Notion page with comments to Markdown, JSON, or both.')
  .version('1.0.0');

program
  .requiredOption('-p, --page-id <pageId>', 'The ID of the Notion page to export')
  .option('-o, --output-path <outputPath>', 'The path to save the output file(s) (defaults to current directory)')
  .option('-f, --format <format>', 'The output format (markdown, json, or both)', 'both')
  .action(async (options) => {
    try {
      await exportNotionPage(options.pageId, options.outputPath, options.format);
    } catch (error) {
      console.error('Error exporting Notion page:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
