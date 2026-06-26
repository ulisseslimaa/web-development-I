# Echo Web Server
A native Node.js HTTP server designed to echo back the structural details of incoming requests in a clean JSON format.

## 🚀 Live Demo
You can test the live application deployed on Render here:
**https://web-development-i-y03y.onrender.com/**
> Since the application is hosted on a free Render instance, the first request after a period of inactivity may take **30–50 seconds** while the server wakes up.


## 💻 Run Locally
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
* **method** — The HTTP method used (`GET`, `POST`, etc.).
* **url** — The original request URL.
* **path** — The requested pathname.
* **query** — Query parameters parsed into an object.
* **headers** — All incoming request headers.
* **body** — The raw request body sent by the client.
