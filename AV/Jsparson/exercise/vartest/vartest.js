$(document).ready(function () {
    "use strict";
    var index = window.location.pathname.split('/').pop().split('.')[0];
    var parson;
    var noCredit = true;

    function displayErrors(fb) {
        if (fb.success && noCredit) {
            noCredit = false;
            ODSA.AV.awardCompletionCredit();
        } 
    }

    $.getJSON("vartest.json", function(data) {
        document.getElementById("description").innerHTML = data[index].description
        document.getElementById("instructions").innerHTML = data[index].instructions
        parson = new ParsonsWidget({
            "sortableId": "sortable",
            "trashId": "sortableTrash",
            "vartests": data[index].vartest,
            "constructed_lines": '',
            "python3": true,
            "toggleTypeHandlers": {ab: ["<", ">"]}
        });
        parson.init(data[index].initial);
        parson.shuffleLines();
    });

    $("#newInstanceLink").click(function (event) {
        event.preventDefault()
        parson.shuffleLines()
    });
    $("#feedbackLink").click(function (event) {
        var initData = {}
        initData.user_code = parson.studentCode()
        ODSA.AV.logExerciseInit(initData)
        event.preventDefault()
        var fb = parson.getFeedback()
        $("#vartest").html("<h2>Feedback from testing your program:</h2>" + fb.feedback);
        displayErrors(fb)
    });
    $('#saveProgressLink').click(function() {
        const state = parson.getState({index: index})
        console.log(state)
        $.ajax({
            url: '/saveProgress',
            type: 'POST',
            async: false,
            data: JSON.stringify(state),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                console.log(data)
            }
        })
    });
});
