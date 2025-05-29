class File_Explorer extends Paged_Collection {
    constructor(list_dom, page_dom, request_data, limit = 10) {
        super(page_dom, request_data, limit);
        this.list_dom = list_dom;
        this.sort_by = null;
        this.path = "";
        this.request_data = request_data.bind(this);

        const location_input = document.createElement("input");
        location_input.type = "text";
        location_input.classList.add("location-input");
        location_input.value = this.path;
        location_input.addEventListener(
            "change",
            function (event) {
                this.set_path(event.target.value.trim());
            }.bind(this)
        );
        this.page_dom.prepend(location_input);
        this.location_input = location_input;

        const up_directory_button = document.createElement("span");
        up_directory_button.classList.add("button", ui_toolkit_symbols_class);
        up_directory_button.setAttribute("aria-label", "First page");
        up_directory_button.role = "button";
        up_directory_button.tabIndex = 0;
        up_directory_button.innerHTML = "drive_folder_upload";
        up_directory_button.onclick = () => {
            this.cd("..");
        };
        this.page_dom.prepend(up_directory_button);

        this.update();
    }

    async update() {
        const data = await this.request_data(this.page, this.limit, this.sort_by, this.path);
        this.list_dom.innerHTML = "";
        for (const item_dom of data) {
            this.list_dom.appendChild(item_dom);
        }
        this.location_input.value = this.path;
        return data.length;
    }

    sort_by(column, order = "asc") {
        if (order == null) {
            this.sort_by = null;
            this.update();
        } else {
            this.sort_by = {
                column: column,
                order: order,
            };
            this.update();
        }
        return this;
    }

    set_path(path) {
        this.page = 1;
        if (path != this.path) {
            this.path = path;
            this.update();
        }
    }

    cd(path_part) {
        if (path_part === "..") {
            const parts = this.path.split("/");
            parts.pop();
            this.set_path(parts.join("/") || "/");
        } else {
            this.set_path(this.path + (this.path.endsWith("/") ? "" : "/") + path_part);
        }
        return this;
    }
}
