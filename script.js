async function convertForm() {
    const input = document.getElementById('input');
    const error = document.getElementById('error');
    const result = document.getElementById('result');
    const codeSection = document.getElementById('codeSection');
    const htmlCode = document.getElementById('htmlCode');
    const url = input.value.trim();

    // Reset displays
    error.style.display = 'none';
    result.innerHTML = '';
    codeSection.style.display = 'none';
    htmlCode.value = '';

    // Validate URL
    if (!url || !url.includes('docs.google.com/forms')) {
        error.style.display = 'block';
        return;
    }

    try {
        // Use our proxy server to fetch the form
        const response = await fetch(`http://localhost:3000/fetch-form?url=${encodeURIComponent(url)}`);
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
        form.target = '_blank';

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
        submitBtn.style.marginTop = '15px';
        form.appendChild(submitBtn);

        // Show the preview
        result.appendChild(form.cloneNode(true));

        // Show the HTML code
        codeSection.style.display = 'block';
        htmlCode.value = formatHTML(form.outerHTML);

    } catch (err) {
        console.error(err);
        error.textContent = 'Unable to convert form. Please check the URL and try again.';
        error.style.display = 'block';
    }
}

function createTextField(label, entryId) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.style.marginBottom = '15px';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    container.appendChild(labelElement);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `entry.${entryId}`;
    input.style.display = 'block';
    input.style.width = '100%';
    input.style.marginTop = '5px';
    container.appendChild(input);

    return container;
}

function createTextArea(label, entryId) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.style.marginBottom = '15px';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    container.appendChild(labelElement);

    const textarea = document.createElement('textarea');
    textarea.name = `entry.${entryId}`;
    textarea.style.display = 'block';
    textarea.style.width = '100%';
    textarea.style.marginTop = '5px';
    container.appendChild(textarea);

    return container;
}

function createRadioGroup(label, entryId, options) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.style.marginBottom = '15px';

    const labelElement = document.createElement('p');
    labelElement.textContent = label;
    labelElement.className = 'label';
    container.appendChild(labelElement);

    options.forEach((option, index) => {
        const div = document.createElement('div');
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `entry.${entryId}`;
        input.value = option[0];
        input.id = `${entryId}_${index}`;

        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${entryId}_${index}`;
        optionLabel.textContent = option[0];
        optionLabel.className = 'radio';

        div.appendChild(input);
        div.appendChild(optionLabel);
        container.appendChild(div);
    });

    return container;
}

function createCheckboxGroup(label, entryId, options) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.style.marginBottom = '15px';

    const labelElement = document.createElement('p');
    labelElement.textContent = label;
    labelElement.className = 'label';
    container.appendChild(labelElement);

    options.forEach((option, index) => {
        const div = document.createElement('div');
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `entry.${entryId}`;
        input.value = option[0];
        input.id = `${entryId}_${index}`;

        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${entryId}_${index}`;
        optionLabel.textContent = option[0];
        optionLabel.className = 'checkbox';

        div.appendChild(input);
        div.appendChild(optionLabel);
        container.appendChild(div);
    });

    return container;
}

function copyToClipboard() {
    const htmlCode = document.getElementById('htmlCode');
    htmlCode.select();
    document.execCommand('copy');
    
    const copyButton = document.querySelector('.copy-button');
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