var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');
var  express =  require('express');
var request = require('request');
var  path =  require('path');
var  app =  express();
var favicon = require('serve-favicon');
var cors = require('cors');
var bodyParser = require('body-parser');  
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(path.join(__dirname,'public')));
app.use(favicon(path.join(__dirname,'favicon.ico'))); 
app.use(cors());

var fs = require("fs");
var content = fs.readFileSync("public/index.html", 'utf8');

db.run("PRAGMA foreign_keys = ON;");

app.get('/', function(req, res){
	res.send(content);
});

app.post('/addBook', function(req, res){
	console.log(req.body.info);
	request({
		url: 'https://openlibrary.org/api/books?bibkeys=ISBN:'+req.body.info+'&format=json&jscmd=data',
		method: 'GET',
		json: true,
		headers: {
			'content-type': 'application/json'
		}
	}, function (error, response, body) {
		if (error || response.statusCode !== 200 || JSON.stringify(response.body) === "{}") {
			console.log(error);
			res.send(false);
		} else {
			var data = response.body["ISBN:"+req.body.info];
			var noTitle = data.title;
			if (noTitle === "undefined") {
				noTitle = "No Title";
			}
			db.run("INSERT INTO books (ISBN, title) VALUES (?, ?)", 
				req.body.info, 
				noTitle, 
				function (err) {
					if (err) {
						if (err.errno === 19) 
							res.send(data.title+" already exists in library");
					}
					else if (data.authors) {
						data.authors.forEach(function(author, i) {
							db.all("SELECT * FROM authors WHERE name=?", 
								author.name, 
								function(err, rowsAuth) {
									if (err) throw err;
									else {
										console.log("***Matching Authors***");
										console.log(rowsAuth);
										if (!rowsAuth[0]) {
											db.run("INSERT INTO authors (name) VALUES (?)", 
												author.name, 
												function(err) {
													if (err) throw err;
													else {
														db.run("INSERT INTO booksForAuthor (bookISBN, authorID) VALUES (?, ?)", 
															req.body.info, 
															this.lastID, 
															function(err) {
																if (err) throw err;
																else {
																	if (i === data.authors.length-1) {
																		res.send(data.title+" added to library");
																	}
																}
															});
													}
												});
										} else {
											db.run("INSERT INTO booksForAuthor (bookISBN, authorID) VALUES (?, ?)", 
												req.body.info, 
												rowsAuth[0].ID, 
												function(err) {
													if (err) throw err;
													else {
														if (i === data.authors.length-1) {
															res.send(data.title+" added to library");
														}
													}
												});
										}
									}
								});
});
} else {

}
});
}
});
});

app.post('/searchAuthor', function(req, res) {
	db.all("SELECT * FROM authors WHERE name LIKE ?", 
		'%'+req.body.info+'%', 
		function(err, rows) {
			if (err) throw err;
			else if (rows[0]) {
				var toSend = [];		
				rows.forEach(function(item, i) {
					db.all("SELECT * FROM booksForAuthor WHERE authorID=?",
						item.ID,
						function(err, rowsAuth) {
							if (err) throw err;
							else {
								rowsAuth.forEach(function(book, j) {
									db.all("SELECT title FROM books WHERE ISBN=?",
										book.bookISBN,
										function(err, rowsBooks) {
											if (err) throw err;
											else {
												var tmp = {
													"title":rowsBooks[0].title,
													"author":item.name
												};
												toSend.push(tmp);
												if (i === rows.length-1 && j === rowsAuth.length-1) {
													res.send(toSend);
												}
											}
										});
								});
							}
						});
				});
			} else {
				res.send(false);
			}
		});
});

app.post('/searchTitle', function(req, res) {
	console.log(req.body.info);
	db.all("SELECT * FROM books WHERE title LIKE ?", 
		'%'+req.body.info+'%', 
		function(err, rows) {
			if (err) throw err;
			else if (rows[0]) {
				var toSend = [];
				rows.forEach(function (book, i) {
					db.all("SELECT authorID FROM booksForAuthor WHERE bookISBN=?",
						book.ISBN,
						function(err, rowsConnect) {
							if (err) throw err;
							else {
								rowsConnect.forEach(function (connect, j) {
									db.all("SELECT * FROM authors WHERE ID=?",
										connect.authorID,
										function (err, rowsAuth) {
											if (err) throw err;
											else {
												var tmp = {
													"title":book.title,
													"author":rowsAuth[0].name
												};
												toSend.push(tmp);
												if (i === rows.length-1 && j === rowsConnect.length-1) {
													res.send(toSend);
												}
											}
										});
								});
							}
						});
				});
			} else {
				res.send(false);
			}
		});
});



app.listen(process.env.PORT || 4545);

