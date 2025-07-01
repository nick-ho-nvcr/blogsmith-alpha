function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // First, check if the URI already looks like a file with an extension.
    // This prevents rewrites for assets like .css, .js, .png, etc.
    // The check on the last segment is more robust than a simple includes('.').
    var segments = uri.split('/');
    var lastSegment = segments[segments.length - 1];
    if (lastSegment.includes('.')) {
        return request;
    }

    // Next, check if the URI ends with a slash. This implies a directory index.
    // e.g., a request for /posts/ should serve /posts/index.html
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    else if (uri.endsWith('blogsmith')) {
        request.uri += '/index.html';
    }
    // Otherwise, this is a "clean URL" for a page. Append .html.
    // e.g., a request for /about should serve /about.html
    else {
        request.uri += '.html';
    }
    return request;
}
