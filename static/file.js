$(document).ready(() => {
    // Cache frequently accessed elements
    const $fileInput = $('#file');
    const $dragbox = $('#dragbox');
    const $uploadContent = $('.upload .content');

    let userInputApi = getQueryStringParam('api');
    // Prepend 'https://' if missing
    if (userInputApi && !/^https?:\/\//i.test(userInputApi)) {
        userInputApi = 'https://' + userInputApi;
    }
    let defaultApiBase = 'http://127.0.0.1:5001';
    let apiPath = '/api/v0/add?pin=false';
    let apiBase = isValidApi(userInputApi) ? userInputApi : defaultApiBase;
    const api = `${apiBase}${apiPath}`;    
    console.log(api);

    // Helper Function to Get Query String Parameter
    function getQueryStringParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Function to Validate General API URL
    function isValidApi(url) {
        const regex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
        return regex.test(url);
    }

    initEventListeners();

    function initEventListeners() {
        $(document).on('paste', handlePasteUpload);
        $uploadContent.on('click', () => $fileInput.click());
        $fileInput.on('change', () => upload($fileInput[0].files));

        $dragbox.on('dragenter', () => $dragbox.addClass('dragenter'))
                .on('dragleave drop', () => $dragbox.removeClass('dragenter'));
        $dragbox.on('drop', handleDropUpload);
    }

    function handleDropUpload(e) {
        e.preventDefault();
        $('.upload').removeClass('dragenter');
        upload(e.originalEvent.dataTransfer.files);
    }

    function handlePasteUpload(event) {
        const clipboardData = event.originalEvent.clipboardData;
        if (!clipboardData || !clipboardData.items) {
            return alert('The current browser does not support paste upload');
        }
        const file = Array.from(clipboardData.items).find(item => item.type.includes('image'))?.getAsFile();
        if (!file) {
            return alert('The clipboard is empty or files are not supported');
        }
        upload([file]);
    }

    function upload(files) {
        Array.from(files).forEach(file => {
            document.querySelector('.container').classList.add('start');
            const formData = new FormData();
            formData.append('file', file);
            const randomClass = Date.now().toString(36);

            $('.filelist .list').append(createFileItem(file, randomClass));

            $.ajax({
                url: api,
                type: 'post',
                dataType: 'json',
                processData: false,
                contentType: false,
                data: formData,
                xhr: () => {
                    const xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', e => updateProgress(e, randomClass), false);
                    }
                    return xhr;
                },
                success: res => handleUploadSuccess(res, randomClass),
                error: () => handleError(randomClass)
            });
        });
    }

    function createFileItem(file, randomClass) {
        return `
            <div class="item ${randomClass}">
                <div class="file">
                    <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                        <path d="..." fill="#909399"></path>
                        <path d="..." fill="#909399"></path>
                    </svg>
                    <div class="desc">
                        <div class="desc__name">${file.name}</div>
                        <div class="desc__size">SIZE: ${formatBytes(file.size)}</div>
                    </div>
                </div>
                <div class="progress">
                    <div class="progress-bar">
                        <div class="progress-inner"></div>
                    </div>
                    <div class="progress-status">
                        <svg class="icon status-success" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                            <path d="..." fill="#67C23A"></path>
                            <path d="..." fill="#67C23A"></path>
                        </svg>
                        <svg class="icon status-error" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                            <path d="..." fill="#F56C6C"></path>
                        </svg>
                    </div>
                </div>
                <input id="show" name="show" onclick="copyToClipboard(this)" type="text" value="" readonly style="display:none">
            </div>
        `;
    }

    function updateProgress(e, randomClass) {
        const percent = Math.floor((e.loaded / e.total) * 100);
        $(`.${randomClass}`).find('.progress-inner').css('width', `${percent}%`);
    }

    function handleUploadSuccess(res, randomClass) {
        if (res.Hash) {
            const gateway = $('#gatewaySelect').val();
            const imgSrc = `${gateway}/ipfs/${res.Hash}`;
            $('#file').val(null);
            $(`.${randomClass}`).find('.progress-inner').addClass('success');
            $(`.${randomClass}`).find('.status-success').show();
            $(`.${randomClass}`).find('#show').show().val(imgSrc);
            $('.copyall').show();
            const title = $('.filelist .title').html().replace('upload list', '');
            $('.filelist .title').html(title);
        } else {
            handleError(randomClass);
        }
    }

    function handleError(randomClass) {
        $(`.${randomClass}`).find('.progress-inner').addClass('error');
        $(`.${randomClass}`).find('.status-error').show();
        $(`.${randomClass}`).find('#show').show().val("Upload error!");
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});

function deleteItem(obj) {
    const item = obj.closest('.item');
    item.parentNode.removeChild(item);
}

function changeGateway(obj) {
    const newUrlBase = obj.value;
    document.querySelectorAll("#show").forEach(input => {
        const currentUrl = input.value;
        const newUrl = currentUrl.replace(/https:\/\/[^\/]+/, newUrlBase);
        input.value = newUrl;
        input.closest('.item').querySelector(".file #url").href = newUrl;
    });
}

function copyToClipboard(obj) {
    const textToCopy = obj.value;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Link copied to clipboard');
    }).catch((err) => {
        console.error('Error copying text: ', err);
    });
}
