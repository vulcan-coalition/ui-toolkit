vulcan_dialogue = (function () {
    let loader_dom = null;
    let load_stack_count = 0;
    const display_load = function (flag) {
        if (loader_dom === null) {
            loader_dom = document.createElement("dialog");
            loader_dom.classList.add("float-loader", "hide");
            loader_dom.innerHTML = `
                <span class="hide">loading</span>
                <div class="loader"><span></span></div>
            `;
            document.body.appendChild(loader_dom);
        }

        if (flag) {
            loader_dom.classList.remove("hide");
            loader_dom.classList.remove("fade-out");
            loader_dom.showModal();
            load_stack_count += 1;
        } else {
            if (load_stack_count > 0) {
                load_stack_count -= 1;
            }

            if (load_stack_count == 0) {
                loader_dom.classList.add("fade-out");
                setTimeout(() => {
                    loader_dom.classList.add("hide");
                    loader_dom.close();
                }, 500);
            }
        }
    };

    const message_dom = document.createElement("dialog");
    message_dom.autofocus = true;
    message_dom.classList.add("float-message", "hide");
    message_dom.innerHTML = `
        <div class="float-box">
            <div class="float-content"></div>
            <div class="action alert hide">
                <input type="button" class="alert-ok-button" value="ok" aria-label="ok">
            </div>
            <div class="action confirm hide">
                <input type="button" class="confirm-ok-button" value="ok" aria-label="ok">
                <input type="button" class="confirm-cancel-button" value="cancel" aria-label="cancel">
            </div>
            <div class="action prompt hide">
                <input type="text" class="prompt-input" aria-label="input">
                <input type="button" class="prompt-ok-button" value="ok" aria-label="ok">
                <input type="button" class="prompt-cancel-button" value="cancel" aria-label="cancel">
            </div>
        </div>
    `;
    document.body.appendChild(message_dom);

    let display_id = null;
    let message_content = [];
    let thread_handler = null;
    message_dom.querySelector(".alert-ok-button").addEventListener("click", () => {
        for (let i = 0; i < message_content.length; i++) {
            if (message_content[i].id === display_id) {
                message_content[i].resolve();
                break;
            }
        }
    });

    message_dom.querySelector(".confirm-ok-button").addEventListener("click", () => {
        for (let i = 0; i < message_content.length; i++) {
            if (message_content[i].id === display_id) {
                message_content[i].resolve(true);
                break;
            }
        }
    });

    message_dom.querySelector(".confirm-cancel-button").addEventListener("click", () => {
        for (let i = 0; i < message_content.length; i++) {
            if (message_content[i].id === display_id) {
                message_content[i].resolve(false);
                break;
            }
        }
    });

    const prompt_ok_handler = () => {
        for (let i = 0; i < message_content.length; i++) {
            if (message_content[i].id === display_id) {
                message_content[i].resolve(message_dom.querySelector(".prompt-input").value);
                break;
            }
        }
    };

    message_dom.querySelector(".prompt-input").addEventListener("keydown", (event) => {
        if (event.code === "Enter") {
            prompt_ok_handler();
        }
    });

    message_dom.querySelector(".prompt-ok-button").addEventListener("click", prompt_ok_handler);

    message_dom.querySelector(".prompt-cancel-button").addEventListener("click", () => {
        for (let i = 0; i < message_content.length; i++) {
            if (message_content[i].id === display_id) {
                message_content[i].resolve(null);
                break;
            }
        }
    });

    const display_message = function () {
        if (display_id !== null) {
            return;
        }

        if (message_content.length === 0) {
            return;
        }

        if (thread_handler !== null) {
            clearTimeout(thread_handler);
            thread_handler = null;
        }

        const content = message_content[0];
        display_id = content.id;

        const float_content = message_dom.querySelector(".float-content");
        if (typeof content.html_content === "string") {
            float_content.innerHTML = content.html_content;
        } else {
            // treat as a DOM element
            float_content.innerHTML = "";
            float_content.appendChild(content.html_content);
        }

        // focus on content for screen reader
        float_content.focus();

        if (content.type === "alert") {
            message_dom.querySelector(".alert").classList.remove("hide");
        } else if (content.type === "confirm") {
            message_dom.querySelector(".confirm").classList.remove("hide");
        } else if (content.type === "prompt") {
            message_dom.querySelector(".prompt").classList.remove("hide");
        }

        message_dom.showModal();
        message_dom.classList.remove("hide");
        message_dom.classList.remove("fade-out");
    };

    const hide_message = function (id) {
        if (display_id !== id) {
            return;
        }

        const content = message_content.shift();
        display_id = null;

        if (content.type === "alert") {
            message_dom.querySelector(".alert").classList.add("hide");
        } else if (content.type === "confirm") {
            message_dom.querySelector(".confirm").classList.add("hide");
        } else if (content.type === "prompt") {
            message_dom.querySelector(".prompt").classList.add("hide");
        }

        if (message_content.length > 0) {
            display_message();
        } else {
            message_dom.classList.add("fade-out");
            thread_handler = setTimeout(() => {
                message_dom.close();
                message_dom.classList.add("hide");
            }, 250);
        }
        display_message();
    };

    const alert = function (html_content) {
        const id = new Date().getTime();

        const promise = new Promise((resolve, reject) => {
            message_content.push({
                id: id,
                type: "alert",
                html_content: html_content,
                resolve: function () {
                    resolve();
                    hide_message(id);
                },
            });
        });
        display_message();
        return promise;
    };

    const confirm = function (html_content) {
        const id = new Date().getTime();

        const promise = new Promise((resolve, reject) => {
            message_content.push({
                id: id,
                type: "confirm",
                html_content: html_content,
                resolve: function (result) {
                    resolve(result);
                    hide_message(id);
                },
            });
        });
        display_message();
        return promise;
    };

    const prompt = function (html_content) {
        const id = new Date().getTime();

        const promise = new Promise((resolve, reject) => {
            message_content.push({
                id: id,
                type: "prompt",
                html_content: html_content,
                resolve: function (result) {
                    resolve(result);
                    hide_message(id);
                },
            });
        });
        display_message();
        return promise;
    };

    return {
        display_load: display_load,
        alert: alert,
        confirm: confirm,
        prompt: prompt,
    };
})();
