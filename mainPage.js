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
		buildTableBTN(config.selectionTable.content, 'selectionTable');
        Qualtrics.SurveyEngine.setEmbeddedData('data1', config.rows+" X "+ config.columns);
        // document.getElementById('createTableBtn').addEventListener('click', function() {
        //     //buildTable(config.rows, config.columns, 'myTable');
        //     //buildTable(config.rows, config.columns, 'myTable2');
        // });
    }
    var SELECTION_TABLE_STYLE = {
        table: 'border-collapse: separate; border-spacing: 0; width: 100%; background: #fff;',
        thNiveau: 'padding: 10px 8px; font-weight: bold; text-align: center; border: 1px solid #d0d0d0; background: #505050; color: #fff;',
        thHelp: 'padding: 8px 6px; font-weight: bold; text-align: center; border: 1px solid #d0d0d0; background: #e8e8e8; color: #000;',
        td: 'padding: 10px 8px; text-align: center; border: 1px solid #d0d0d0; background: #fff; color: #000; min-width: 80px;'
    };

    function buildTableBTN(content, containerID) {
        var levelKeys = Object.keys(content).sort();
        var helpKeys = Object.keys(content[levelKeys[0]] || {}).slice();
        var rowCount = 0;
        if (levelKeys.length && content[levelKeys[0]] && content[levelKeys[0]][helpKeys[0]]) {
            rowCount = Object.keys(content[levelKeys[0]][helpKeys[0]]).length;
        }

        var table = document.createElement('table');
        table.setAttribute('style', SELECTION_TABLE_STYLE.table);
        table.className = 'selection-grid-table';

        var thead = document.createElement('thead');
        var trNiveau = document.createElement('tr');
        levelKeys.forEach(function(levelKey) {
            var th = document.createElement('th');
            th.setAttribute('colspan', String(helpKeys.length));
            th.textContent = levelKey;
            th.setAttribute('style', SELECTION_TABLE_STYLE.thNiveau);
            trNiveau.appendChild(th);
        });
        thead.appendChild(trNiveau);

        var trHelp = document.createElement('tr');
        levelKeys.forEach(function() {
            helpKeys.forEach(function(helpKey) {
                var th = document.createElement('th');
                th.textContent = helpKey;
                th.setAttribute('style', SELECTION_TABLE_STYLE.thHelp);
                trHelp.appendChild(th);
            });
        });
        thead.appendChild(trHelp);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        for (var r = 0; r < rowCount; r++) {
            var rowKey = (r + 1).toString();
            var tr = document.createElement('tr');
            levelKeys.forEach(function(levelKey) {
                helpKeys.forEach(function(helpKey) {
                    var td = document.createElement('td');
                    td.setAttribute('style', SELECTION_TABLE_STYLE.td + ' border-radius: 4px;');
                    var tableId = content[levelKey] && content[levelKey][helpKey] && content[levelKey][helpKey][rowKey];
                    var label = tableId || '—';
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.textContent = label;
                    btn.id = containerID + '_btn_' + levelKey + '_' + helpKey + '_' + rowKey;
                    btn.setAttribute('style', 'width:100%; padding:6px; border:none; background:transparent; font:inherit; color:inherit; border-radius:4px;' + (tableId ? ' cursor:pointer;' : ' cursor:default; opacity:0.6;'));
                    if (tableId) {
                        btn.addEventListener('click', (function(id) { return function() { onCellButtonClick(id); }; })(tableId));
                    }
                    td.appendChild(btn);
                    tr.appendChild(td);
                });
            });
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        var container = document.getElementById(containerID);
        container.innerHTML = '';
        container.appendChild(table);
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
