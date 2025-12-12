require.config({ 
    paths: { 
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' 
    }
});

let editor;

//language configuration
const languageMap = {
    javascript: { api: 'javascript', version: '18.15.0' },
    typescript: { api: 'typescript', version: '5.0.3' },
    python:     { api: 'python',     version: '3.10.0' },
    java:       { api: 'java',       version: '15.0.2' },
    csharp:     { api: 'csharp',     version: '6.12.0' },
    cpp:        { api: 'c++',        version: '10.2.0' },
    go:         { api: 'go',         version: '1.16.2' },
};


const snippets = {
    javascript: `// JavaScript Hello World
console.log("Hello World");`,

    python: `# Python Hello World
print("Hello World")`,

    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World";
    return 0;
}`,

    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,

    csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World");
    }
}`,

    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello World")
}`,

    typescript: `// TypeScript Hello World
console.log("Hello World");`
};


//theme
require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: snippets.javascript,
        language: 'javascript',
        theme: 'vs-dark',
        
        // Font Settings
        fontSize: 14,
        fontFamily: "'Fira Code', monospace",
        fontLigatures: true,
        
        // Editor Features
        quickSuggestions: { 
            other: true, 
            comments: true, 
            strings: true 
        },
        suggestOnTriggerCharacters: true,
        parameterHints: { enabled: true },
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: true,
    });

    
    setupEventListeners();
});


function setupEventListeners() {
    // Language Change
    document.getElementById('languageSelector').addEventListener('change', function(e) {
        const lang = e.target.value;
        monaco.editor.setModelLanguage(editor.getModel(), lang);
        if(snippets[lang]) {
            editor.setValue(snippets[lang]);
        }
    });

   
    document.getElementById('themeSelector').addEventListener('change', (e) => {
        monaco.editor.setTheme(e.target.value);
    });

    
    document.getElementById('fontSizeSelector').addEventListener('change', (e) => {
        editor.updateOptions({ fontSize: parseInt(e.target.value) });
    });

    
    document.getElementById('fontFamilySelector').addEventListener('change', (e) => {
        editor.updateOptions({ fontFamily: e.target.value });
    });

    
    document.getElementById('runBtn').addEventListener('click', runCode);
}


async function runCode() {
    const lang = document.getElementById('languageSelector').value;
    const code = editor.getValue();
    const input = document.getElementById('inputArea').value;
    const outputArea = document.getElementById('outputArea');

    outputArea.value = "Running...";

    
    if (lang === 'javascript') {
        runLocalJS(code, input);
        return;
    }

    
    if (!languageMap[lang]) {
        outputArea.value = "Language not supported in this demo backend.";
        return;
    }

    
    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: languageMap[lang].api,
                version: languageMap[lang].version,
                files: [{ content: code }],
                stdin: input
            })
        });

        const data = await response.json();
        
        if (data.run) {
            outputArea.value = data.run.output || "No output";
        } else {
            outputArea.value = "Error: " + (data.message || "Unknown error");
        }
    } catch (error) {
        outputArea.value = "Network Error: " + error.message;
    }
}


function runLocalJS(code, userInput) {
    const outputArea = document.getElementById('outputArea');
    outputArea.value = "";
    
    const originalLog = console.log;
    const originalError = console.error;
    const logs = [];

    
    console.log = function(...args) { 
        logs.push(args.join(" ")); 
    };
    console.error = function(...args) { 
        logs.push("ERROR: " + args.join(" ")); 
    };
    
    
    let inputLines = userInput.split('\n');
    let inputIndex = 0;
    const customPrompt = () => inputLines[inputIndex++] || "";

    try {
        
        new Function('prompt', 'console', code)(customPrompt, console);
        outputArea.value = logs.join("\n") || "Code executed successfully (no output)";
    } catch (err) {
        outputArea.value = "ERROR: " + err.toString();
    } finally {
        console.log = originalLog;
        console.error = originalError;
    }
}