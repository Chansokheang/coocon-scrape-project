/* jshint -W107 */
var moduleVersion = '0.0.1'; // Expected: string - Module version number
var BankName = 'kbstar3'; // Expected: string - Name of the financial institution
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
var 빠른조회 = function() { // Expected: string - Service class name for financial institution
    console.log(BankName + " 빠른조회 생성자 호출"); // Quick Inquiry constructor called
    this.errorMsg = "";
    this.host = 'https://obank.kbstar.com'; // Expected: string - Base URL of the service endpoint
    this.url = "";
    this.userAgent = "{}";
    this.param = "";
    this.postData = "";
    this.xgate_addr = "";
    this.bLogIn = false;
    this.formData = {};
};

빠른조회.prototype = Object.create(iSASObject.prototype);

빠른조회.prototype.빠른잔액조회 = function(aInput) { // Expected: string - Name of the operation to perform
    this.log(BankName + " 빠른조회 빠른잔액조회 호출 [" + aInput + "][" + moduleVersion + "]"); // Quick Inquiry Quick Balance Inquiry Call
    try {
        // Business Logic
        var input = dec(aInput.Input);

        var username = input.username;  // account number
        var password = input.password; // account password
        var birthdate = input.birthdate; // business number or birth date

        system.setStatus(IBXSTATE_LOGIN, 30);
        // Step 1: Get the login page and capture the URL
        system.setStatus(IBXSTATE_LOGIN, 30);
        this.url = "/quics?page=C025255&cc=b028364:b028702&QSL=F";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Login Page URL: [" + this.host + this.url + "]");
        this.log("Login Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Step 2: Prepare form data for login POST request
        system.setStatus(IBXSTATE_LOGIN, 40);
        this.postData = "";
        this.postData += httpRequest.URLEncode("계좌번호", "UTF-8") + "=" + httpRequest.URLEncode(username, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("계좌비밀번호", "UTF-8") + "=" + httpRequest.URLEncode(password, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("주민사업자번호", "UTF-8") + "=" + httpRequest.URLEncode(birthdate, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회구분", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8"); // 2 for 사업자번호

        // Step 3: Send POST request to login
        this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770";
        if (!httpRequest.post(this.host + this.url, this.postData, "application/x-www-form-urlencoded")) {
            this.setError(E_IBX_FAILTOPOSTDATA);
            return E_IBX_FAILTOPOSTDATA;
        }

        // Step 4: Capture the response after login
        ResultStr = httpRequest.result;
        this.log("Response after login: [" + ResultStr.substring(0, 200) + "...]");

        system.setStatus(IBXSTATE_RESULT, 50);

        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};

        // Extract information from the result based on the html structure
        this.iSASInOut.Output.Result.url = this.host + this.url;
        this.iSASInOut.Output.Result.postData = this.postData;

        // Extract account information
        var accountSection = StrGrab(ResultStr, '요청기', '');
        
        // 계좌번호 (Account Number)
        var accountNumberSection = StrGrab(ResultStr, '계좌번호', '');
        this.iSASInOut.Output.Result.accountNumber = StrGrab(accountNumberSection, ':', '').trim();
        
        // 조회시작일 (Inquiry Start Date)
        var startDateSection = StrGrab(ResultStr, '조회시작일', '');
        this.iSASInOut.Output.Result.startDate = StrGrab(startDateSection, ':', '').trim();
        
        // 조회종료일 (Inquiry End Date)
        var endDateSection = StrGrab(ResultStr, '조회종료일', '');
        this.iSASInOut.Output.Result.endDate = StrGrab(endDateSection, ':', '').trim();
        
        // 빠른조회 (Quick Inquiry)
        var quickInquirySection = StrGrab(ResultStr, '빠른조회', '');
        this.iSASInOut.Output.Result.quickInquiry = StrGrab(quickInquirySection, ':', '').trim();
        
        // 조회계좌 (Inquiry Account)
        var inquiryAccountSection = StrGrab(ResultStr, '조회계좌', '');
        this.iSASInOut.Output.Result.inquiryAccount = StrGrab(inquiryAccountSection, ':', '').trim();
        
        // 비밀번호 (Password)
        var passwordSection = StrGrab(ResultStr, '비밀번호', '');
        this.iSASInOut.Output.Result.passwordMasked = StrGrab(passwordSection, ':', '').trim();
        
        // 주민사업자번호 (Resident/Business Number)
        var residentNumberSection = StrGrab(ResultStr, '주민사업자번호', '');
        this.iSASInOut.Output.Result.residentNumber = StrGrab(residentNumberSection, ':', '').trim();
        
        // 검색구분 (Search Type)
        var searchTypeSection = StrGrab(ResultStr, '검색구분', '');
        this.iSASInOut.Output.Result.searchType = StrGrab(searchTypeSection, ':', '').trim();
        
        // 응답방법 (Response Method)
        var responseMethodSection = StrGrab(ResultStr, '응답방법', '');
        this.iSASInOut.Output.Result.responseMethod = StrGrab(responseMethodSection, ':', '').trim();
        
        // 조회년월 (Inquiry Year/Month)
        var inquiryYearMonthSection = StrGrab(ResultStr, '조회년월', '');
        this.iSASInOut.Output.Result.inquiryYearMonth = StrGrab(inquiryYearMonthSection, ':', '').trim();
        
        // 조회일자 (Inquiry Date)
        var inquiryDateSection = StrGrab(ResultStr, '조회일자', '');
        this.iSASInOut.Output.Result.inquiryDate = StrGrab(inquiryDateSection, ':', '').trim();
        
        return 0;
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