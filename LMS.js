/* jshint -W107 */
var moduleVersion = '0.0.1'; // Expected: string - Module version number
var BankName = 'LMS'; // Expected: string - Name of the financial institution
console.log(BankName + " 스크립트 호출됨."); // Script called
console.log("Version: " + moduleVersion);

// Form data template structure
var formDataTemplate = {
    url: "",
    method: "",
    headers: {},
    formData: {}
};

function iSASObject() {
    console.log("iSASObject 생성자 호출"); // iSASObject constructor called
    this.iSASInOut = {};

    this.UID = '';
    this.AESKey = '';
    this.EncKey = '';
    this.KeyValue = '';
    this.KeyStr = '';

    this.LowerTempStr = '';
    this.imgBase64 = '';
}

iSASObject.prototype.log = function(logMsg) {
    try {
        SASLog("iSASObject.Log(" + logMsg + "\")");
    } catch (e) {
        console.log("iSASObject.Log(" + logMsg + "\")");
    }
};

iSASObject.prototype.setError = function(errcode) {
    this.iSASInOut.Output = {};
    this.iSASInOut.Output.ErrorCode = errcode.toString(16).toUpperCase();
    //TODO: 에러 메시지 가져오는 부분... // Part for retrieving error messages
    this.iSASInOut.Output.ErrorMessage = getCooconErrMsg(errcode.toString(16).toUpperCase());
};

///////////////////////////////////////////////////////////////////////////////
var NOTICE = function() { // Expected: string - Service class name for financial institution
    console.log(BankName + " 빠른조회 생성자 호출"); // Quick Inquiry constructor called
    this.errorMsg = "";
    this.host = 'https://lms.chungbuk.ac.kr'; // Expected: string - Base URL of the service endpoint
    this.url = "";
    this.userAgent = "{}";
    this.param = "";
    this.postData = "";
    this.xgate_addr = "";
    this.bLogIn = false;
    this.formData = {};
};

NOTICE.prototype = Object.create(iSASObject.prototype);

NOTICE.prototype.NOTICE_LIST = function(aInput) { // Expected: string - Name of the operation to perform
    this.log(BankName + " 빠른조회 빠른잔액조회 호출 [" + aInput + "][" + moduleVersion + "]"); // Quick Inquiry Quick Balance Inquiry Call
    try {
        // <ST>WORKFLOW</SP> 
        var input = dec(aInput.Input);

        var username = input.username;  // LMS username
        var password = input.password;  // LMS password

        // Step 1: Access the login page
        this.url = "/login/index.php";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Login Page URL: [" + this.host + this.url + "]");
        this.log("Login Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Step 2: Prepare form data for login POST request
        this.postData = "";
        this.postData += "username=" + httpRequest.URLEncode(username, "UTF-8");
        this.postData += "&password=" + httpRequest.URLEncode(password, "UTF-8");
        this.postData += "&rememberusername=1";

        // Step 3: Send POST request to login
        if (!httpRequest.post(this.host + this.url, this.postData, "application/x-www-form-urlencoded")) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }

        // Step 4: Check if login was successful
        ResultStr = httpRequest.result;
        // if (ResultStr.indexOf("Log out") === -1) {
        //     this.setError(E_IBX_LOGIN_FAIL);
        //     return E_IBX_LOGIN_FAIL;
        // }

        // Step 5: Navigate to the announcements page
        this.url = "/mod/ubboard/view.php?id=17";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        
        ResultStr = httpRequest.result;
        this.log("Announcements Page URL: [" + this.host + this.url + "]");
        this.log("Announcements Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};
        this.iSASInOut.Output.Result.Announcements = [];

        // Extract total count and page information
        var totalCountSection = StrGrab(ResultStr, 'Total Count :', 'Total Page');
        var totalCount = StrGrab(totalCountSection, '<span class="text-warning">', '</span>').trim();
        
        var totalPageSection = StrGrab(ResultStr, 'Total Page :', '</div>');
        var totalPageInfo = StrGrab(totalPageSection, '<span class="text-success">', '</span>').trim();
        var totalPage = StrGrab(totalPageInfo, '', '/').trim();
        var maxPage = StrGrab(totalPageInfo, '/', '').trim();
        
        this.iSASInOut.Output.Result.TotalCount = totalCount;
        this.iSASInOut.Output.Result.CurrentPage = totalPage;
        this.iSASInOut.Output.Result.MaxPage = maxPage;

        // Extract announcement table
        var tableSection = StrGrab(ResultStr, '<table class="table table-bordered table-coursemos table-ubboard-list">', '</table>');
        var tableBody = StrGrab(tableSection, '<tbody>', '</tbody>');
        
        // Split the table body into rows
        var rows = tableBody.split('<tr class="">');
        
        // Skip the first empty element
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i];
            
            // Extract announcement data
            var announcement = {};
            
            // Extract number
            var numberSection = StrGrab(row, 'class="text-center t-number"', '</td>');
            // Check if it's a notice (has an image) or a regular post (has a number)
            if (numberSection.indexOf('<img') !== -1) {
                announcement.Number = "Notice";
            } else {
                announcement.Number = StrGrab(numberSection, '>', '</td>').trim();
            }
            
            // Extract title
            var titleSection = StrGrab(row, 'class="t-subject"', '</td>');
            announcement.Title = StrGrab(titleSection, '">', '</a>').trim();
            
            // Extract URL if available
            if (titleSection.indexOf('href="') !== -1) {
                var urlPart = StrGrab(titleSection, 'href="', '"');
                announcement.URL = this.host + urlPart;
            }
            
            // Check if the announcement has an attachment
            announcement.HasAttachment = (titleSection.indexOf('icon/disk') !== -1);
            
            // Extract date created
            var dateSection = StrGrab(row, 'class="text-center t-date"', '</td>');
            var fullDate = StrGrab(dateSection, 'title="', '"').trim();
            var displayDate = StrGrab(dateSection, '">', '</span>').trim();
            announcement.DateCreated = displayDate;
            announcement.FullDateCreated = fullDate;
            
            // Extract views
            var viewsSection = StrGrab(row, 'class="text-center t-viewcount"', '</td>');
            announcement.Views = StrGrab(viewsSection, '>', '</td>').trim();
            
            // Add to announcements array
            this.iSASInOut.Output.Result.Announcements.push(announcement);
        }
        
        // Add URL and postData to the output
        this.iSASInOut.Output.Result.url = this.host + this.url;
        this.iSASInOut.Output.Result.postData = this.postData;

        // <ST>LMS</SP> 

        return S_IBX_OK;
    } catch (e) {
        this.log("exception " + e.message);
        this.setError(E_IBX_UNKNOWN);
        return E_IBX_UNKNOWN;
    } finally {
        system.setStatus(IBXSTATE_DONE, 100);
        this.log(BankName + " Quick Inquiry Login finally");
    }
};

function OnInit() {
    console.log("OnInit()");
    try {
        //Load necessary components
        if (!system.include("iSASTypes")) {
            sleep(500);
            console.log('iSASTypes_Boolean : [' + system.include("iSASTypes") + ']');
        }
        if (!system.include("sas/sas")) {
            sleep(500);
            console.log('sas_Boolean : [' + system.include("sas/sas") + ']');
        }
        system.setStatus(IBXSTATE_BEGIN, 0);
    } catch (e) {
        console.log("Exception OnInit:[" + e.message + "]");
    } finally {
    }
}

function Execute(aInput) {
    console.log("Execute[" + aInput + "]");
    try {
        console.log("Init Default Error");
        iSASObj = JSON.parse(aInput);
        iSASObj.Output = {};
        iSASObj.Output.ErrorCode = '8000F110';
        iSASObj.Output.ErrorMessage = "Failed to execute the module.";

        OnInit();

        iSASObj = JSON.parse(aInput);
        var ClassName = iSASObj.Class;
        var ModuleName = iSASObj.Module;
        if (Failed(SetClassName(ClassName, ModuleName))) {
            iSASObj.Output = {};
            iSASObj.Output.ErrorCode = '8000F111';
            iSASObj.Output.ErrorMessage = "Please check the Class name and Job name.";
        } else {
            obj.iSASInOut = "";
            OnExcute(0, JSON.stringify(iSASObj));

            console.log("Result test [" + obj.iSASInOut + "]");

            if (obj.iSASInOut != "")
                iSASObj = obj.iSASInOut;
        }
    } catch (e) {
        console.log("exception:[" + e.message + "]");
    } finally {
        return JSON.stringify(iSASObj);
    }
}
/* jshint +W107 */