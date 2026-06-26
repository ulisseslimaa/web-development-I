# Echo Web Server

A native Node.js HTTP server designed to echo back the structural details of incoming requests in a clean JSON format.

## Live Demo

You can test the live application deployed on Render here:
**https://web-development-i-y03y.onrender.com/**
> Since the application is hosted on a free Render instance, the first request after a period of inactivity may take **30–50 seconds** while the server wakes up.

## Prerequisites

Since the server relies exclusively on built-in Node.js modules (no external dependencies), you only need to have Node.js installed on your machine:
* **Node.js** (version 18.x or higher recommended)

## Run Locally

### Default local URL
```text
http://localhost:3000
````
### Start the server
```bash
npm start
```

## Example Requests

```text
GET http://localhost:3000/
```
```text
GET http://localhost:3000/hello?name=ulisses
```

## Response Structure

The server processes the incoming HTTP request and responds with a JSON object containing the request details:
* **message**: A friendly identifier string ("Echo Web Server").
* **method**: The HTTP verb used (GET, POST, etc.).
* **url**: The raw incoming URL string.
* **path**: The target resource pathname.
* **query**: URL query parameters converted into a literal object.
* **httpVersion**: The HTTP protocol version used by the client.
* **headers**: Incoming request headers.
* **timestamp**: The exact ISO timestamp when the request was processed.
* **body**: Raw data sent in the request payload (automatically parsed if sent as `application/json`).
