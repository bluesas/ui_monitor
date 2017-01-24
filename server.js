var express = require('express');
var url = require('url');
var xml = require('./node/xml/xmlParser.js');
var viewLoader = require('./node/load_ui.js');

var app = express();
var router = express.Router();

app.set('view engine', 'jade');

app.use(express.static('res'));
app.use(express.static('src'));

function sendFile(req, res) {
    var filename = req.params.filename
    console.log("filepath is %s", __dirname + "/" + filename);
    res.sendFile(__dirname + "/" + filename);
}

function treeViewProcess(req, res) {

    viewLoader.loadViewTree("./res/viewtree.xml");
    viewLoader.loadScreen("./res/screencap.png");

    xml.toJson('./res/viewtree.xml', function (result) {
        res.render('tree_view_demo', { title: 'Android UI Monitor', message: 'Android UI Monitor', viewTreeData: JSON.stringify(result) });
    })
}

router.route('/')
    .get(treeViewProcess)
    .post(treeViewProcess);

router.route('/tree_view_demo(|.js|.html|.jade)')
    .get(treeViewProcess)
    .post(treeViewProcess);

router.route('/:filename')
    .get(sendFile)
    .post(sendFile);

app.use('/', router);
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(403).send('File Not Found!');
});

var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})
