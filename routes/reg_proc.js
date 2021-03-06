var express = require('express');
var router = express.Router();
var ch_util = require('../util/ch_util');
var browser_detector = require('browser-detect');

router.get('/', function(req ,res){
	req.session.reg_begin = true;
	var user_agent = browser_detector(req.headers['user-agent']);
	if(user_agent.name)
		req.session.client_device = 'browser';
	else
		req.session.client_device = 'unknown';
	res.sendFile(path.join(__dirname, '../public', 'reg_user.html'));
}
);

router.get('/redirect', function (req, res){
	res.redirect('/reg_proc');
});


router.get('/get_error' ,function(req, res)
{
	
		var id_error = req.session.reg_user_id_error;
		var password_error = req.session.reg_user_password_error;
		var user_id_remain = req.session.reg_user_id_remain;
		var real_name_remain = req.session.reg_real_name_remain;
		//var groupname_remain = req.session.reg_groupname_remain;
		var err_code = CH_ERROR_SUCCESS;
		var ret_msg = null;
		delete req.session.reg_user_id_error;
		delete req.session.reg_user_password_error;
		delete req.session.reg_user_id_remain;
		delete req.session.reg_groupname_remain;
		delete req.session.reg_real_mname_remain;
		if(id_error)
		{
			err_code = CH_ERROR_USERID;
			ret_msg = id_error;
		}
		else if(password_error)
		{
			err_code = CH_ERROR_PASSWORD;
			ret_msg = password_error;
		}
		res.json({errcode :  err_code ,msg : ret_msg ,id_remain : user_id_remain ,real_name_remain : real_name_remain});
}
);

router.get('/get_reg_name', function (req, res){
	if(req.session.reg_user_id_remain)
	{
		var user_id = req.session.reg_user_id_remain;
		delete req.session.reg_user_id_remain;
		res.json({errcode : CH_ERROR_SUCCESS ,msg : null ,new_user_id : user_id});
	}
	else
		res.json({errcode : CH_ERROR_DATA_NOT_FOUND ,msg : null});
}
);

router.get('/reg_success', function (req, res){
	if(req.session.reg_user_id_remain)
	{
		delete req.session.reg_begin;
		res.sendFile(path.join(__dirname, '../public', 'reg_success.html'));
	}
	else
	{
		res.redirect("/");
	}
}
);

router.post('/reg_user', function (req ,res){
	var user_id = req.body.user_id;
	user_id = ch_util.FixStr(user_id);
	//var group_name = req.body.group_name;
	//group_name = ch_util.FixStr(group_name);
	var password = req.body.password;
	password = ch_util.FixStr(password);
	var password_again = req.body.password_again;
	password_again = ch_util.FixStr(password_again);
	var cmd = "SELECT * FROM users WHERE find_in_set(user_id, '" + user_id +"')";
	if(req.session.reg_begin)
	{
		var query_id = conn.query(cmd);
		var rows = [];
		query_id.on('result' ,function(row){
			if(row)
				rows.push(row);
		});
		query_id.on('end' ,function(){
				if(rows.length)
				{
					if(req.session.client_device == 'browser')
					{
						req.session.reg_user_id_error = 'This user is already exist!';
						req.session.reg_user_id_remain = user_id;
						req.session.reg_real_name_remain = req.body.real_name;
						//req.session.reg_groupname_remain = group_name;
						res.redirect('/reg_proc');
					}
					else
						res.json({errcode : CH_ERROR_USERID ,msg : 'This user is already exist!'});
				}
				else
				{
					//check password is correct
					if(password != password_again)
					{
						if(req.session.client_device == 'browser')
						{
							req.session.reg_user_password_error = "Password and retype password is not same";
							req.session.reg_user_id_remain = user_id;
							req.session.reg_real_name_remain = req.body.real_name;
							//req.session.reg_groupname_remain = group_name;
							res.redirect('/reg_proc');
						}
						else
						{
							res.json({errcode : CH_ERROR_PASSWORD ,msg : "Password and retype password is not same"});
						}
					}
					else
					{
						cmd = "INSERT INTO users (user_type ,user_id ,password ,group_name ,real_name ,gender) VALUES ('user' ,'" + user_id + "' ,'" + 
										password + "' ,'" + "hall" + "' ,'" + req.body.real_name + "' ,'" + req.body.gender + "')";
						var new_user = conn.query(cmd);
						var err_result = null;
						new_user.on('error' ,function(err){ 
							err_result = err;
						});
						new_user.on('end' ,function(){
							if(!err_result)
							{
								/*if(req.session.client_device == 'browser')
								{
									req.session.reg_user_id_remain = user_id;
									res.redirect('/reg_proc/reg_success');
								}
								else
								{
									res.json({errcode : CH_ERROR_SUCCESS ,msg : "Register success"});
								}*/
								cmd = "INSERT INTO hall_group_members (member_id ,access_status) VALUES('" + user_id + "' ,'" + CH_GA_ACCEPT + "')";
								var attend_hall = conn.query(cmd);
								attend_hall.on('error' ,function(err){
									err_result = err;
									cmd = "DELETE FROM users WHERE user_id = '" + user_id + "'";
									var delete_user = conn.query(cmd);
									delete_user.on('end' ,function(){});
								});
								attend_hall.on('end' ,function(){
									if(!err_result)
									{
										if(req.session.client_device == 'browser')
										{
											req.session.reg_user_id_remain = user_id;
											res.redirect('/reg_proc/reg_success');
										}
										else
										{
											res.json({errcode : CH_ERROR_SUCCESS ,msg : "Register success"});
										}
									}
									else
									{
										if(req.session.client_device == 'browser')
										{
											res.redirect("/reg_proc");
										}
										else
										{
											res.json({errcode : CH_ERROR_INTERNAL_PROBLEM ,msg : "Internal problem occur in server"});
										}
									}
								});
							}
							else
							{
								if(req.session.client_device == 'browser')
								{
									res.redirect("/reg_proc");
								}
								else
								{
									res.json({errcode : CH_ERROR_INTERNAL_PROBLEM ,msg : "Internal problem occur in server"});
								}
							}
						});
					}
				}
			});
		
	}
	else
		res.json({errcode : CH_ERROR_STEP , msg : "Please follow the normal register procedure"});
}
);

module.exports = router;