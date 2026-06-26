# echo-web-server
Echo Web Server

Example: visit http://echo.dannluciano.com.br/

## Run locally

Start normally:

```bash
npm start
```

Start in development mode (auto-reload on file changes):

```bash
npm run dev
```

This project is configured as ES Module (`"type": "module"`).

Default URL: `http://localhost:3000`

## Example requests

Open in browser:

- `http://localhost:3000/`
- `http://localhost:3000/hello?name=ulisses`


The server responds with a JSON object echoing request details:

- method
- URL and path
- query parameters
- headers
- request body