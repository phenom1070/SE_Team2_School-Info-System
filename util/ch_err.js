const HAVE_SOLUTION_INTERVAL=500;

global.CH_ERROR_SUCCESS = 0;
global.CH_ERROR_INVALID_PARAMETER = 1;
global.CH_ERROR_INVALID_PARAM = 1;
global.CH_ERROR_DATA_NOT_FOUND = 2;
global.CH_ERROR_PRIVILEGE = 3;
global.CH_ERROR_USER_TYPE = 4;
global.CH_ERROR_USERID = 5;
global.CH_ERROR_PASSWORD = 6;
global.CH_ERROR_STEP = 7;
global.CH_ERROR_INVALID_PATH = 8;
global.CH_ERROR_INTERNAL_PROBLEM = 9;

var last_err_code = CH_ERROR_SUCCESS;

var errcode_name = [
											'CH_ERROR_SUCCESS',
											'CH_ERROR_INVALID_PARAMETER',
											'CH_ERROR_DATA_NOT_FOUND',
											'CH_ERROR_PRIVILEGE',
											'CH_ERROR_USER_TYPE',
											'CH_ERROR_USERID',
											'CH_ERROR_PASSWORD',
											'CH_ERROR_STEP',
											'CH_ERROR_INVALID_PATH',
											'CH_ERROR_INTERNAL_PROBLEM'
											
										];
										
var errcode_title = [
											'Success',
											'Invalid parameter',
											'Not found',
											'Need privilege',
											'Usertype error' ,
											'UserID error',
											'Invalid password',
											'Do the wrong step',
											'Invalid path (Error404)',
											'Problem occur in server'
											
										];
var errcode_solution = [	null,
													"Please give a correct parameter.",
													"Please give a correct parameter.",
													"Please try to login.",
													"Please try to login again with correctly user type.",
													"Please try to input the correct UserID.",
													"Please try to input the correct password.",
													"Please follow the normal procedure.",
													"Please try to input the correct URL path.",
													"Please connect again at later."
												];
										
var err_begin_sentence = "A problem has been detected and we show you this page to prevent you get any further problem.";
var err_subsentence1 = "If this is the first time you've seen this error page,";
module.exports = {
	GetLastError : function()
	{
		return last_err_code;
	},
	SetLastError : function(err_code){
		if(!Number.isInteger(err_code))
		{
			last_err_code = CH_ERROR_INVALID_PARAMETER;
			return false;
		}
		last_err_code = err_code;
		return true;
	},
	GetErrorInfo : function(errcode ,err_obj ,is_html){
		if(err_obj == null || errcode > errcode_name.length)
		{
			 //is mean caller's param is invalid
			 module.exports.SetLastError(CH_ERROR_INVALID_PARAMETER);
			return false;
		}
		if(is_html)
		{
			var num_str = errcode.toString();
			err_obj.errmsg = errcode_title[errcode];
			err_obj.errdetail = err_begin_sentence + "<br>" + errcode_name[errcode] + "<br>" + err_subsentence1 + "<br>" + errcode_solution[errcode] + 
							"<br><br>" + "Technical information:" + "<br>" + "*** ERROR_CODE: 0x" + num_str;  
		}
		else
		{
			err_obj.errmsg = errcode_solution[errcode];
		}
		return true;
	},
	RetErrToClient : function(errcode ,req ,res){
		err_obj = {errmag : null ,errdetail : null};
		module.exports.GetErrorInfo(errcode ,err_obj ,req.session.client_device === 'browser');
		if(req.session.client_device === 'browser')
		{
			req.session.main_errcode = errcode;
			req.session.main_errmsg = err_obj.errmsg;
			req.session.main_errdetail = err_obj.errdetail;
			res.sendFile(path.join(__dirname, '../public', 'error_page.html'));
			return;
		}
		res.json({errcode : errcode ,msg : err_obj.errmsg});
		return;
	}
};
