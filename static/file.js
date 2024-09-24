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
    let apiBase = isValidUrl(userInputApi) ? userInputApi : defaultApiBase;
    let apiPath = '/api/v0/add?pin=false';
    const api = `${apiBase}${apiPath}`;
    console.log(api);

    let userInputGw = getQueryStringParam('gw');
    if (userInputGw !== null) {
        if (userInputGw && !/^https?:\/\//i.test(userInputGw)) {
            userInputGw = 'https://' + userInputGw;
        }
        if (isValidUrl(userInputGw)) {
            // Add the new option to the select element
            $('#gatewaySelect').append(
                $('<option>', {
                    value: userInputGw,
                    text: 'selfhost'
                })
            );
            // Select the newly added option
            $('#gatewaySelect').val(userInputGw);
        }
    }

    function getQueryStringParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function isValidUrl(url) {
        const regex = /^(https?:\/\/)?(?:\S+:\S+@)?[^\s/$.?#].[^\s]*$/i;
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

        // Find the first file in the clipboard items
        const file = Array.from(clipboardData.items).find(item => item.kind === 'file')?.getAsFile();

        if (!file) {
            return alert('The clipboard is empty or no files are supported');
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
                            <path d="M961.536 531.251c-0.614-3.481-1.843-7.168-3.891-10.445L827.392 306.79v-28.876c0-10.445 0-20.276 0.205-29.901 0.819-89.703 1.433-174.285-101.376-179.2H303.923c-33.587 0-58.368 8.601-76.185 26.624-30.72 30.925-30.31 79.257-29.696 140.288 0 8.601 0.204 17.408 0.204 26.419v38.093c-2.867 2.253-5.324 4.915-7.168 8.192L64.717 523.879c-1.639 2.867-2.663 5.734-3.277 8.806-6.144 12.288-9.626 26.01-9.626 40.345v290.407c0 50.585 41.984 91.75 93.594 91.75h733.184c51.61 0 93.594-41.165 93.594-91.75V573.03c-0.205-14.95-4.096-29.286-10.65-41.779zM861.389 481.28h-33.997v-55.91l33.997 55.91zM271.565 138.65c5.53-5.53 16.384-8.397 32.358-8.397h420.045c36.25 1.843 42.803 11.264 41.78 117.145 0 9.83-0.206 19.866-0.206 30.516V481.28H664.576c-16.998 0-30.925 13.722-30.925 30.925 0 64.307-54.681 116.736-122.06 116.736S389.53 576.512 389.53 512.205c0-16.999-13.722-30.925-30.925-30.925H259.89V262.144c0-9.42 0-18.432-0.205-27.034-0.41-43.008-0.819-83.558 11.879-96.46z m-73.523 279.552v63.078h-36.864l36.864-63.078z m712.294 445.44c0 16.179-14.54 30.105-31.949 30.105H145.203c-17.203 0-31.949-13.721-31.949-30.105V573.03c0-16.179 14.541-30.105 31.95-30.105h185.548c15.155 83.763 90.522 147.456 181.043 147.456s165.888-63.898 181.043-147.456h185.55c17.202 0 31.948 13.721 31.948 30.105v290.612z" fill="#909399"></path>
                            <path d="M385.638 278.528H655.77c16.998 0 30.924-13.722 30.924-30.925s-13.721-30.925-30.924-30.925H385.638c-16.998 0-30.924 13.722-30.924 30.925s13.926 30.925 30.924 30.925z m-30.924 70.451c0 16.999 13.721 30.925 30.924 30.925H655.77c16.998 0 30.924-13.722 30.924-30.925 0-17.203-13.721-30.925-30.924-30.925H385.638c-16.998 0-30.924 13.927-30.924 30.925z" fill="#909399"></path>
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
                                <path d="M310.710857 768.292571z m402.578286 0z" fill="#67C23A"></path>
                                <path d="M512 0C229.376 0 0 229.376 0 512S229.376 1024 512 1024 1024 794.624 1024 512 794.624 0 512 0z m300.178286 373.321143l-354.011429 354.011428c-21.065143 21.065143-55.588571 21.065143-76.653714 0l-169.691429-169.106285c-21.065143-21.065143-21.065143-55.588571 0-76.653715 21.065143-21.065143 55.588571-21.065143 76.653715 0l131.072 131.072 315.392-315.392c21.065143-21.065143 55.588571-21.065143 76.653714 0 21.650286 20.48 21.650286 55.003429 0.585143 76.068572z" fill="#67C23A"></path>
                        </svg>
                        <svg class="icon status-error" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M733.678921 290.121702c22.43209 22.531789 22.43209 58.921624 0 81.353714L593.403583 511.850453 733.678921 652.125791c20.537825 20.537825 22.531789 53.13913 4.785513 76.069711l-4.785513 5.4834c-22.531789 22.531789-58.921624 22.531789-81.453412 0L511.95017 593.204167 371.674832 733.579204c-20.537825 20.537825-53.13913 22.531789-76.069711 4.785512l-5.383702-4.785512c-22.531789-22.531789-22.531789-58.921624 0-81.453413l140.275339-140.275338L290.321118 371.674813c-20.637523-20.537825-22.731185-53.13913-4.885211-76.169409l4.785512-5.383702c22.531789-22.43209 58.921624-22.43209 81.353715 0l140.275338 140.17564L652.225509 290.121702c20.537825-20.537825 53.039431-22.531789 75.970012-4.785513l5.4834 4.785513zM0.000019 511.850453c0 282.744037 229.206114 511.950151 511.950151 511.950151s511.950151-229.206114 511.950151-511.950151S794.694207 0 511.95017 0 0.000019 229.206114 0.000019 511.850453z" fill="#F56C6C"></path>
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
            const fileName = $(`.${randomClass}`).find('.desc__name').text();
            const imgSrc = `${gateway}/ipfs/${res.Hash}?filename=${encodeURIComponent(fileName)}`;
            $('#file').val(null);
            $(`.${randomClass}`).find('.progress-inner').addClass('success');
            $(`.${randomClass}`).find('.status-success').show();
            $(`.${randomClass}`).find('#show').show().val(imgSrc);
            $('#copyAll').show();
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
        const newUrl = currentUrl.replace(/https?:\/\/[^\/]+/, newUrlBase);
        input.value = newUrl;

        const item = input.closest('.item');
        if (item) {
            const urlElement = item.querySelector(".file #url");
            if (urlElement) {
                urlElement.href = newUrl;
            } else {
                console.warn("URL element not found within item.");
            }
        } else {
            console.warn("Item not found for the input.");
        }
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

function copyAllLinks() {
    const allLinks = Array.from(document.querySelectorAll('#show'))
        .map(input => input.value)
        .join('\n');

    navigator.clipboard.writeText(allLinks).then(() => {
        alert('All links copied to clipboard');
    }).catch(err => {
        console.error('Error copying links: ', err);
    });
}
