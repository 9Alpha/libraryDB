

$('#add_book').on('click', function (e) {
	if ($('#book_add_search_text').val() === "") {
		console.log("Needs ISBN");
		return false;
	}
	try {
		parseInt($('#book_add_search_text').val(), 10);

		if ($('#book_add_search_text').val().length === 10 || $('#book_add_search_text').val().length === 13) {

			var tmp = {
				'info': $('#book_add_search_text').val()
			};
			$.ajax({
				url: '/addBook',
				type: 'POST',
				data: JSON.stringify(tmp),
				contentType: 'application/json',
				complete: function (data) {
					console.log(data.responseText);
					if (data.responseText === "false") {
						$('#book_added_text').text("OpenLibrary server not responding");
					} else {
						var disp = JSON.parse(data.responseText);
						$('#book_added_text').text(disp);
					}
					$('#add_book')[0].reset();
				}
			});
		}
	} catch(e) {
		console.log(e);
		$('#book_added_text').text("Error parsing ISBN");
	}

	
});



$('#select_author').on('click', function (e) {
	if ($('#book_search_text').val() === "") {
		console.log("No search input");
		return false;
	}
	var tmp = {
				'info': $('#book_search_text').val()
			};
	$.ajax({
		url: '/searchAuthor',
		type: 'POST',
		data: JSON.stringify(tmp),
		contentType: 'application/json',
		complete: function(data) {
			console.log(data.responseText);
			if (data.responseText === "false") {
				$('#book_added_text').text("No Results");
			} else {
				var toTable = "";
				JSON.parse(data.responseText).forEach(function (book, i) {
					toTable += "<tr><td>"+book.title+"</td></tr>";
				});
				$('#book_list').html(toTable);
			}
			$('#book_search')[0].reset();
		}
	});
});

$('#select_title').on('click', function (e) {
	if ($('#book_search_text').val() === "") {
		console.log("No search input");
		return false;
	}
	var tmp = {
				'info': $('#book_search_text').val()
			};
	$.ajax({
		url: '/searchTitle',
		type: 'POST',
		data: JSON.stringify(tmp),
		contentType: 'application/json',
		complete: function(data) {
			console.log(data.responseText);
			if (data.responseText === "false") {
				$('#book_added_text').text("No Results");
			} else {
				var toTable = "<tr><th>Title</th><th>Author</th></tr>";
				JSON.parse(data.responseText).forEach(function (book, i) {
					toTable += "<tr><td>"+book.title+"</td><td></td></tr>";
				});
				$('#book_list tbody').html(toTable);
			}
			$('#book_search')[0].reset();
		}
	});
});