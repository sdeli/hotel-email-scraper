const cheerio = require('cheerio');
const url = require('url');

module.exports = ((config) => {
    const {
        MAIN_PAGE_URL,
        MAIN_SLD,
        MAINS_PROTOCOL,
        MAINS_FULL_DOMAIN
    } = config;
    
    function pushSubPageLinks(html, originPgUrl) {
        let $ = cheerio.load(html);
        let allLinksOnPg = $('a').toArray();

        allLinksOnPg.forEach((aTag) => {
            try {
                let currLink = aTag.attribs.href.trim();
                // console.log('maybe: ' + currLink);
                
                let isValid = checkIfIsSubPageUrl(currLink) && !this.isLinkDuplicate(currLink) 
                if (!isValid) return;
                
                this.subPageUrls.push(currLink);    
                let currValidFullUrl = getAbsoluteLink(currLink, originPgUrl);
                this.fullSubPageUrls.push(currValidFullUrl);
            } catch (error) {
                return;
            }
        });
        
        return;
    }
    
    function checkIfIsSubPageUrl(currLink) {
        if (currLink.substr(0, 1) === '#') return false;
    
        let isAction = /^(javascript:|tel:|mailto:)/.test(currLink);
        if (isAction) return false;
    
        if (isFile(currLink)) return false;
    
        let hasHostnameInUrl = /^(http|\/\/)/.test(currLink);
        // if no hostname => raltive link/path => subpagelink
        if (!hasHostnameInUrl) return true;
        
        let isSameDomainOrSubDomain = isSameDomainOrSubDomainCheck(currLink);
        if (isSameDomainOrSubDomain) {
            return true;
        } else if (!isSameDomainOrSubDomain){
            return false;
        }
    
        process.write.stdout('54 unxepected kind of url: ' + currLink + 'on page: ' + MAIN_PAGE_URL);
        process.stdout.write('54 unxepected kind of url: ' + currLink + 'on page: ' + MAIN_PAGE_URL);
        return true;
    }

    function isFile(currLink) {
        let isFile = /(.*)(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.pdf)$/.test(currLink);
        isFile |= /(.*)(\.bin|\.BIN|\.dmg|\.DMG|\.iso|\.ISO|\.toast|\.TOAST|\.vcd|\.VCD)$/.test(currLink);
        isFile |= /(.*)(\.7z|\.7Z|\.arj|\.ARJ|\.deb|\.DEB|\.pkg|\.PKG|\.rar|\.RAR|\.rpm|\.RPM|\.tar.gz|\.TAR.GZ|\.z|\.Z|\.zip|\.ZIP)$/.test(currLink);
        isFile |= /(.*)(\.aif|\.AIF|\.cda|\.CDA|\.mid|\.MID|\.mp3|\.MP3|\.mpa|\.MPA|\.ogg|\.OGG|\.wav|\.WAV|\.wma|\.WMA|\.wpl|\.WPL)$/.test(currLink);
        isFile |= /(.*)(\.csv|\.CSV|\.dat|\.DAT|\.db|\.DB|\.dbf|\.DBF|\.log|\.LOG|\.csv|\.CSV|\.sav|\.SAV|\.sql|\.SQL|\.tar|\.TAR|\.xml|\.XML)$/.test(currLink);
        isFile |= /(.*)(\.gadget|\.GADGET|\.exe|\.EXE|\.cgi|\.CGI|\.pl|\.PL|\.wsf|\.WSF|\.apk|\.APK)$/.test(currLink);
        isFile |= /(.*)(\.ai|\.GADGET|\.bmp|\.EXE|\.ico|\.CGI|\.ps|\.PL|\.psd|\.WSF|\.svg|\.SVG|\.tif|\.TIF|\.tiff|\.TIFF)$/.test(currLink);
        isFile |= /(.*)(\.cer|\.CER|\.cfm|\.CFM|\.css|\.CSS|\.js|\.JS|\.part|\.PART)$/.test(currLink);
        isFile |= /(.*)(\.java|\.JAVA|\.class|\.CLASS|\.ods|\.ODS|\.xlr|\.XLR|\.xls|\.XLS|\.xlsx|\.XLSX)$/.test(currLink);
        isFile |= /(.*)(\.3g2|\.3g2|\.3gp|\.3GP|\.avi|\.AVI|\.flv|\.FLV|\.h264|\.H264|\.m4v|\.M4v|\.mkv|\.MKV)$/.test(currLink);
        isFile |= /(.*)(\.mov|\.MOV|\.mp4|\.MP4|\.mpg|\.MPG|\.mpeg|\.MPEG|\.rm|\.RM|\.swf|\.SWF|\.vob|\.VOB|\.wmv|\.WMV)$/.test(currLink);
        isFile |= /(.*)(\.doc|\.MOV|\.docx|\.MP4|\.rtf|\.MPG|\.text|\.MPEG|\.txt|\.RM|\.wks|\.SWF|\.wpd)$/.test(currLink);

        return Boolean(isFile);
    }
    
    function isSameDomainOrSubDomainCheck(currLink) {
        let hostname = currLink.replace(/^(https:\/\/|http:\/\/|\/\/)([a-z0-9._-]+)(\/.*)/, '$2');
        let domainPartsOfCurrLink = hostname.split('.');
        // sld => second level domain
        let sldOfCurrLink = domainPartsOfCurrLink[domainPartsOfCurrLink.length - 2];
        let isSameDomainOrSubDomain = MAIN_SLD === sldOfCurrLink;
        return isSameDomainOrSubDomain;
    }
    
    function getAbsoluteLink(currLink, originPgUrl) {
        // let hostname = url.parse(currLink).hostname;
    
        let isSubPgFullUrl = /^(http:\/\/|https:\/\/)/.test(currLink);
        if (isSubPgFullUrl) {
            return currLink;
        }
    
        if (currLink.substr(0,2) === '//') {
            let fullUrl = currLink.replace('//', `${MAINS_PROTOCOL}//`);
            return fullUrl;
        }
        
        let isUrlAUrlPath = Boolean(currLink.match(/^(\/|\.\/\w+|\.\.\/\w+)/));
        if (isUrlAUrlPath) {
            let urlPath = currLink.replace(/^(\/|\.\/|\.\.\/)(.*)/, '$2');
            let fullUrl = `${MAINS_FULL_DOMAIN}/${urlPath}`;
            return fullUrl;
        }

        let isRelativeToOrignWebsite = Boolean(x.match(/^\w+/));
        if (isRelativeToOrignWebsite) {
            let fullUrl = url.resolve(originPgUrl, currLink);
            return fullUrl;
        }
    
        process.write.stdout('93 unusual url: ' + currLink);
        process.stdout.write('94 unusual url: ' + currLink + 'on page: ' + MAIN_PAGE_URL);
    }
    
    function isLinkDuplicate(currLink) {
        let isAlreadyQueuedToExtract = this.subPageUrls.includes(currLink);
        let isAlreadyExtracted = this.emailsExtractedUrls.includes(currLink);
    
        if (isAlreadyQueuedToExtract || isAlreadyExtracted) {
            return true;
        } else {
            return false;
        }
    }
    
    return {
        pushSubPageLinks,
        isLinkDuplicate
    };
});