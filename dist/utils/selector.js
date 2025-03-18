export function getUniqueSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    const path = [];
    let currentElement = element;
    while (currentElement && currentElement.nodeName.toLowerCase() !== 'body') {
        let selector = currentElement.nodeName.toLowerCase();
        if (currentElement.id) {
            selector += `#${currentElement.id}`;
            path.unshift(selector);
            break;
        }
        else {
            let sibling = currentElement; // Type assertion
            let nth = 1;
            while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling; // Type assertion
                if (sibling.nodeName.toLowerCase() === selector) {
                    nth++;
                }
            }
            if (nth !== 1) {
                selector += `:nth-of-type(${nth})`;
            }
        }
        path.unshift(selector);
        currentElement = currentElement.parentElement;
    }
    return path.join(' > ');
}
