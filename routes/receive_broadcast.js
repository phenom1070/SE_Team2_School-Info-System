var express = require('express');
var router = express.Router();
var ch_query = require('../util/ch_query');
var errno = require('../util/ch_err');

function CatchMessage(rows ,viewer_type ,msg_tag ,msg_obj)
{
	if(rows.length)
	{
		if(viewer_type == 'group')
		{
			if(rows[0].group_message_tag == msg_tag)
				return;
			msg_obj.msg_tag = rows[0].group_message_tag;
			msg_obj.msg_sender = rows[0].group_msg_sender;
			msg_obj.msg = rows[0].group_message;	
		}
		else
		{
			if(rows[0].message_tag == msg_tag)
				return;
			msg_obj.msg_tag = rows[0].message_tag;
			msg_obj.msg_sender = rows[0].msg_sender;
			msg_obj.msg = rows[0].message;
		}
	}
}

router.get('/:viewer_type/:msg_tag?', function(req, res)
{
	var user_id = req.session.user_id;
	var user_type = req.session.user_type;
	var group_name = req.session.group_name;
	var msg_tag;
	
	var msg_obj = {
		errcode : CH_ERROR_SUCCESS,
		msg : null,
		msg_tag : null,
		msg_sender : null,
	};
	if(req.session.user_id)
	{
		var ui_obj = {rows : null};
		ch_query.QueryUserInfo(req.session.user_id ,"group_name" ,ui_obj);
		if(ui_obj.rows.length)
		{
			if(ui_obj.rows[0].group_name != req.session.group_name)
				req.session.group_name = ui_obj.rows[0].group_name;
		}
	}
	if(!req.params.viewer_type)
	{
		errno.RetErrToClient(CH_ERROR_INVALID_PARAMETER ,req,res);
		return;
	}
	
	var cmd;
	if(req.session.group_name && req.params.viewer_type == 'group')
	{
		cmd = "SELECT * FROM user_group WHERE find_in_set(group_name, '" + req.session.group_name + "')";
	}
	else if(req.session.user_id || req.params.viewer_type == 'everyone')
	{
		cmd = "SELECT * FROM broadcast WHERE find_in_set(viewer_type, '" + req.params.viewer_type + "')";
	}
	else if(req.session.user_id && req.params.viewer_type == 'member')
	{
		cmd = "SELECT * FROM broadcast WHERE find_in_set(viewer_type, '" + req.params.viewer_type + "')";
	}
	else if(req.session.user_type == 'admin' && req.params.viewer_type == 'admin')
	{
		cmd = "SELECT * FROM broadcast WHERE find_in_set(viewer_type, '" + req.params.viewer_type + "')";
	}
	else
	{
		//console.log('invalid type');
		res.json();
		return;
	}
	var query = conn.query(cmd);
	var rows = [];
	query.on('result' ,function(row){
		if(row)
			rows.push(row);
	});
	query.on('end' ,function(){
		if(req.params.msg_tag)
		{
			msg_tag = req.params.msg_tag;
		}
		CatchMessage(rows ,req.params.viewer_type ,msg_tag ,msg_obj);
		if(msg_obj.msg_tag)
			res.json(msg_obj);
		else
			res.json();
	}	
	);
}
);
module.exports = router;