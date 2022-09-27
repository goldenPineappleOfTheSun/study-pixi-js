const http = require('http');
const fs = require('fs')
const express = require('express');

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static('static'));

app.get('/', function(req, res) {
    res.statusCode = 200;
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('index.html').pipe(res)
});

app.get('/s1', function(req, res) {
    res.statusCode = 200;
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('physics showcase.html').pipe(res)
});

app.get('/s2', function(req, res) {
    res.statusCode = 200;
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('junk physics showcase.html').pipe(res)
});

app.get('/s3', function(req, res) {
    res.statusCode = 200;
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('linecast showcase.html').pipe(res)
});

app.get('/s4', function(req, res) {
    res.statusCode = 200;
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('ai and pit showcase.html').pipe(res)
});

app.get('/s5', function(req, res) {
    res.statusCode = 200;
    res.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('ai and obstacles showcase.html').pipe(res)
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})