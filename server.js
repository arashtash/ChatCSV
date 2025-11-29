
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');


const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname,  'public');
const PAGES_DIR = path.join(__dirname,  'pages');
const RESPONSES_CSV = path.join(__dirname, 'responses.csv');
const CHATLOG_CSV = path.join(__dirname, 'chatlog.csv');

//loading responses from the responses.csv
let responses = [];

let defaultResponse = "I didn't catch that.";

function loadResponses() {
  try {
    //load and split
    const data = fs.readFileSync(RESPONSES_CSV, 'utf8');
    const lines = data.split(/\r?\n/).filter(line => line.trim().length > 0);

    //expect row as header: keyword,response,redirect_page
    const [header, ...rows] = lines;


    responses = rows.map(line => {
    const parts = line.split(',');
    const keyword = (parts[0] || '').trim();

    //only if the last column looks like an html page, treat it as redirect page
    const last = (parts[parts.length - 1] || '').trim();
    let response = '';
    let redirect_page = '';

    if (last.toLowerCase().endsWith('.html')) {
        redirect_page = last;

        //response is everything between keyword and redirect_page
        response = parts.slice(1, parts.length - 1).join(',').trim();
    } else {
        //every after keyword is response
        redirect_page = '';

        response = parts.slice(1).join(',').trim();
    }

    return { keyword, response, redirect_page };
    });
  } catch (err) { //catch any loading errors and reset
    console.error('error loading responses.csv:', err.message);
    responses = [];
  }
}

loadResponses();

//content file type referencing
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    default: return 'text/plain; charset=utf-8';
  }
}

//this method handles all the posts/request to chat
function handleChatRequest(req, res) {
  let body = '';

  req.on('data', chunk =>  {
    body += chunk.toString();
  });

  req.on('end',  () => {
    let userMessage = '';

    try {
      const data = JSON.parse(body || '{}');
      userMessage = (data.message || '').toString();
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'invalid request', redirect: null }));
      return;
    }

    const reply = findResponse(userMessage);

    //log eveeything to chatlog.csv asynchronously
    logInteraction(userMessage, reply.message);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reply));
  });
}

//find matching response based on keyword (case-insensitive, substring match)
function findResponse(userMessage) {
  const text = userMessage.toLowerCase();

  for (const entry of responses) {
    const keyword = entry.keyword.toLowerCase();

    if (keyword && text.includes(keyword)) {
      return {
        message: entry.response || defaultResponse,
        redirect: entry.redirect_page || null
      };
    }
  }

  //no match
  return {
    message: defaultResponse,
    redirect: null
  };
}

function logInteraction (userMessage, botMessage) {
  const timestamp = new Date().toISOString();

  //clean the csv to avoid problems
  const cleanUser = (userMessage || '').replace(/"/g, "''").replace(/\r?\n/g, ' ');
  const cleanBot = (botMessage || '').replace(/"/g, "''").replace(/\r?\n/g, ' ');

  const line = `${timestamp},${cleanUser},${cleanBot}\n`;

  fs.appendFile(CHATLOG_CSV, line, (err) => {
    if (err) {
      console.error('Error writing to chatlog.csv:', err.message);
    }
  });
}

//this function serves the static files
function serveStaticFile (reqPath, res) {
  let safePath = reqPath;
  if (safePath === '/') {
    safePath = '/index.html';
  }

  let filePath;

  if (safePath.startsWith('/pages/')) {
    //serve from /pages
    
    filePath = path.join(PAGES_DIR, safePath.replace('/pages/', ''));
  } else {
    //serve from /public
    filePath = path.join(PUBLIC_DIR, safePath);
  }

  //prevent traversing through paths
  const normalized = path.normalize(filePath);

  if (!normalized.startsWith(PUBLIC_DIR) && !normalized.startsWith(PAGES_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access denied');
    return;
  }

  fs.readFile(normalized, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(normalized) });
    res.end(content);
  });
}

//actually creating server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);


  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/chat') {
    return handleChatRequest(req, res);
  }

  //all other routes: static files
  serveStaticFile(parsedUrl.pathname, res);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
