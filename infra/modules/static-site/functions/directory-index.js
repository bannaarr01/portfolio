// CloudFront Function — viewer-request.
//
// WHY THIS EXISTS (astro.md §11.1): the bucket is private and reached through
// OAC, which means CloudFront talks to the S3 *REST* endpoint. Unlike the S3
// *website* endpoint, REST has no concept of an index document — it resolves
// keys literally. Astro is built with `build.format: 'directory'`, so the page
// for /blog/ is the object blog/index.html. Without this rewrite every
// directory URL on the site returns 403 AccessDenied.
//
// Runtime is cloudfront-js-2.0 (ES 2019). Billed per invocation with 2M free
// per month, which this site will not approach. Lambda@Edge would do the same
// job an order of magnitude slower and dearer, and only from us-east-1.
//
// Rendered by Terraform via templatefile(), so a $${...} sequence is a
// Terraform interpolation, not a JavaScript template literal. Do not
// introduce JS template literals here — they would be evaluated by Terraform
// at plan time and fail with an "invalid expression" error.

var CANONICAL_HOST = '${canonical_host}';

function handler(event) {
    var request = event.request;

    // ---- 1. Host canonicalisation (apex vs www) -------------------------
    // Both names are aliases on one distribution, so without this they serve
    // identical content at two URLs. Off unless canonical_host is set.
    if (CANONICAL_HOST !== '') {
        var host = request.headers.host && request.headers.host.value;

        if (host && host !== CANONICAL_HOST) {
            return {
                statusCode: 301,
                statusDescription: 'Moved Permanently',
                headers: {
                    location: {
                        value: 'https://' + CANONICAL_HOST + request.uri + buildQueryString(request.querystring)
                    },
                    'cache-control': { value: 'max-age=3600' }
                }
            };
        }
    }

    // ---- 2. Directory index rewrite ------------------------------------
    var uri = request.uri;

    // /blog/ -> /blog/index.html   (and / -> /index.html)
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
        return request;
    }

    // /blog -> /blog/index.html
    //
    // Only the final path segment is tested for an extension. Testing the
    // whole URI with indexOf('.') would wrongly pass through a path such as
    // /v1.2/about, which has no extension but does contain a dot.
    var lastSlash = uri.lastIndexOf('/');
    var lastSegment = uri.substring(lastSlash + 1);

    if (lastSegment.length > 0 && lastSegment.indexOf('.') === -1) {
        request.uri = uri + '/index.html';
        return request;
    }

    // Anything with a real extension (/_astro/app.Bx1p.css, /og/post.png,
    // /rss.xml, /favicon.ico) is already a literal key. Pass through.
    return request;
}

// The viewer-request event models the query string as an object, so a redirect
// has to reassemble it or it silently drops. Values arrive percent-encoded and
// are re-emitted as-is.
function buildQueryString(querystring) {
    if (!querystring) {
        return '';
    }

    var parts = [];

    for (var key in querystring) {
        var entry = querystring[key];

        if (entry.multiValue) {
            for (var i = 0; i < entry.multiValue.length; i++) {
                parts.push(key + '=' + entry.multiValue[i].value);
            }
        } else if (entry.value === undefined || entry.value === '') {
            parts.push(key);
        } else {
            parts.push(key + '=' + entry.value);
        }
    }

    return parts.length === 0 ? '' : '?' + parts.join('&');
}
