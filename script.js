async function convertForm() {
    const input = document.getElementById('input');
    const error = document.getElementById('error');
    const result = document.getElementById('result');
    const codeSection = document.getElementById('codeSection');
    const htmlCodeTailwind = document.getElementById('htmlCodeTailwind');
    const htmlCodeCSS = document.getElementById('htmlCodeCSS');
    const url = input.value.trim();

    // Reset displays
    error.style.display = 'none';
    result.innerHTML = '';
    codeSection.style.display = 'none';
    htmlCodeTailwind.value = '';
    htmlCodeCSS.value = '';

    // Validate URL
    if (!url || !url.includes('docs.google.com/forms')) {
        error.style.display = 'block';
        return;
    }

    try {
        // Use our proxy server to fetch the form
        const response = await fetch(`/fetch-form?url=${encodeURIComponent(url)}`);
        const html = await response.text();
        
        // Extract FB_PUBLIC_LOAD_DATA_
        const dataMatch = html.match(/var FB_PUBLIC_LOAD_DATA_ =([^;]+);/);
        if (!dataMatch) {
            throw new Error('Could not find form data');
        }

        // Parse the form data
        const formData = JSON.parse(dataMatch[1]);
        const questions = formData[1][1]; // Access the questions array

        // Create the submission URL
        const submissionUrl = url.replace('/viewform', '/formResponse');
        
        // Create new form
        const form = document.createElement('form');
        form.className = 'converted-form';
        form.action = submissionUrl;
        form.method = 'POST';
        form.id = 'google-form-generated';

        // Process each question
        questions.forEach(question => {
            const questionTitle = question[1]; // Question text
            const questionType = question[3]; // Question type
            const entryId = question[4][0][0]; // Entry ID
            
            let fieldContainer;
            
            switch(questionType) {
                case 0: // Short answer/text
                    fieldContainer = createTextField(questionTitle, entryId);
                    break;
                case 1: // Paragraph
                    fieldContainer = createTextArea(questionTitle, entryId);
                    break;
                case 2: // Multiple choice
                    fieldContainer = createRadioGroup(questionTitle, entryId, question[4][0][1]);
                    break;
                case 4: // Checkboxes
                    fieldContainer = createCheckboxGroup(questionTitle, entryId, question[4][0][1]);
                    break;
                default:
                    fieldContainer = createTextField(questionTitle, entryId);
            }
            
            form.appendChild(fieldContainer);
        });

        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Submit';
        submitBtn.className = 'mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium';
        form.appendChild(submitBtn);

        // Add status div for form submission feedback
        const statusDiv = document.createElement('div');
        statusDiv.id = 'form-submission-status';
        statusDiv.className = 'mt-4 p-3 rounded-lg hidden';
        form.appendChild(statusDiv);

        // Add JavaScript for asynchronous submission
        const script = document.createElement('script');
        script.textContent = `
            document.getElementById('google-form-generated').addEventListener('submit', function(e) {
                e.preventDefault(); // Stop default redirect
                
                const form = e.target;
                const statusDiv = document.getElementById('form-submission-status');
                const submitBtn = form.querySelector('button[type="submit"]');
                
                // Update UI to show submitting state
                statusDiv.className = 'mt-4 p-3 rounded-lg block bg-yellow-50 border border-yellow-200 text-yellow-800';
                statusDiv.textContent = 'Submitting...';
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
                submitBtn.className = 'mt-4 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium';
                
                const formData = new FormData(form);
                const params = new URLSearchParams(formData).toString();
                
                fetch(form.action, {
                    method: 'POST',
                    mode: 'no-cors', // Crucial for cross-origin submission to Google Forms
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params
                })
                .then(() => {
                    // In no-cors mode, we can't get actual response status,
                    // but if fetch completes, assume successful data dispatch.
                    statusDiv.className = 'mt-4 p-3 rounded-lg block bg-green-50 border border-green-200 text-green-800';
                    statusDiv.textContent = 'Form submitted successfully!';
                    form.reset(); // Clear fields
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                    statusDiv.className = 'mt-4 p-3 rounded-lg block bg-red-50 border border-red-200 text-red-800';
                    statusDiv.textContent = 'Submission failed. Please try again.';
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                    submitBtn.className = 'mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium';
                });
            });
        `;
        form.appendChild(script);

        // Show the preview
        result.appendChild(form.cloneNode(true));

        // Generate both versions
        const tailwindForm = form.cloneNode(true);
        const cssForm = createCSSVersion(form.cloneNode(true));
        
        // Show the HTML code
        codeSection.style.display = 'block';
        document.getElementById('htmlCodeTailwind').value = formatHTML(tailwindForm.outerHTML);
        document.getElementById('htmlCodeCSS').value = formatHTML(cssForm.outerHTML);

    } catch (err) {
        console.error(err);
        error.textContent = 'Unable to convert form. Please check the URL and try again.';
        error.style.display = 'block';
    }
}

function createTextField(label, entryId) {
    const container = document.createElement('div');
    container.className = 'form-field';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    container.appendChild(labelElement);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `entry.${entryId}`;
    input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    container.appendChild(input);

    return container;
}

function createTextArea(label, entryId) {
    const container = document.createElement('div');
    container.className = 'form-field';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    container.appendChild(labelElement);

    const textarea = document.createElement('textarea');
    textarea.name = `entry.${entryId}`;
    textarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    textarea.rows = 4;
    container.appendChild(textarea);

    return container;
}

function createRadioGroup(label, entryId, options) {
    const container = document.createElement('div');
    container.className = 'form-field';

    const labelElement = document.createElement('p');
    labelElement.textContent = label;
    labelElement.className = 'label';
    container.appendChild(labelElement);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'space-y-2';

    options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `entry.${entryId}`;
        input.value = option[0];
        input.id = `${entryId}_${index}`;
        input.className = 'mr-2';

        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${entryId}_${index}`;
        optionLabel.textContent = option[0];
        optionLabel.className = 'cursor-pointer';

        div.appendChild(input);
        div.appendChild(optionLabel);
        optionsContainer.appendChild(div);
    });

    container.appendChild(optionsContainer);
    return container;
}

function createCheckboxGroup(label, entryId, options) {
    const container = document.createElement('div');
    container.className = 'form-field';

    const labelElement = document.createElement('p');
    labelElement.textContent = label;
    labelElement.className = 'label';
    container.appendChild(labelElement);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'space-y-2';

    options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `entry.${entryId}`;
        input.value = option[0];
        input.id = `${entryId}_${index}`;
        input.className = 'mr-2';

        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${entryId}_${index}`;
        optionLabel.textContent = option[0];
        optionLabel.className = 'cursor-pointer';

        div.appendChild(input);
        div.appendChild(optionLabel);
        optionsContainer.appendChild(div);
    });

    container.appendChild(optionsContainer);
    return container;
}

function copyToClipboard(type = 'tailwind') {
    const htmlCode = document.getElementById(type === 'tailwind' ? 'htmlCodeTailwind' : 'htmlCodeCSS');
    htmlCode.select();
    document.execCommand('copy');
    
    const copyButton = event.target;
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
        copyButton.textContent = originalText;
    }, 2000);
}

function formatHTML(html) {
    let formatted = '';
    let indent = 0;
    
    // Split on < to get all tags
    const tags = html.split('<');
    
    for (let i = 0; i < tags.length; i++) {
        if (!tags[i]) continue;
        
        const tag = '<' + tags[i];
        
        // Decrease indent for closing tags
        if (tag.match(/<\//)) {
            indent--;
        }
        
        // Add formatted tag with proper indentation
        formatted += '  '.repeat(indent) + tag.trim() + '\n';
        
        // Increase indent for opening tags, but not for self-closing ones
        if (tag.match(/<[^/]/) && !tag.match(/\/>/)) {
            indent++;
        }
    }
    
    return formatted;
}

function createCSSVersion(form) {
    // Convert Tailwind classes to standard CSS classes
    const tailwindToCSS = {
        'form-field': 'css-form-field',
        'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent': 'css-input',
        'space-y-2': 'css-space-y-2',
        'flex items-center': 'css-flex-items-center',
        'mr-2': 'css-mr-2',
        'cursor-pointer': 'css-cursor-pointer',
        'mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium': 'css-submit-button',
        'mt-4 p-3 rounded-lg hidden': 'css-status-hidden',
        'mt-4 p-3 rounded-lg block bg-yellow-50 border border-yellow-200 text-yellow-800': 'css-status-warning',
        'mt-4 p-3 rounded-lg block bg-green-50 border border-green-200 text-green-800': 'css-status-success',
        'mt-4 p-3 rounded-lg block bg-red-50 border border-red-200 text-red-800': 'css-status-error',
        'mt-4 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium': 'css-submit-button-disabled'
    };

    // Replace Tailwind classes with CSS classes
    function replaceTailwindClasses(element) {
        if (element.className) {
            Object.keys(tailwindToCSS).forEach(tailwindClass => {
                if (element.className.includes(tailwindClass)) {
                    element.className = element.className.replace(tailwindClass, tailwindToCSS[tailwindClass]);
                }
            });
        }
        
        // Recursively process child elements
        Array.from(element.children).forEach(child => {
            replaceTailwindClasses(child);
        });
    }

    replaceTailwindClasses(form);

    // Add CSS styles to the form
    const style = document.createElement('style');
    style.textContent = `
        .css-form-field {
            margin-bottom: 1rem;
        }
        .css-input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 1rem;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .css-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .css-space-y-2 > * + * {
            margin-top: 0.5rem;
        }
        .css-flex-items-center {
            display: flex;
            align-items: center;
        }
        .css-mr-2 {
            margin-right: 0.5rem;
        }
        .css-cursor-pointer {
            cursor: pointer;
        }
        .css-submit-button {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background-color: #10b981;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .css-submit-button:hover {
            background-color: #059669;
        }
        .css-submit-button-disabled {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background-color: #9ca3af;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: not-allowed;
        }
        .css-status-hidden {
            display: none;
            margin-top: 1rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
        }
        .css-status-warning {
            display: block;
            margin-top: 1rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
            background-color: #fefce8;
            border: 1px solid #facc15;
            color: #a16207;
        }
        .css-status-success {
            display: block;
            margin-top: 1rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
            background-color: #f0fdf4;
            border: 1px solid #22c55e;
            color: #15803d;
        }
        .css-status-error {
            display: block;
            margin-top: 1rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
            background-color: #fef2f2;
            border: 1px solid #ef4444;
            color: #dc2626;
        }
    `;
    form.insertBefore(style, form.firstChild);

    return form;
}

function switchTab(activeTab) {
    const tailwindTab = document.getElementById('tailwindTab');
    const cssTab = document.getElementById('cssTab');
    const tailwindContent = document.getElementById('tailwindContent');
    const cssContent = document.getElementById('cssContent');

    if (activeTab === 'tailwind') {
        tailwindTab.classList.add('active-tab');
        tailwindTab.classList.remove('text-gray-600', 'hover:text-gray-800');
        tailwindTab.classList.add('text-blue-600');
        
        cssTab.classList.remove('active-tab', 'text-blue-600');
        cssTab.classList.add('text-gray-600', 'hover:text-gray-800');
        
        tailwindContent.style.display = 'block';
        cssContent.style.display = 'none';
    } else {
        cssTab.classList.add('active-tab');
        cssTab.classList.remove('text-gray-600', 'hover:text-gray-800');
        cssTab.classList.add('text-blue-600');
        
        tailwindTab.classList.remove('active-tab', 'text-blue-600');
        tailwindTab.classList.add('text-gray-600', 'hover:text-gray-800');
        
        tailwindContent.style.display = 'none';
        cssContent.style.display = 'block';
    }
} 