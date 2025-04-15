/**
 * LMS Chungbuk University Announcement Data Extraction
 * 
 * This business logic handles authentication and data extraction from the LMS announcements page.
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