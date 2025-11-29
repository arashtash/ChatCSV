# ChatCSV
ChatCSV is a small chatbot project built with Node.js that uses a CSV file to generate responses. The server reads responses.csv to match keywords in user messages and return the corresponding reply. It also logs every interaction to chatlog.csv and serves the chat interface along with other static pages. The project does not use any external frameworks—everything is done using the built-in Node.js modules for HTTP, file handling, and URL parsing.

The front end is a basic chat page created with HTML, CSS, JavaScript, and Bootstrap. It saves the user’s name, theme choice, and chat history using localStorage so the page remembers the user between visits. The script also keeps track of repeated keywords to suggest topics the user might be interested in. This makes the chatbot simple but still interactive and personalized.

## Features
- CSV-based chatbot responses
- Node.js server without external dependencies
- Chat log stored in chatlog.csv
- Simple UI with Bootstrap
- Saved username, theme, and chat history
- Basic suggestion system

## How to Run
1. Install Node.js
2. Run the server:
```bash
node server.js
```
3. Open the browser and go to:
```bash
http://localhost:3000
```

## Author
Arash Tashakori


[Website and Contact information](https://arashtash.github.io/)


## License  

Copyright (c) 2025 arashtash - Arash Tashakori

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
