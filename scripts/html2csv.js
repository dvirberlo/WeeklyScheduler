import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

async function processFile(inputFilePath, outputFilePath) {
  try {
    // 1. Read the HTML file
    const htmlContent = await readFile(inputFilePath, 'utf-8');

    // 2. Load the HTML into cheerio
    const $ = load(htmlContent);

    // 3. Find the specific table
    const table = $('#ContentPlaceHolder1_gvLessons');
    if (table.length === 0) {
      console.log(`INFO: No table with ID 'ContentPlaceHolder1_gvLessons' found in ${inputFilePath}. Skipping.`);
      return;
    }

    const csvRows = [];

    // 4. Iterate over each table row
    table.find('tr').each((i, row) => {
      const cells = $(row).find('td, th');

      // 5. Filter 1: Must have at least 6 cells
      if (cells.length < 6) {
        return; // 'continue' to next row
      }

      // 6. Filter 2: 6th cell (index 5) must contain "סמסטר"
      const semesterCellText = $(cells[5]).text().trim();
      if (!semesterCellText.includes('סמסטר')) {
        return; // 'continue' to next row
      }

      // 7. Process the row
      const processedRow = [];
      cells.each((j, cell) => {
        const $cell = $(cell);

        // Replace <br> tags with a semicolon, just like the Python script
        $cell.find('br').replaceWith(';');

        // Get the text, which now includes the semicolons from <br>
        let text = $cell.text();

        // Clean the text exactly as the Python script does
        const cleanText = text.trim() // Mimics strip=True
          .replace(/,/g, ";")   // Replace commas
          .replace(/\r/g, ";") // Replace carriage returns
          .replace(/\n/g, ";") // Replace newlines
          .replace(/"/g, "''"); // Replace double quotes

        processedRow.push(cleanText);
      });

      // Add the comma-separated row to our array
      csvRows.push(processedRow.join(','));
    });

    // 8. Write the CSV file
    if (csvRows.length > 0) {
      // Join all rows with a newline
      const csvContent = csvRows.join('\n');

      // Write to file with UTF-8-SIG (which adds a BOM, matching the Python script)
      const BOM = '\uFEFF'; // Byte Order Mark
      await writeFile(outputFilePath, BOM + csvContent, 'utf-8');
      console.log(`SUCCESS: Saved ${inputFilePath} -> ${outputFilePath}`);
    } else {
      console.log(`INFO: No valid rows found in ${inputFilePath}. Skipping.`);
    }

  } catch (err) {
    console.error(`ERROR: Failed to process file ${inputFilePath}: ${err.message}`);
  }
}

async function main() {
  const inputDir = process.argv[2];
  const outputDir = process.argv[3];

  if (!inputDir || !outputDir) {
    console.error('Usage: node scripts/html2csv.js <input_directory> <output_directory>');
    process.exit(1);
  }

  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Read all files from the input directory
    const files = await readdir(inputDir);

    // Filter for .html files
    const htmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.html');

    if (htmlFiles.length === 0) {
      console.log(`No .html files found in ${inputDir}`);
      return;
    }

    console.log(`Found ${htmlFiles.length} HTML file(s). Starting conversion...`);

    // Process each file
    for (const htmlFile of htmlFiles) {
      const inputFilePath = path.join(inputDir, htmlFile);
      const baseName = path.basename(htmlFile, '.html');
      const outputFilePath = path.join(outputDir, `${baseName}.csv`);

      await processFile(inputFilePath, outputFilePath);
    }

    console.log('All files processed.');

  } catch (err) {
    console.error(`FATAL ERROR: ${err.message}`);
  }
}

main();