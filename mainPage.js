Qualtrics.SurveyEngine.addOnload(function() {

    var configURL = 'https://mhalfmann.github.io/QualtricsTest/config.json';
    var config = {};

    Promise.all([
        fetch(configURL).then(function(r) { return r.json(); })
    ]).then(function(values) {
        config = values[0];
        console.log(config.rows + " x " + config.columns);
        runSurveyLogic();
    }).catch(function(e) {
        console.error('Failed to load config:', e);
    });

   function runSurveyLogic() {
		buildTableBTN(config.selectionTable.rows, config.selectionTable.columns, 'selectionTable');
        Qualtrics.SurveyEngine.setEmbeddedData('data1', config.rows+" X "+ config.columns);
        // document.getElementById('createTableBtn').addEventListener('click', function() {
        //     //buildTable(config.rows, config.columns, 'myTable');
        //     //buildTable(config.rows, config.columns, 'myTable2');
        // });
    }
    function buildTableBTN(rows, cols, tableID) {
        var n = 0;
        var table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        for (var i = 0; i < rows; i++) {
            var tr = document.createElement('tr');
            for (var j = 0; j < cols; j++) {
                n++;
                var buttonText = config.selectionTable.content[n.toString()];
                var td = document.createElement('td');
                td.style.border = '1px solid black';
                td.style.padding = '8px';

                var button = document.createElement('button');
                button.id = tableID + '_btn_' + n;
                button.textContent = buttonText;
                button.addEventListener('click', (function(label) {
                    return function() {
                        onCellButtonClick(label);
                    };
                })(buttonText));

                td.appendChild(button);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        document.getElementById(tableID).appendChild(table);
    }
	function onCellButtonClick(tableID) {
		console.log('Clicked table ' + tableID);

		// clear the page content
		document.getElementById('myTable').innerHTML = '';
		document.getElementById('myTable2').innerHTML = '';
		document.getElementById('selectionTable').style.display = 'none';

		// show something different
		var container = document.getElementById('myContent');
		// container.innerHTML = '<h2>You clicked row ' + row + ', col ' + col + '</h2>';
        buildTable(config.tables[tableID].rows, config.tables[tableID].columns, tableID);
		// build whatever you want here
	}
    function buildTable(rows, cols, tableID) {
        var table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        var n=0;
        for (var i = 0; i < rows; i++) {
            var tr = document.createElement('tr');
            for (var j = 0; j < cols; j++) {
                n++;
                var td = document.createElement('td');
                td.style.border = '1px solid black';
                td.style.padding = '8px';
                var input = document.createElement('input');
                input.type = 'text';
                input.value = config.tables[tableID].content[n.toString()];
                input.id = tableID + '_cell_' + i + '_' + j; // ✅ fixed
                input.style.width = '100%';
                input.style.border = 'none';
                input.style.outline = 'none';
                td.appendChild(input);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        document.getElementById("myTable2").appendChild(table);
    }

    function getTableValues(rows, cols, tableID) {
        var values = [];
        for (var i = 0; i < rows; i++) {
            var row = [];
            for (var j = 0; j < cols; j++) {
                console.log(document.getElementById(tableID + '_cell_' + i + '_' + j).value);
                row.push(document.getElementById(tableID + '_cell_' + i + '_' + j).value);
            }
            values.push(row);
        }
        return values;
    }

    Qualtrics.SurveyEngine.setJSEmbeddedData("heinz", "horst");

    this.questionclick = function(event, element) {
        console.log("CLICK");
        console.log(Qualtrics.SurveyEngine.getEmbeddedData("data1"));
        if (element.type == 'radio') {
            var choiceNum = element.id.split('~')[2];
            console.log('You clicked on choice ' + choiceNum);
            console.log(Qualtrics.SurveyEngine.getJSEmbeddedData("heinz"));
        }
    }

    // ✅ inside addOnload so config and getTableValues are in scope
    Qualtrics.SurveyEngine.addOnPageSubmit(function() {
        var values = getTableValues(config.rows, config.columns,'myTable2');
        console.log(values);
    });

});

Qualtrics.SurveyEngine.addOnReady(function() {
});

Qualtrics.SurveyEngine.addOnUnload(function() {
});
