var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
 res.sendFile(path.join(__dirname, '../public', 'new_login_ui.html'));
});
router.get('/get_errinfo' ,function(req ,res){
if(req.session.main_errcode && req.session.main_errcode != CH_ERROR_SUCCESS)
	{
		console.log(req.session.main_errmsg);
		var main_errcode = req.session.main_errcode;
		var main_errmsg = req.session.main_errmsg;
		var main_errdetail = req.session.main_errdetail;
		delete req.session.main_errcode;
		delete req.session.main_errmsg;
		delete req.session.main_errdetail;
		res.json({errcode : main_errcode ,msg : main_errmsg ,detail_info : main_errdetail});
	}
	else
		res.json();
});

module.exports = router;
