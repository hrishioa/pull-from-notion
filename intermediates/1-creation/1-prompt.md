Okay you're in a fresh `bun init -y` folder. We want to make a sideproject that can export a Notion page with comments (and comment replies) and embed them into a proper markdown document (with comments inline or as footnotes) as well as raw JSON. We already have a Notion bot linked in and we have the API key (which we've placed into .env). We've also placed a TEST_PAGE into .env which has been connected to our bot/integration with some test comments.

Let's start by seeing if this is even possible. We've `bun add @notionhq/client` into the project. Can you look through the code for the package in node_modules, search documentation, and conclusively establish whether this is possible, what information we can get, etc.

So could you:
1. Look through the code and documentation to figure out if we have all the endpoints and methods we need for this.
2. Put down initial thoughts and knowledge comprehensively (as well as questions) into `intermediates/1-creation/2-method-untested.md`.
3. Write scripts and place them in `src/scripts` to test this functionality, and manually write down your thoughts, results into `intermediates/1-creation/3-testing-thoughts-and-questions.md`.
4. Start putting the scripts together into something that works together, then test on the testing page.

Guidelines:
1. If an approach doesn't work, record it (results, why, etc) and try something else.

Final result we're looking for is the ability (in a single script we can use as a guide) to get everything.