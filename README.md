# Weekly Scheduler

## Usage

Prerequisites:

1. Install [Node.js](https://nodejs.org/) (which includes npm).
2. Install pnpm globally if you haven't already:

   ```bash
   npm install -g pnpm
   ```

3. Install [Python](https://www.python.org/downloads/) (if not already installed).
4. Install [uv](https://docs.astral.sh/uv/getting-started/installation/)

Run the following commands in your terminal:

```bash
pnpm run collect:all
```

You will be prompted to enter target url (the url of the website you want to scrape) and department IDs.

You might encounter a crash due to a CAPTCHA challenge. If that happens, please manually visit the target page in your browser, solve the CAPTCHA, and then rerun the command.
