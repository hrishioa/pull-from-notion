# Method for Exporting Notion Comments

This document outlines the proposed method for exporting Notion page content and comments.

## 1. Fetching Page Content

The first step is to fetch the content of the Notion page itself. This can be done by retrieving the block children of the page.

- **Endpoint:** `GET /v1/blocks/{block_id}/children`
- **SDK Method:** `notion.blocks.children.list({ block_id: pageId })`

This will return a list of all the blocks on the page, which represents the page's content.

## 2. Fetching Comments

Next, we need to fetch all the comments on the page.

- **Endpoint:** `GET /v1/comments`
- **SDK Method:** `notion.comments.list({ block_id: pageId })`

This will return a flat list of all comment objects on the page.

## 3. Grouping Comments and Replies

The `notion.comments.list` method returns a flat list of comments. To reconstruct the comment threads (comments and their replies), we need to group them by their `discussion_id`.

We can create a data structure (e.g., a dictionary or a Map) where the keys are the `discussion_id`s and the values are lists of comment objects belonging to that discussion.

## 4. Combining Page Content and Comments

Once we have the page content (blocks) and the grouped comments, we need to combine them. We can iterate through the page blocks and, for each block, find the discussions that are associated with it.

The `parent` property of a comment object will be a `block_id`. We can use this to associate comments with their corresponding blocks.

## 5. Generating Output

Finally, we can generate the output in two formats:

### JSON Output

The JSON output will be a structured representation of the page, including the blocks and their associated comment threads. This will be a relatively straightforward serialization of the data structures we've built.

### Markdown Output

The Markdown output will be a more complex transformation. We'll need to convert the Notion blocks to Markdown syntax. For the comments, we can choose one of two approaches:

1.  **Inline Comments:** Insert the comments directly after the block they are associated with, using a distinct formatting (e.g., blockquotes).
2.  **Footnotes:** Add footnote references next to the blocks with comments, and then list the comments at the end of the document.

## Open Questions and Assumptions

- **Authentication:** The script will need to be configured with a Notion API key with the correct permissions.
- **Rate Limiting:** We need to be mindful of the Notion API's rate limits, especially for pages with a large number of comments. The SDK should handle this gracefully, but it's something to keep in mind.
- **Comment Order:** The comments are returned in chronological order. We should preserve this order when displaying them.
- **Nested Blocks:** The current plan assumes a relatively flat page structure. We'll need to handle nested blocks and their comments correctly.
- **Comment Replies:** The `discussion_id` grouping is the key to handling replies. We'll need to sort the comments within each discussion by their `created_time` to display them in the correct order.
