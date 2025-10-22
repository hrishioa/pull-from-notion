# Notion Comments Exporter

A simple CLI tool to export a Notion page with its comments to Markdown, JSON, or both.

## Installation

You can install this tool globally using npm or bun:

```bash
npm install -g notion-comments-exporter
```

or

```bash
bun install -g notion-comments-exporter
```

## Usage

You can also use the tool directly with `npx` or `bunx`:

```bash
npx notion-comments-exporter --page-id <your-page-id>
```

### Options

| Option          | Description                                                 | Default               |
| --------------- | ----------------------------------------------------------- | --------------------- |
| `-p, --page-id` | **(Required)** The ID of the Notion page to export.         |                       |
| `-o, --output-path` | The path to save the output file(s).                      | Current directory     |
| `-f, --format`  | The output format (`markdown`, `json`, or `both`).          | `both`                |

### Authentication

The tool requires a Notion API token to access your Notion workspace. You can provide the token in one of two ways:

1.  **Environment Variable:** Set the `NOTION_TOKEN` environment variable to your API token.
2.  **Prompt:** If the `NOTION_TOKEN` environment variable is not set, the tool will prompt you to enter your token securely.
