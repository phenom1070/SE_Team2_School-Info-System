var express = require('express');
var router = express.Router();
var browser_detector = require('browser-detect');
var errno = require('../util/ch_err');
//var user_agent_parser = require('useragent');
var ch_util = require('../util/ch_util');
/* GET home page. */
router.post('/login', function(req, res) {
	var user_agent = browser_detector(req.headers['user-agent']);
 	var uid = req.body.user_id;
 	uid = ch_util.FixStr(uid);
 	var password = req.body.password;
 	password = ch_util.FixStr(password);
 	req.session.regenerate(function (err) {});
 	
 	var cmd = "SELECT * FROM users WHERE find_in_set(user_id, '" + uid +"')";
 	
 	
 	var rows = [];
  var query = conn.query(cmd);
  query.on('result',function(row){
  	if(row)
  	{
  		rows.push(row);
  	}
  });
  
  query.on('end' ,function(){
  	if(rows.length)
  	{
  		var session_data = req.session;
    	if(rows[0].password == password)
    	{
    			if(user_agent.name)
    				session_data.client_device = 'browser';
    			else
    				session_data.client_device = 'unknown';
    				
    			session_data.user_id = rows[0].user_id;
    			session_data.user_type = rows[0].user_type;
    			session_data.group_name = rows[0].group_name;
    			session_data.mobile = user_agent.mobile;
    			
    			if(session_data.client_device == 'browser')
    				res.redirect("/login_proc/entry_proc");
    			else
    			{
    				//another type client
    				res.json({errcode : CH_ERROR_SUCCESS ,msg : null ,login_status : 'success'});
    			}
    	}
    	else
    	{
    		if(user_agent.name)
    		{
    			req.session.login_password_error = "Invalid password";
    			req.session.login_id_remain = uid;
    			res.redirect('/');
    		}
    		else
    			res.json({errcode : CH_ERROR_PASSWORD ,msg : 'Invalid password' ,login_status : 'failed'});
    	}
  	}
  	else
    {
    	if(user_agent.name)
    	{
    		req.session.login_id_error = "User does not exist";
    		req.session.login_id_remain = uid;
    		res.redirect('/');
    	}
    	else
    			res.json({errcode : CH_ERROR_USERID ,msg : "Invalid password" ,login_status : 'failed'});
   }
	}
  );
    	
});

router.get('/get_error' ,function (req, res){
	var ret_id_error = req.session.login_id_error;
	var ret_password_error = req.session.login_password_error;
	var ret_id_remain = req.session.login_id_remain;
	var ret_msg = null;
	var error_code = CH_ERROR_SUCCESS;
	//console.log(ret_id_error + ret_password_error + ret_id_remain);
	delete req.session.login_id_error;
	delete req.session.login_password_error;
	delete req.session.login_id_remain;
	if(ret_id_error)
	{
		error_code = CH_ERROR_USERID;
		ret_msg = ret_id_error;
	}
	else if(ret_password_error)
	{
		error_code = CH_ERROR_PASSWORD;
		ret_msg = ret_password_error;
	}
	res.json({errcode : error_code ,msg : ret_msg ,id_remain : ret_id_remain});
});

router.get('/entry_proc', function(req, res) {
	if(req.session.user_type)
	{
		if(req.session.user_type == 'admin')
			res.redirect('/admin_page');
		else if(req.session.user_type == 'user')
			res.redirect('/login_proc/logoff');
		else
		{
			console.log("invalid user type");
			res.redirect('/');
		}	
	}
	else
	{
		res.redirect('/');
	}
});
router.get('/logoff', function(req, res) {
	var is_browser;
	if(req.session.client_device == 'browser')
	{
		is_browser = true;
	}
	else
	{
		is_browser = false;
	}
	req.session.destroy();
	if(is_browser)
		res.redirect('/');
	else
		res.json({errcode : CH_ERROR_SUCCESS ,msg : "Logoff sucesss"});
});
router.get('/get_userdata',function(req,res){
	if(req.session.user_type && req.session.user_id)
	{
		res.json({errcode : CH_ERROR_SUCCESS ,msg : null ,user_id : req.session.user_id ,group_name : req.session.group_name ,user_type :req.session.user_type});
	}
	else
	{
		res.json({errcode : CH_ERROR_PRIVILEGE ,msg : "You don't have this privilege"});
	}
}	
);


router.get('/get_all_group',function(req,res)
{
	if(req.session.user_id || req.session.reg_begin)
	{
		var cmd = "SELECT group_name FROM user_group";
		var rows = [];
		var query = conn.query(cmd);
		query.on('result' ,function(row){
			if(row)
				rows.push(row);
		});
		query.on('end' ,function(){
			if(rows.length)
			{
				//console.log("num of group = ",rows.length);
				var group_name_array = [];
				for(var i=0 ;i < rows.length;i++)
				{
					group_name_array.push(rows[i].group_name);
				}
				var array_index = group_name_array.indexOf('root');
				if(array_index > -1)
					group_name_array.splice(array_index, 1);
				res.json({errcode : CH_ERROR_SUCCESS ,msg : null ,gn_array : group_name_array});
				
			}
			else
				res.json({errcode : CH_ERROR_SUCCESS ,msg : "Has no any group exist"});
		});
	}
	else
		res.json({errcode : CH_ERROR_PRIVILEGE ,msg : "You don't have this privilege"});
});

module.exports = router;
