/* jshint -W107 */
var moduleVersion = '0.0.1'; // Expected: string - Module version number
var BankName = 'kbstar2'; // Expected: string - Name of the financial institution
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

        var 계좌번호 = input.계좌번호;  // account number
        var 계좌비밀번호 = input.계좌비밀번호; // account password
        var ID = input.ID;
        var 주민사업자번호 = input.주민사업자번호; // Resident business registration number
        var 통화 = input.통화 && input.통화.toUpperCase();// business number or birthdate


        system.setStatus(IBXSTATE_LOGIN, 30);
        // Step 1: Get the login page and capture the URL
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
        var 오늘날짜 = StrGrab(ResultStr, "getToday = \"", "\"");
        var tagName = StrGrab(ResultStr, "name='KEYPAD_TYPE_", "'");

        if (!오늘날짜 || !tagName) {
            this.setError(E_IBX_SITE_INVALID);
            return E_IBX_SITE_INVALID;
        }

        // // Main > 계좌조회
        system.setStatus(IBXSTATE_LOGIN, 40);

        // this.postData += "&" + httpRequest.URLEncode("요청키", "UTF-8") + "="; // 요청키 // Request key
        // this.postData += "&" + httpRequest.URLEncode("계좌번호", "UTF-8") + "=" + 계좌번호; // Account number
        // this.postData += "&" + httpRequest.URLEncode("조회시작일자", "UTF-8") + "=" + 오늘날짜; // 조회시작일자 // Start date
        // this.postData += "&" + httpRequest.URLEncode("조회종료일", "UTF-8") + "=" + 오늘날짜; // 조회종료일 // End date
        // this.postData += "&" + httpRequest.URLEncode("빠른조회", "UTF-8") + "=" + "Y"; // 빠른조회 // Quick inquiry
        // this.postData += "&" + httpRequest.URLEncode("조회계좌", "UTF-8") + "=" + 계좌번호; // 조회계좌 // Inquiry account
        // this.postData += "&" + httpRequest.URLEncode("비밀번호", "UTF-8") + "=" + 계좌비밀번호; // 비밀번호 // Password
        // this.postData += '&' + httpRequest.URLEncodeAll('조회시작년') + '=' + 오늘날짜.substr(0, 4); // 조회시작년 // Start year
        // this.postData += '&' + httpRequest.URLEncodeAll('조회시작월') + '=' + 오늘날짜.substr(4, 2); // 조회시작월 // Start month
        // this.postData += '&' + httpRequest.URLEncodeAll('조회시작일') + '=' + 오늘날짜.substr(6, 2); // 조회시작일 // Start day
        // this.postData += '&' + httpRequest.URLEncodeAll('조회끝년') + '=' + 오늘날짜.substr(0, 4); // 조회끝년 // End year
        // this.postData += '&' + httpRequest.URLEncodeAll('조회끝월') + '=' + 오늘날짜.substr(4, 2); // 조회끝월 // End month
        // this.postData += '&' + httpRequest.URLEncodeAll('조회끝일') + '=' + 오늘날짜.substr(6, 2); // 조회끝일 // End day
        // this.postData += "&" + httpRequest.URLEncode("조회구분", "UTF-8") + "=" + "2"; // 전체 // All
        // this.postData += "&" + httpRequest.URLEncode("응답방법", "UTF-8") + "=" + "2"; // 최근 // Latest

        var username = input.계좌번호;  // account number
        var password = input.계좌비밀번호; // account password
        var birthdate = input.주민사업자번호; // business number or birth date

        // system.setStatus(IBXSTATE_LOGIN, 30);

        // Step 2: Prepare form data for login POST request
        // system.setStatus(IBXSTATE_LOGIN, 40);
        // this.postData = "";
        this.postData += "&요청기=";


        this.postData += "&" + httpRequest.URLEncode("계좌번호", "UTF-8") +"=" + httpRequest.URLEncode(username, "UTF-8"); // 10270104496173
        this.postData += "&" + httpRequest.URLEncode("조회시작일자", "UTF-8") + "=" + httpRequest.URLEncode("20250413", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회종료일", "UTF-8") + "=" + httpRequest.URLEncode("20250413", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("고객식별번호", "UTF-8") + "=";
        this.postData += "&" + httpRequest.URLEncode("빠른조회", "UTF-8") + "=" + httpRequest.URLEncode("Y", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회계좌", "UTF-8") + "="  + httpRequest.URLEncode(username, "UTF-8"); // 10270104496173
        this.postData += "&" + httpRequest.URLEncode("비밀번호", "UTF-8") + "="  + httpRequest.URLEncode(password, "UTF-8"); // 2365
        this.postData += "&" + httpRequest.URLEncode("USEYN_CHECK_NAME_f7f26cd0b864", "UTF-8") + "=" + httpRequest.URLEncode("Y", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("검색구분", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("주민사업자번호", "UTF-8") + "=" + httpRequest.URLEncode(birthdate, "UTF-8"); // 920507
        this.postData += "&" + httpRequest.URLEncode("조회시작년", "UTF-8") + "="+ httpRequest.URLEncode("2025", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회시작월", "UTF-8") + "="  + httpRequest.URLEncode("04", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회시작일", "UTF-8") + "="  + httpRequest.URLEncode("13", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회끝년", "UTF-8") + "=" + httpRequest.URLEncode("2025", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회끝월", "UTF-8") + "="  + httpRequest.URLEncode("04", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회끝일", "UTF-8") + "="  + httpRequest.URLEncode("13", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회구분", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("응답방법", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8");

        this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770"; // execute this line of code

        // Step 3: Send POST request to login
        if (!httpRequest.post(this.host + this.url, this.postData)) {
            this.setError(E_IBX_FAILTOPOSTDATA);
            return E_IBX_FAILTOPOSTDATA;
        }

        // Step 4: Capture the current URL after login
        var currentUrl = this.host + this.url;
        ResultStr = httpRequest.result;
        this.log("Current URL after login: [" + currentUrl + "]");
        
        // Check if login was successful
        if (ResultStr.indexOf("계좌번호 또는 비밀번호가 일치하지 않습니다") >= 0) {
            this.setError(E_IBX_ACCOUNT_NO_INVALID);
            return E_IBX_ACCOUNT_NO_INVALID;
        }

        system.setStatus(IBXSTATE_RESULT, 50);

        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};

        // Extract application information from the result based on the html structure
        this.iSASInOut.Output.Result.url = currentUrl;
        this.iSASInOut.Output.Result.postData = this.postData;
        this.iSASInOut.Output.Result.rawHTML = ResultStr; // Account number
        this.iSASInOut.Output.Result.formData = this.formData;
        
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