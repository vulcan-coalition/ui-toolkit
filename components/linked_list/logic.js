class Linked_Collection {
    constructor(page_dom, request_data, page_size = 10) {
        this.page_size = page_size;
        this.front_id = null;
        this.last_id = null;
        this.direction_forward = true;

        this.request_data = request_data;

        if (page_dom != null) {
            this.page_dom = page_dom;

            // page_dom add buttons and page display
            const prev_button = document.createElement("span");
            prev_button.classList.add("button", ui_toolkit_symbols_class);
            prev_button.setAttribute("aria-label", "Previous page");
            prev_button.role = "button";
            prev_button.tabIndex = 0;
            prev_button.innerHTML = "navigate_before";
            prev_button.onclick = () => this.prev_page();
            this.page_dom.appendChild(prev_button);

            const size_select = document.createElement("select");
            for (const ps of [10, 20, 50, 100]) {
                const option = document.createElement("option");
                option.value = ps;
                option.innerHTML = ps;
                size_select.appendChild(option);
            }
            size_select.value = limit;
            size_select.onchange = () => this.set_page_size(size_select.value);
            this.page_dom.appendChild(size_select);

            const next_button = document.createElement("span");
            next_button.classList.add("button", ui_toolkit_symbols_class);
            next_button.setAttribute("aria-label", "Next page");
            next_button.role = "button";
            next_button.tabIndex = 0;
            next_button.innerHTML = "navigate_next";
            next_button.onclick = () => this.next_page();
            this.page_dom.appendChild(next_button);
        } else {
            // throw "page_dom or page_pointer_node must be provided";
        }
    }

    set_page_size(page_size) {
        this.page_size = parseInt(page_size);
        this.update();
        return this;
    }

    prev_page() {
        this.direction_forward = false;
        this.update();
        return this;
    }

    next_page() {
        this.direction_forward = true;
        this.update();
        return this;
    }
}

class Linked_Table extends Linked_Collection {
    constructor(table_dom, page_dom, request_data, page_size = 10, filename = null) {
        super(page_dom, request_data, page_size);

        this.table_dom = table_dom;
        this.tbody = table_dom.querySelector("tbody");

        this.sort_by = null;

        if (filename != null) {
            const download_button = document.createElement("span");
            download_button.classList.add("button", ui_toolkit_symbols_class);
            download_button.setAttribute("aria-label", "Download");
            download_button.role = "button";
            download_button.tabIndex = 0;
            download_button.innerHTML = "download";
            download_button.onclick = () => this.export_xlsx(filename);
            this.page_dom.appendChild(download_button);
        }

        // add sort event listener
        const thead = this.table_dom.querySelector("thead tr:last-child");
        this.sort_columns = {};
        for (const th of thead.children) {
            const column_name = th.innerHTML;
            // create a new div including the text, arrow up and arrow down
            th.innerHTML = "";
            const div = document.createElement("div");
            const text_node = document.createTextNode(column_name);
            div.appendChild(text_node);
            const arrow_up = document.createElement("span");
            arrow_up.classList.add(ui_toolkit_symbols_class);
            arrow_up.innerHTML = "arrow_drop_up";
            arrow_up.style.display = "none";
            div.appendChild(arrow_up);
            const arrow_down = document.createElement("span");
            arrow_down.classList.add(ui_toolkit_symbols_class);
            arrow_down.innerHTML = "arrow_drop_down";
            arrow_down.style.display = "none";
            div.appendChild(arrow_down);
            th.appendChild(div);

            this.sort_columns[column_name] = {
                text: column_name,
                arrow_up: arrow_up,
                arrow_down: arrow_down,
            };
            th.onclick = () => {
                if (this.sort_by != null && this.sort_by.column === column_name) {
                    if (this.sort_by.order === "asc") {
                        this.sort_by_column(column_name, "desc");
                    } else if (this.sort_by.order === "desc") {
                        this.sort_by_column(column_name, null);
                    }
                } else {
                    this.sort_by_column(column_name, "asc");
                }
            };
        }

        this.update();
    }

    sort_by_column(column, order = "asc") {
        // reset page
        this.front_id = null;
        this.last_id = null;

        for (const column_object of Object.values(this.sort_columns)) {
            column_object.arrow_up.style.display = "none";
            column_object.arrow_down.style.display = "none";
        }
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
        const column_object = this.sort_columns[column];
        if (order === "asc") {
            column_object.arrow_up.style.display = "inline-block";
        } else if (order === "desc") {
            column_object.arrow_down.style.display = "inline-block";
        } else if (order == null) {
            column_object.arrow_up.style.display = "none";
            column_object.arrow_down.style.display = "none";
        }
        return this;
    }

    async update() {
        const [data, new_front_id, new_last_id] = await this.request_data(this.page_size, this.direction_forward, this.front_id, this.last_id, this.sort_by);
        this.front_id = new_front_id;
        this.last_id = new_last_id;
        this.tbody.innerHTML = "";
        for (const row of data) {
            const tr = document.createElement("tr");
            for (const cell of row) {
                const td = document.createElement("td");
                if (typeof cell === "object") {
                    td.appendChild(cell);
                } else if (typeof cell === "string" && cell.startsWith("<")) {
                    td.innerHTML = cell;
                } else {
                    td.appendChild(document.createTextNode(cell));
                }
                tr.appendChild(td);
            }
            this.tbody.appendChild(tr);
        }
        return data.length;
    }

    export_xlsx(filename = null) {
        const workbook = XLSX.utils.table_to_book(this.table_dom);

        const ws = workbook.Sheets["Sheet1"];
        // change column header to text
        const thead = this.table_dom.querySelector("thead tr:last-child");

        let i = 0;
        for (const column_object of Object.values(this.sort_columns)) {
            const cell = ws[XLSX.utils.encode_cell({ c: i, r: 0 })];
            cell.t = "s";
            cell.v = column_object.text;
            i++;
        }

        // add stamp
        XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], { origin: -1 });

        filename = filename ? filename : "excel_data.xlsx";
        XLSX.writeFileXLSX(workbook, filename);
    }
}

class Linked_List extends Linked_Collection {
    constructor(list_dom, page_dom, request_data, page_size = 10) {
        super(page_dom, request_data, page_size);
        this.list_dom = list_dom;
        this.update();
    }

    async update() {
        const [data, new_front_id, new_last_id] = await this.request_data(this.page_size, this.direction_forward, this.front_id, this.last_id);
        this.front_id = new_front_id;
        this.last_id = new_last_id;
        this.list_dom.innerHTML = "";
        for (const item_dom of data) {
            this.list_dom.appendChild(item_dom);
        }
        return data.length;
    }
}

class Custom_Linked_List extends Linked_Collection {
    constructor(request_data, page_size = 10) {
        super(null, request_data, page_size);
        this.update();
    }

    async update() {
        const [data, new_front_id, new_last_id] = await this.request_data(this.page_size, this.direction_forward, this.front_id, this.last_id);
        this.front_id = new_front_id;
        this.last_id = new_last_id;
        if (data == null) return 0;
        return data.length;
    }
}
