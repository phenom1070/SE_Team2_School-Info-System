var sleep = require('system-sleep');
var errno = require('./ch_err');
var ch_util = require('./ch_util');
module.exports = {
	QueryGroup : function(group_name ,field_name ,ret_obj){
		var cmd = "SELECT " + field_name + " FROM user_group WHERE group_name = '" + group_name + "'";
		var query_group = conn.query(cmd);
		var ret_flag = false;
		var rows = [];
		query_group.on('error' ,function(err){
			console.log(err);
			ret_obj.err = err;
		});
		query_group.on('result' ,function(row){
			if(row)
			{
				rows.push(row);
			}
		});
		query_group.on('end' ,function(){
			
			if(rows.length != 0)
				ret_obj.rows = rows;
			ret_flag = true;
		});
		while(!ret_flag)
		{
			sleep(1);
		}
		if(rows.length != 0)
			return true;
		return false;
	},
	EnumGroupMembers : function(group_name ,pquery_item ,pret_obj){
		/*
			return value is bool (true is succeed false is failed)
			pret_obj should be look like {rows : []}
			and rows's item  is look like {query_name : query_value}
		*/
		if(group_name == null || pquery_item ==  null || pret_obj == null)
		{
			errno.SetLastError(CH_ERROR_INVALID_PARAMETER);
			return false; //is mean invalid param
		}
		var cmd = "SELECT ";
		for(var scan_point = 0 ;scan_point < pquery_item.length ;scan_point++)
		{
			cmd += pquery_item[scan_point];
			if(scan_point < pquery_item.length - 1)
				cmd += " ,";
		}
		cmd += " FROM " + group_name + "_group_members INNER JOIN users ON " + group_name + "_group_members.member_id = users.user_id";
		var query_member = conn.query(cmd);
		var err_result = null;
		var rows = [];
		var is_finish = false;
		query_member.on('error' ,function(err){
			err_result = err;
		}
		);
	  query_member.on('result' ,function(row){
	  	if(row)
	  		rows.push(row);
		}
	  );
	  query_member.on('end' ,function(){
	  	if(err_result)
	  	{
	  		console.log(err_result);
	  		errno.SetLastError(CH_ERROR_INTERNAL_PROBLEM);
	  		is_finish = true;
	  		return false;
	 		}
	 		if(rows.length)
	 			pret_obj.rows = rows;
	 		else
	 			pret_obj.rows = null;
	 		is_finish = true;
		});
	  while(!is_finish)
	  {
	  	sleep(1);
		}
		if(err_result)
			return false;
		return true;
	},
	EnumGroupName : function(dest_array,time_obj)
	{
		var rows = [];
		var cmd = "SELECT group_name ,row_changed_time_stamp  FROM user_group";
		var enum_group_name = conn.query(cmd);
		var can_exit = false;
		enum_group_name.on('result' ,function(row){
			rows.push(row);
		}
		);
		enum_group_name.on('end' ,function(){
			for(var i = 0 ;i < rows.length ;i++)
			{
				dest_array.push(rows[i].group_name);
				if(rows[i].group_name == 'root')
				{
					//because the changed time stamp is stored in there
					time_obj.changed_time = rows[i].row_changed_time_stamp;
				}
			}
			can_exit = true;
		}
		);
		while(!can_exit)
			sleep(1);
	},
	QueryUserInfo : function(user_id ,query_item ,dest_obj)
	{
		var cmd = "SELECT " + query_item + " FROM users WHERE user_id = '" + user_id + "'";
		var query = conn.query(cmd);
		var is_finish = false;
		var rows = [];
		query.on('result' ,function(row){
			rows.push(row);
		});
		query.on('end' ,function(){
			dest_obj.rows = rows;
			is_finish = true;
		});
		while(!is_finish)
			sleep(1);
	},
	RemoveUserFromGroupMembers : function(user_id ,group_name){
		var cmd = "DELETE FROM " + group_name + "_group_members WHERE member_id = '" + user_id + "'";
		var is_finish = false;
		remove_user = conn.query(cmd);
		remove_user.on('end' ,function()
		{
			var time_stamp = ch_util.GetCurrentTimeTag();
			cmd = "UPDATE user_group SET members_table_changed_time_stamp = '" + time_stamp + "'";
			var update_time_stamp = conn.query(cmd);
			update_time_stamp.on('end' ,function(){
				is_finish = true;
			});
		});
		while(!is_finish)
			sleep(1);
	},
	
};
