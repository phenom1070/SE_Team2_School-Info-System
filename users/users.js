var ch_util = require('../util/ch_util');
var errno = require('../util/ch_err');
var sleep = require('system-sleep');
var ch_query = require('../util/ch_query');
module.exports = {
	ChangeGroupForUser : function(user_id ,new_group ,old_group)
	{
		if(!user_id || !new_group)
		{
			errno.SetLastError(CH_ERROR_INVALID_PARAMETER);
			return false;
		}
		var time_tag = ch_util.GetCurrentTimeTag();
		if(old_group)
		{
			var is_finish = false;
			var cmd = "DELETE FROM " + old_group+ "_group_members WHERE member_id = '" + user_id + "'";
			var remove_member = conn.query(cmd);
			remove_member.on('end' ,function(){
				cmd = "UPDATE user_group SET members_table_changed_time_stamp = '" + time_tag + "' WHERE group_name ='" + old_group + "'";
				var update_old_group_time_stamp = conn.query(cmd);
				update_old_group_time_stamp.on('end' ,function(){
					is_finish = true;
				});
			});
			while(!is_finish)
				sleep(1);
		}
		var cmd = "INSERT INTO " + new_group + "_group_members (member_id ,access_status) VALUES ('" + user_id + "' ,1)";
		var insert_to_new_group = conn.query(cmd);
		var is_finish = false;
		var err_result = null;
		insert_to_new_group.on('error' ,function(err){
			err_result = err;
		});
		insert_to_new_group.on('end' ,function(){
			if(err_result)
			{
				errno.SetLastError(CH_ERROR_INTERNAL_PROBLEM);
				is_finish = true;
				return;
			}
			cmd = "UPDATE user_group SET members_table_changed_time_stamp = '" + time_tag + "' WHERE group_name ='" + new_group + "'";
			var update_new_group_time_stamp = conn.query(cmd);
			update_new_group_time_stamp.on('end' ,function(){
				cmd = "UPDATE users SET group_name = '" + new_group + "' ,last_user_modified_time = '" + time_tag + "' WHERE user_id = '" + user_id + "'";
				var change_user_field = conn.query(cmd);
				change_user_field.on('end',function(){
					is_finish = true;
				});
			});
			
		});
		while(!is_finish)
			sleep(1);
		if(err_result)
			return false;
		return true;
	},
	PostNewRequestToGroup : function(user_id ,req_group_name)
	{
		var time_stamp = ch_util.GetCurrentTimeTag();
		var is_finish = false;
		var cmd = "INSERT INTO " + req_group_name + "_group_members (member_id ,access_status) VALUES ('" + user_id + "' ,0)";
		var post_request = conn.query(cmd);
		post_request.on('end' ,function(){
			cmd = "UPDATE user_group SET members_table_changed_time_stamp = '" + time_stamp + "' WHERE group_name ='" + req_group_name + "'";
			var update_time_stamp = conn.query(cmd);
			update_time_stamp.on('end' ,function(){
				is_finish = true;
			});
		});
		while(!is_finish)
			sleep(1);
	},
	AcceptMember : function(user_id ,group_name){
		var cmd;
		var is_finish = false;
		var ui_obj = {rows : null};
		ch_query.QueryUserInfo(user_id ,"group_name" ,ui_obj);
		if(ui_obj.rows.length == 0)
		{
			console.log("Query user error");
			errno.SetLastError(CH_ERROR_INVALID_PARAMETER);
			return false;
		}
		cmd = "SELECT access_status FROM " + group_name + "_group_members WHERE member_id = '" + user_id + "'";
		var get_access_status = conn.query(cmd);
		var rows = [];
		get_access_status.on('result' ,function(row){
			rows.push(row);
		});
		get_access_status.on('end' ,function(){
			is_finish = true;
		});
		while(!is_finish)
			sleep(1);
		is_finish = false;
		if(rows.length == 0 || rows[0].access_status != 0)
		{
			errno.SetLastError(CH_ERROR_INVALID_PARAMETER);
			return false;
		}
		var time_stamp = ch_util.GetCurrentTimeTag();
		cmd = "DELETE FROM " + ui_obj.rows[0].group_name + "_group_members WHERE member_id = '" + user_id + "'";
		var remove_member = conn.query(cmd);
		remove_member.on('end' ,function(){
			cmd = "UPDATE user_group SET members_table_changed_time_stamp = '" + time_stamp + "' WHERE group_name ='" + ui_obj.rows[0].group_name + "'";
			var update_old_group_time_stamp = conn.query(cmd);
			update_old_group_time_stamp.on('end' ,function(){
				is_finish = true;
			});
		});
		while(!is_finish)
			sleep(1);
		is_finish = false;
		cmd = "UPDATE " + group_name + "_group_members SET access_status = 1 WHERE member_id = '" + user_id + "'";
		var change_as = conn.query(cmd);
		change_as.on('end' ,function(){
			cmd = "UPDATE user_group SET members_table_changed_time_stamp = '" + +  "' WHERE group_name = '" + group_name + "'";
			var changed_table_time_stamp = conn.query(cmd);
			changed_table_time_stamp.on('end' ,function()
			{
				cmd = "UPDATE users SET group_name = '" + group_name + "' ,last_user_modified_time = '" + time_stamp + "' WHERE user_id ='" + user_id + "'";
				var update_user = conn.query(cmd);
				update_user.on('end' ,function()
				{
					is_finish = true;
				});
			});
		});
		while(!is_finish)
			sleep(1);
		return true;
	}
};