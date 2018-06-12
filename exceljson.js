node_xj = require("xls-to-json");
raws = [
    'Building',
    'Cargo',
    'Tech'
]
raws.forEach(x => {
    node_xj({
        input: "Client/assets/Csv/" + x + ".xlsx",  // input xls
        output: "Client/assets/resources/" + x + ".json", // output json
        //sheet: "sheetname"  // specific sheetname
    }, function (err, result) {
        if (err) {
            console.error(err);
        } else {
            console.log(result);
        }
    });
});
