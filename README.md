# KB Star Bank Scraper

This project contains scripts to scrape the KB Star Bank website and save the HTML content to a file.

## Files

- `kbstar.js` - The main module file with the workflow implementation for KB Star Bank quick balance inquiry
- `scrape_kbstar.js` - A Puppeteer-based scraper for KB Star Bank
- `fetch_kbstar.js` - A Node.js fetch API-based scraper for KB Star Bank
- `run_scraper.sh` - Shell script to run the Puppeteer-based scraper
- `run_fetch_scraper.sh` - Shell script to run the fetch API-based scraper

## Prerequisites

- Node.js (v12 or higher)
- npm (comes with Node.js)

## Usage

### Option 1: Using Puppeteer (Recommended for browser automation)

This option uses Puppeteer to automate a Chrome browser, which can handle JavaScript rendering and complex interactions.

```bash
./run_scraper.sh
```

The script will:
1. Check if Node.js is installed
2. Install Puppeteer if it's not already installed
3. Run the scraper
4. Save the HTML content to `html.txt`

### Option 2: Using Fetch API (Lightweight alternative)

This option uses Node.js built-in modules to make HTTP requests, which is lighter but may not handle complex JavaScript-rendered content.

```bash
./run_fetch_scraper.sh
```

The script will:
1. Check if Node.js is installed
2. Run the fetch-based scraper
3. Save the HTML content to `html.txt`

## Form Data Parameters

The scrapers use the following form data parameters:

- Account Number: 10270104496173
- Password: 2365
- Business Number/Birth Date: 920507

## Target URL

The scrapers target the following URL:
```
https://obank.kbstar.com/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770
```

## Output

Both scrapers save the HTML content to `html.txt` in the current directory.