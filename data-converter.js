// --- STATE MANAGEMENT ---
let isCsvToJson = true; // Default mode: CSV in -> JSON out

// --- UTILITIES ---

function copyOutput() {
    const outputText = document.getElementById('outputBox').value;
    if (outputText.trim() === '') {
        alert("Nothing to copy!");
        return;
    }
    
    // Use modern clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(outputText).then(() => {
            alert("Output copied to clipboard!");
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert("Failed to copy. Try selecting the text manually.");
        });
    } else {
        // Fallback for older browsers
        document.getElementById('outputBox').select();
        document.execCommand('copy');
        alert("Output copied to clipboard!");
    }
}

function toggleMode() {
    isCsvToJson = !isCsvToJson;
    const button = document.getElementById('convertButton');
    const input = document.getElementById('inputBox');
    const output = document.getElementById('outputBox');

    if (isCsvToJson) {
        button.innerText = 'CSV → JSON';
        input.placeholder = 'Paste your CSV data here...';
    } else {
        button.innerText = 'JSON → CSV';
        input.placeholder = 'Paste your JSON data here...';
    }
    // Clear both boxes on mode switch to prevent accidental conversion issues
    input.value = '';
    output.value = '';
}

// --- CORE CONVERSION FUNCTIONS ---

function csvToJson(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue; // Skip malformed rows

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j];
        }
        result.push(obj);
    }
    return result;
}

function jsonToCsv(json) {
    if (!Array.isArray(json) || json.length === 0) return '';
    
    // Use the keys of the first object as headers
    const headers = Object.keys(json[0]);
    const csvRows = [];

    // 1. Add Header Row
    csvRows.push(headers.join(','));

    // 2. Add Data Rows
    for (const obj of json) {
        const values = headers.map(header => {
            let value = obj[header];
            if (value === null || value === undefined) value = '';
            
            // Basic CSV sanitation: handle commas and newlines in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                // Enclose string in double quotes and escape existing double quotes
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

// --- MAIN CONTROLLER ---

document.addEventListener('DOMContentLoaded', () => {
    // Attach the main conversion function to the input box's 'input' event 
    // for real-time conversion.
    document.getElementById('inputBox').addEventListener('input', convert);

    // Attach the toggle mode function to the button (already done in HTML, but good practice)
    document.getElementById('convertButton').onclick = toggleMode;
    
    // Initial UI setup (ensure it's CSV to JSON)
    toggleMode(); // Flips it to the default CSV -> JSON (since it starts as true)
    toggleMode(); // Call twice to set placeholders correctly initially.
});


function convert() {
    const inputEl = document.getElementById('inputBox');
    const outputEl = document.getElementById('outputBox');
    const input = inputEl.value.trim();
    outputEl.value = ''; // Clear output immediately

    if (input === '') return;

    try {
        if (isCsvToJson) {
            // Mode: CSV -> JSON
            const jsonArray = csvToJson(input);
            outputEl.value = JSON.stringify(jsonArray, null, 2); // Pretty-print JSON
        } else {
            // Mode: JSON -> CSV
            let jsonInput;
            try {
                jsonInput = JSON.parse(input);
            } catch (e) {
                throw new Error("Invalid JSON input. Please check syntax.");
            }
            outputEl.value = jsonToCsv(jsonInput);
        }
    } catch (e) {
        // Display user-friendly error
        outputEl.value = `ERROR: ${e.message}`;
        console.error("Conversion Error:", e);
    }
}

// Expose functions globally for HTML calls
window.toggleMode = toggleMode;
window.copyOutput = copyOutput;
window.convert = convert;
