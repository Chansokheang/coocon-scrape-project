/**
 * Coupang Search Request Information
 * 
 * This business logic handles search functionality and data extraction from Coupang's search results page.
 * 
 */
        __Business_Logic__
        var input = dec(aInput.Input);

        var searchTerm = input.searchTerm || "shoes";  // Default search term is "shoes" if not provided

        // Step 1: Access the search page
        this.url = "/np/search?component=&q=" + httpRequest.URLEncode(searchTerm, "UTF-8");
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Search Page URL: [" + this.host + this.url + "]");
        this.log("Search Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Check if search was successful
        if (ResultStr.indexOf("검색결과") === -1) {
            this.setError(E_IBX_RESULT_FAIL);
            return E_IBX_RESULT_FAIL;
        }

        __DATA_EXTRACTION_AND_CLEANING__
        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};
        this.iSASInOut.Output.Result.SearchResults = [];
        
        // Extract search metadata
        var searchMetaSection = StrGrab(ResultStr, "'shoes'에 대한 검색결과", "배송유형");
        if (searchMetaSection) {
            // Extract categories if available
            var categoriesSection = StrGrab(searchMetaSection, "연관검색어", "배송유형");
            if (categoriesSection) {
                var categories = [];
                var categoryLinks = categoriesSection.split('</a>');
                for (var i = 0; i < categoryLinks.length - 1; i++) {
                    var categoryText = StrGrab(categoryLinks[i], '">', '').trim();
                    if (categoryText) {
                        categories.push(categoryText);
                    }
                }
                this.iSASInOut.Output.Result.RelatedCategories = categories;
            }
        }

        // Extract product listings
        var productsSection = StrGrab(ResultStr, '<ul id="productList"', '</ul>');
        if (!productsSection) {
            productsSection = StrGrab(ResultStr, 'class="search-product-list"', '</ul>');
        }
        
        if (productsSection) {
            var productItems = productsSection.split('<li class="');
            
            // Skip the first empty element
            for (var i = 1; i < productItems.length; i++) {
                var item = productItems[i];
                
                // Extract product data
                var product = {};
                
                // Extract product title
                var titleSection = StrGrab(item, 'class="name"', '</div>');
                if (titleSection) {
                    product.Title = StrGrab(titleSection, '">', '</a>').trim();
                }
                
                // Extract product URL
                if (item.indexOf('href="') !== -1) {
                    var urlPart = StrGrab(item, 'href="', '"');
                    if (urlPart) {
                        product.URL = this.host + urlPart;
                    }
                }
                
                // Extract price
                var priceSection = StrGrab(item, 'class="price-value"', '</span>');
                if (priceSection) {
                    product.Price = StrGrab(priceSection, '">', '').trim();
                }
                
                // Extract rating if available
                var ratingSection = StrGrab(item, 'class="rating"', '</div>');
                if (ratingSection) {
                    var ratingValue = StrGrab(ratingSection, 'data-rating="', '"');
                    if (ratingValue) {
                        product.Rating = ratingValue;
                    }
                    
                    var reviewCount = StrGrab(ratingSection, '>(', ')');
                    if (reviewCount) {
                        product.ReviewCount = reviewCount;
                    }
                }
                
                // Extract shipping info
                var shippingSection = StrGrab(item, 'class="delivery"', '</div>');
                if (shippingSection) {
                    product.ShippingInfo = StrGrab(shippingSection, '">', '').trim();
                }
                
                // Add to search results array
                if (product.Title) {
                    this.iSASInOut.Output.Result.SearchResults.push(product);
                }
            }
        }
        
        // Add URL to the output
        this.iSASInOut.Output.Result.url = this.host + this.url;
        this.iSASInOut.Output.Result.searchTerm = searchTerm;