/**
 * Script to get raw HTML from KB Star Bank website
 *
 * This script uses the kbstar.js module to log in to the KB Star Bank website
 * and save the raw HTML response to a file.
 *
 * Target URL: /quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770
 */

// Load the kbstar.js module
if (!system.include("kbstar")) {
    console.log("Failed to load kbstar.js module");
    process.exit(1);
}

// Create input data for the module with the provided credentials
var inputData = {
    "Class": "빠른조회",
    "Module": "빠른잔액조회",
    "Input": {
        "username": "10270104496173", // Account number
        "password": "2365", // Account password
        "birthdate": "920507" // Business number/birth date
    }
};

// Log the input data (without sensitive information)
console.log("Executing kbstar.js module with account number: " + inputData.Input.username);

// Execute the module
console.log("Executing kbstar.js module...");
var result = Execute(JSON.stringify(inputData));
console.log("Execution completed");

// Save the raw HTML response to a file
try {
    var fs = require('fs');
    fs.writeFileSync('kbstar_raw_html.txt', httpRequest.result);
    console.log("Raw HTML saved to kbstar_raw_html.txt");
    
    // Also save to rawHtml.txt to match existing file
    fs.writeFileSync('rawHtml.txt', httpRequest.result);
    console.log("Raw HTML also saved to rawHtml.txt");
} catch (e) {
    console.log("Error saving raw HTML: " + e.message);
}

// Parse the result
try {
    var resultObj = JSON.parse(result);
    if (resultObj.Output && resultObj.Output.Result && resultObj.Output.Result.rawHtml) {
        console.log("Raw HTML is available in the result object");
        
        // Save the raw HTML from the result object to a file
        try {
            fs.writeFileSync('kbstar_raw_html_from_result.txt', resultObj.Output.Result.rawHtml);
            console.log("Raw HTML from result saved to kbstar_raw_html_from_result.txt");
        } catch (e) {
            console.log("Error saving raw HTML from result: " + e.message);
        }
    } else {
        console.log("Raw HTML is not available in the result object");
    }
} catch (e) {
    console.log("Error parsing result: " + e.message);
}

console.log("Done");