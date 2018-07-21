var  express =  require('express');
var request = require('request');
var  path =  require('path');
var  app =  express();
var favicon = require('serve-favicon');
var cors = require('cors');
var bodyParser = require('body-parser');  
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(path.join(__dirname,'public')));
//app.use(favicon(path.join(__dirname,'favicon.ico'))); 
app.use(cors());

var fs = require('fs');
var content = fs.readFileSync('public/index.html', 'utf8');

var elasticQuerySize = 2000;
var doElasticInit = false;

app.get('/', function(req, res){
	if (doElasticInit) {
		request({
			url: 'http://localhost:9200/books',
			method: 'PUT',
			json: true,
			headers: {
				'content-type': 'application/json'
			},
			body: elasticBooksSettings
		}, function(error, response, body) {
			if (error || response.statusCode !== 200 || JSON.stringify(response.body) === "{}") {
				console.log(error);
			}
			console.log(body)
		});
		doElasticInit = false;
	}

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
			var isbn = req.body.info;
			var data = response.body['ISBN:'+isbn];
			var title = data.title;
			if (title === 'undefined') {
				title = 'No Title';
			}
			var authors = [];
			for (var a = 0; a < data.authors.length; a++) {
				authors.push('"'+data.authors[a].name+'"')
			}
			var date = data.publish_date;
			var subjects = [];
			for (var a = 0; a < data.subjects.length; a++) {
				subjects.push('"'+data.subjects[a].name+'"')
			}
			var toSend = JSON.parse('{"title":"'+title+'","authors":['+authors+'],"date":"'+date+'","subjects":['+subjects+']}');
			request({
				url: 'http://localhost:9200/books/book/'+isbn+'?op_type=create',
				method: 'PUT',
				json: true,
				headers: {
					'content-type': 'application/json'
				},
				body: toSend
			}, function(error, response, body) {
				if (error || response.statusCode !== 200 || JSON.stringify(response.body) === "{}") {
					console.log(error);
					res.send(false);
				}
				console.log(body)
			});
		}
	});
});

app.post('/searchBook', function(req, res) {
	var search_text = req.body.info;
	var toSend = {
		"query": {
			"multi_match": {
				"query": '"'+search_text+'"',
				"fields": ["authors", "title"],
				"fuzziness": 1
			}
		}
	}
	request({
		url: 'http://localhost:9200/books/book/_search',
		method: 'GET',
		json: true,
		headers: {
			'content-type': 'application/json'
		},
		body: toSend
	}, function(error, response, body) {
		if (error || response.statusCode !== 200 || JSON.stringify(response.body) === "{}") {
			console.log(error);
			res.send(false);
		}
		res.send(body.hits.hits)
	});
});



var elasticBooksSettings = {
	"settings": {
		"number_of_shards": 1, 
		"analysis": {
			"filter": {
				"autocomplete_filter": { 
					"type":     "edge_ngram",
					"min_gram": 1,
					"max_gram": 20
				}
			},
			"analyzer": {
				"autocomplete": {
					"type":      "custom",
					"tokenizer": "standard",
					"filter": [
					"lowercase",
					"autocomplete_filter" 
					]
				},
				"non_auto": {
					"tokenizer": "standard"
				}
			}
		}
	},
	"mappings": {
		"book": {
			"properties": {
				"title": {
					"type": "text",
					"analyzer": "autocomplete", 
					"search_analyzer": "standard" 
				},
				"authors": {
					"type": "text",
					"analyzer": "autocomplete", 
					"search_analyzer": "standard" 
				},
				"subjects": {
					"type": "text",
					"analyzer": "autocomplete", 
					"search_analyzer": "standard" 
				},
				"date": {
					"type": "integer"
				}
			}
		}
	}
}




app.listen(process.env.PORT || 4545);

