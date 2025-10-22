# Testing Thoughts and Questions

This document records the thoughts and results from the initial testing phase.

## Test 1: Fetching Comments

- **Script:** `src/scripts/1-fetch-comments.ts`
- **Result:** The script successfully fetched the comments for the test page. The API returned a list of comment objects, as expected.
- **Confirmation:** This confirms that we can retrieve comments from a Notion page using the `@notionhq/client` library.

## Test 2: Fetching Page Content

- **Script:** `src/scripts/2-fetch-page-content.ts`
- **Result:** The script successfully fetched the block children of the test page. The API returned a list of block objects.
- **Confirmation:** This confirms that we can retrieve the content of a Notion page.

## Key Takeaways

- The `@notionhq/client` library provides the necessary methods to fetch both comments and page content.
- The `notion.comments.list` method returns a flat list of comments, which will require us to group them by `discussion_id` to reconstruct comment threads.
- The `notion.blocks.children.list` method returns the content of the page as a list of block objects.

## Next Steps

The next step is to combine the functionality of these two scripts into a single script that:

1.  Fetches the page content.
2.  Fetches the comments.
3.  Groups the comments by `discussion_id`.
4.  Associates the comment threads with the corresponding blocks.
5.  Outputs the combined data in a structured format (JSON).
6.  Converts the structured data into Markdown.

## Open Questions

- How should we handle comments that are not associated with a specific block (i.e., page-level comments)? The `parent` of the comment object will be a `page_id` in this case.
- How should we represent different block types in Markdown? The Notion API returns a variety of block types (e.g., `paragraph`, `heading_1`, `bulleted_list_item`). We'll need to create a mapping from these types to Markdown syntax.
- How should we handle nested blocks? The `has_children` property of a block object indicates whether a block has nested content. We'll need to recursively fetch the children of these blocks.
