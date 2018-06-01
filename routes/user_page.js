var express = require('express');
var router = express.Router();
var ch_util = require('../util/ch_util');
var errno = require('../util/ch_err');
var util = require('util');


var set_ud_arg 										= ["real_name" 	,"gender" 	,"phone_num" 			,"email" 	,"status"];
var set_ud_reference_column_name 	= ["real_name=" ,"gender="	,"phone_number=" 	,"email="	,"user_status="];

var get_ui_arg										= ["user_type" 	,"user_id"	,"info_modified_time_stamp"	,"group_name"		,"data_modified_time"			,"real_name" 	,"gender" 	,"phone_num" 			,"email" 	,"status"];
var get_ui_reference_column_name	=	["user_type" 	,"user_id"	,"last_user_modified_time"	,"group_name" 	,"ud_last_modified_time"	,"real_name" 	,"gender"		,	"phone_number" 	,"email"	,"user_status"];
router.get('/',function (req, res){
	if(req.session.user_id)
	{
		res.sendFile(path.join(__dirname, '../public', 'userdata.html'));
	}
	else
		res.json({errcode : CH_ERROR_PRIVILEGE ,msg : "Please try to login!"});
}
);
router.get('/get_userdata/:time_tag?',function(req, res)
{
	if(req.session.user_id)
	{
		cmd = "SELECT * FROM users WHERE find_in_set(user_id, '" + req.session.user_id +"')";
		var query = conn.query(cmd);
		var rows = [];
		query.on('result' , function(row){
			if(row)
				rows.push(row);
		});
		query.on('end' ,function(){
			if(rows.length && rows[0].ud_last_modified_time && req.params.time_tag != rows[0].ud_last_modified_time)
			{
				res.json({last_modified_time : rows[0].ud_last_modified_time,
					real_name : rows[0].real_name,
					gender : rows[0].gender,
					phone_number : rows[0].phone_number,
					email : rows[0].email ,
					status : rows[0].user_status});
			}
			else
				res.json();
		});
	}
	else
		res.json({errcode : CH_ERROR_PRIVILEGE ,msg : "Please try to login!"});
}
);

router.get('/get_userinfo/*' ,function(req ,res){
	if(!req.session.user_id)
	{
		errno.RetErrToClient(CH_ERROR_PRIVILEGE ,req ,res);
		return;
	}
	var argument_str = util.inspect(req.params[0]);
	argument_str = argument_str.slice(1,-1);
	var arg_array = argument_str.split("|");
	var want_column_name = [];
	var want_arg_index = [];
	for(var arg_index = 0 ;arg_index < arg_array.length ;arg_index++)
	{
		var match_param_index;
		if((match_param_index = get_ui_arg.indexOf(arg_array[arg_index])) > -1)
		{
			want_column_name.push(get_ui_reference_column_name[match_param_index]);
			want_arg_index.push(match_param_index);
		}
	}
	if(want_column_name.length <= 0)
	{
		errno.RetErrToClient(CH_ERROR_INVALID_PARAMETER ,req ,res);
		return;
	}
	var cmd = "SELECT ";
	for(var cn_index = 0 ;cn_index < want_column_name.length ;cn_index++)
	{
		cmd += want_column_name[cn_index];
		if(cn_index < want_column_name.length - 1)
			cmd += " ," ;
	}
	cmd += (" FROM users WHERE user_id = '" + req.session.user_id + "'");
	var get_user_info = conn.query(cmd);
	var err_result;
	var rows = [];
	get_user_info.on('error' ,function(err){
		err_result = err;
	});
	get_user_info.on('result' ,function(row){
		rows.push(row);
	});
	get_user_info.on('end' ,function(){
		if(err_result || !rows.length)
		{
			errno.RetErrToClient(CH_ERROR_INTERNAL_PROBLEM);
		}
		else
		{
			var ret_object = new Object();
			ret_object.errcode = CH_ERROR_SUCCESS;
			ret_object.msg = null;
			for(var arg_index = 0 ;arg_index < want_arg_index.length ;arg_index++)
			{
//"user_type" 	,"user_id"	,"last_user_modified_time"	,"group_name" 	,"ud_last_modified_time"	,"real_name" 	,"gender"		,	"phone_number" 	,"email"	,"user_status"
				switch(want_arg_index[arg_index])
				{
					case 0:		//user_type
						ret_object.user_type = rows[0].user_type;
						break;
					case 1:		//user_id
						ret_object.user_id = rows[0].user_id;
						break;
					case 2:		//info_modified_time_stamp
						ret_object.info_modified_time_stamp = rows[0].last_user_modified_time;
						break;
					case 3:		//group_name
						ret_object.group_name = rows[0].group_name;
						break;
					case 4:		//data_modified_time
						ret_object.data_modified_time = rows[0].ud_last_modified_time;
						break;
					case 5:		//real_name
						ret_object.real_name = rows[0].real_name;
						break;
					case 6:		//gender
						ret_object.gender = rows[0].gender;
						break;
					case 7:		//phone_num
						ret_object.phone_num = rows[0].phone_num;
						break;
					case 8:		//email
						ret_object.email = rows[0].email;
						break;
					case 9:		//status
						ret_object.status = rows[0].user_status;
						 
				}
			}
			res.json(ret_object);
		}
	});
});

router.post('/set_userdata/*',function (req, res){
	if(req.session.user_id)
	{
		var argument_str = util.inspect(req.params[0]);
		argument_str = argument_str.slice(1,-1);
		//console.log(argument_str);
		var arg_array = argument_str.split("|");
		var time_tag = ch_util.GetCurrentTimeTag();
		//console.log(arg_array.length + arg_array[0]);
		if(arg_array.length <= 0)
		{
			var err_obj = {errmsg : null ,errdetail : null};
			errno.GetErrorInfo(CH_ERROR_INVALID_PARAMETER ,err_obj ,(req.session.client_device === 'browser'));
			if(req.session.client_device === 'browser')
			{
				req.session.main_errcode = CH_ERROR_INVALID_PARAMETER;
				req.session.main_errmsg = err_obj.errmsg;
				req.session.main_errdetail = err_obj.errdetail;
				res.sendFile(path.join(__dirname, '../public', 'error_page.html'));
			}
			else
			{
				res.json({errcode : CH_ERROR_INVALID_PARAMETER ,msg : err_obj.errmsg});
			}
			return;
		}
		var column_name_need_update = [];
		var val_type = [];
		for(var arg_index = 0 ;arg_index < arg_array.length ;arg_index++)
		{
			for(var scan_reference = 0; scan_reference < set_ud_arg.length ;scan_reference++)
			{
				if(arg_array[arg_index] === set_ud_arg[scan_reference])
				{
					column_name_need_update.push(set_ud_reference_column_name[scan_reference]);
					val_type.push(scan_reference);
					break;
				}
			}
		}
		if(column_name_need_update.length <= 0)
		{
			var err_obj = {errmsg : null ,errdetail : null};
			errno.GetErrorInfo(CH_ERROR_INVALID_PARAM ,err_obj ,(req.session.client_device === 'browser'));
			if(req.session.client_device === 'browser')
			{
				req.session.main_errcode = CH_ERROR_INVALID_PARAMETER;
				req.session.main_errmsg = err_obj.errmsg;
				req.session.main_errdetail = err_obj.errdetail;
				console.log("column_name_need_update.length = " + column_name_need_update.length);
				res.sendFile(path.join(__dirname, '../public', 'error_page.html'));
			}
			else
			{
				res.json({errcode : CH_ERROR_INVALID_PARAMETER ,msg : err_obj.errmsg});
			}
			return;
		}
		if(column_name_need_update.length == 1 && val_type[0] == 0 && !req.body.real_name)
		{
			if(req.session.client_device == 'browser')
				res.redirect('/user_page');
			else
				res.json({errcode : CH_ERROR_SUCCESS ,msg : ("Server has received data at : " + time_tag) ,time_tag : time_tag});
			
			return;
		}
		//										"real_name" 				,"gender" 				,"phone_num" 				,"email" 				,"status"
		var new_data_value = [req.body.real_name 	,req.body.gender	,req.body.phone_num	,req.body.email ,req.body.status];
		var cmd = "UPDATE users SET ud_last_modified_time ='" + time_tag + "' ,";
		for(var cn_index = 0 ;cn_index < column_name_need_update.length ;cn_index++)
		{
			cmd += column_name_need_update[cn_index];
			cmd += ("'" + new_data_value[val_type[cn_index]] + "' ");
			if(cn_index < column_name_need_update.length - 1)
				cmd += ",";
		}
		cmd += " WHERE user_id = '" + req.session.user_id + "'";
		query = conn.query(cmd);
		query.on('end' ,function(){
			if(req.session.client_device == 'browser')
				res.redirect('/user_page');
			else
				res.json({errcode : CH_ERROR_SUCCESS ,msg : ("Server has received data at : " + time_tag) ,time_tag : time_tag});
		});
	}
	else
		res.json({errcode : CH_ERROR_PRIVILEGE ,msg : "Please try to login!"});
}
);


module.exports = router;