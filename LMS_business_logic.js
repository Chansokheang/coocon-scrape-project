/**
 * LMS Chungbuk University Login and Announcement Extraction
 * 
 * This business logic handles authentication and data extraction from the LMS system
 * of Chungbuk National University.
 * 
 */
        __Business_Logic__
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
        if (ResultStr.indexOf("Log out") === -1) {
            this.setError(E_IBX_LOGIN_FAIL);
            return E_IBX_LOGIN_FAIL;
        }

        // Step 5: Navigate to the announcements page
        this.url = "/mod/ubboard/view.php?id=17";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        ResultStr = httpRequest.result;
        this.log("Announcements Page URL: [" + this.host + this.url + "]");
        this.log("Announcements Page Content: [" + ResultStr.substring(0, 200) + "...]");

        __DATA_EXTRACTION_AND_CLEANING__
        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};
        this.iSASInOut.Output.Result.Announcements = [];

        // Extract table rows from the result
        var tableContent = StrGrab(ResultStr, '<table class="table table-bordered table-coursemos table-ubboard-list">', '</table>');
        
        // Get the tbody content
        var tbodyContent = StrGrab(tableContent, '<tbody>', '</tbody>');
        
        // Split by tr opening tag to get individual rows
        var rows = tbodyContent.split('<tr class="');
        
        // Process each row (skip the first element which is empty due to split)
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i];
            
            var announcement = {};
            
            // Extract No.
            var noSection = StrGrab(row, 'class="text-center t-number"', '</td>');
            // Check if it's a notice (has an image) or a regular number
            if (noSection.indexOf('<img') > -1) {
                announcement.no = "Notice";
            } else {
                announcement.no = StrGrab(noSection, '">', '</td>').trim();
            }
            
            // Extract Subject/Title
            var titleSection = StrGrab(row, 'class="t-subject"', '</td>');
            announcement.title = StrGrab(titleSection, '">', '</a>').trim();
            
            // Extract URL
            var urlSection = StrGrab(titleSection, '<a href="', '"');
            announcement.url = urlSection;
            
            // Extract Date Created
            var dateSection = StrGrab(row, 'class="text-center t-date"', '</td>');
            announcement.dateCreated = StrGrab(dateSection, 'title="', '">').trim();
            announcement.displayDate = StrGrab(dateSection, '">', '</span>').trim();
            
            // Extract Views
            var viewsSection = StrGrab(row, 'class="text-center t-viewcount"', '</td>');
            announcement.views = StrGrab(viewsSection, '">', '</td>').trim();
            
            // Check if it has attachments
            announcement.hasAttachment = (row.indexOf('icon/disk') > -1);
            
            // Add to announcements array
            this.iSASInOut.Output.Result.Announcements.push(announcement);
        }
        
        // Add metadata
        this.iSASInOut.Output.Result.url = this.host + this.url;
        
        // Extract total count from the page
        var totalCountStr = StrGrab(ResultStr, 'Total Count :', '</span>');
        var totalCount = StrGrab(totalCountStr, '<span class="text-warning">', '').trim();
        this.iSASInOut.Output.Result.totalCount = totalCount;
        
        // Extract pagination info
        var totalPageStr = StrGrab(ResultStr, 'Total Page :', '</span>');
        var totalPage = StrGrab(totalPageStr, '<span class="text-success">', '').trim();
        this.iSASInOut.Output.Result.pagination = totalPage;