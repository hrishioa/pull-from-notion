# pull-from-notion

A CLI tool to export a Notion page, including all its comments and replies, into structured JSON and clean Markdown files.

This tool fetches page content, page-level comments, and comments on every individual block, then formats them for easy use elsewhere.

## Features

-   Export page content to Markdown and JSON.
-   Fetches page-level comments and comments on specific blocks.
-   Retrieves real user names for comments.
-   Groups comment threads and replies correctly.
-   Accepts either a Notion Page ID or a full Notion Page URL.
-   Progress bar for fetching comments on large pages.

## Installation

You can install this tool globally to use it anywhere on your system.

```bash
npm install -g pull-from-notion
```

or with bun:

```bash
bun install -g pull-from-notion
```

## Usage

You can run the tool directly without installation using `npx` or `bunx`.

```bash
npx pull-from-notion <your-page-id-or-url> [options]
```

### Command Options

| Argument/Option       | Alias | Description                                                        | Default               |
| --------------------- | ----- | ------------------------------------------------------------------ | --------------------- |
| `<pageId>`            |       | **(Required)** The ID or full URL of the Notion page to export.    |                       |
| `--output-path <path>`| `-o`  | The output directory or a specific filename (e.g., `my-export.md`).| Current directory     |
| `--format <format>`   | `-f`  | The output format (`markdown`, `json`, or `both`).                 | `markdown`            |

### Inferring Format from Output Path

If you provide a specific filename for the `--output-path`, the tool will automatically infer the format from the file extension.

-   `--output-path my-export.md` will force the format to `markdown`.
-   `--output-path my-export.json` will force the format to `json`.

This overrides the `--format` flag.

### Examples

**1. Export using a Page ID (default options):**
This will create a `<page-id>.md` file in your current directory.
```bash
npx pull-from-notion 2915fec70db180ef94c9fa1a52227e77
```

**2. Export using a full Notion URL to both formats:**
```bash
npx pull-from-notion "https://www.notion.so/your-workspace/Page-Title-2915fec70db180ef94c9fa1a52227e77" --format both
```

**3. Export to a specific Markdown file:**
This will create a file named `my-page-export.md`.
```bash
npx pull-from-notion <page-id> -o my-page-export.md
```

**4. Export to a specific directory:**
This will create `<page-id>.md` inside the `exports` directory.
```bash
npx pull-from-notion <page-id> -o ./exports
```

## Output Format

### Markdown

The Markdown file is structured to be as readable as possible. Comments are associated with the block of text they belong to.

-   **Page-level comments** are listed at the top of the document.
-   **Block-level comments** (comments on a specific paragraph, heading, etc.) are placed in a blockquote immediately following the text block they refer to. This provides clear context for which text is being discussed.

Example of a block with a comment:
```markdown
This is a paragraph of text from the Notion page.

> ---
> > **Jane Doe** (10/20/2025, 1:15:30 PM): This is a comment on the paragraph above.
> > **John Smith** (10/20/2025, 1:16:05 PM): This is a reply to Jane's comment.
>
```

### JSON

The JSON file provides a structured representation of the page, including all blocks and their associated comment threads. This is useful for programmatic use.

## Authentication

The tool requires a Notion API token to work. You can provide it in two ways:

1.  **Environment Variable (Recommended):** Create a `.env` file in the directory where you run the command and add your token:
    ```
    NOTION_TOKEN="secret_..."
    ```
    The tool will automatically load it.

2.  **Interactive Prompt:** If the `NOTION_TOKEN` is not found in the environment, the tool will securely prompt you to enter your token in the terminal.
