class Paged_Collection {
    constructor(page_dom, request_data, limit = 10) {
        this.page_dom = page_dom;
        this.page = 1;
        this.limit = limit;

        this.request_data = request_data;

        const first_button = document.createElement("span");
        first_button.classList.add("button", ui_toolkit_symbols_class);
        first_button.setAttribute("aria-label", "First page");
        first_button.role = "button";
        first_button.tabIndex = 0;
        first_button.innerHTML = "first_page";
        first_button.onclick = () => this.set_page(1);
        this.page_dom.appendChild(first_button);

        // page_dom add buttons and page display
        const prev_button = document.createElement("span");
        prev_button.classList.add("button", ui_toolkit_symbols_class);
        prev_button.setAttribute("aria-label", "Previous page");
        prev_button.role = "button";
        prev_button.tabIndex = 0;
        prev_button.innerHTML = "navigate_before";
        prev_button.onclick = () => this.prev_page();
        this.page_dom.appendChild(prev_button);

        this.page_dom.appendChild(document.createTextNode("Page: "));
        this.page_pointer_node = document.createElement("span");
        this.page_pointer_node.innerHTML = this.page;
        this.page_dom.appendChild(this.page_pointer_node);

        const next_button = document.createElement("span");
        next_button.classList.add("button", ui_toolkit_symbols_class);
        next_button.setAttribute("aria-label", "Next page");
        next_button.role = "button";
        next_button.tabIndex = 0;
        next_button.innerHTML = "navigate_next";
        next_button.onclick = () => this.next_page();
        this.page_dom.appendChild(next_button);

        const last_button = document.createElement("span");
        last_button.classList.add("button", ui_toolkit_symbols_class);
        last_button.setAttribute("aria-label", "Last page");
        last_button.role = "button";
        last_button.tabIndex = 0;
        last_button.innerHTML = "last_page";
        last_button.onclick = () => this.set_page(-1);
        this.page_dom.appendChild(last_button);

        const limit_select = document.createElement("select");
        for (const limit of [10, 20, 50, 100]) {
            const option = document.createElement("option");
            option.value = limit;
            option.innerHTML = limit;
            limit_select.appendChild(option);
        }
        limit_select.value = limit;
        limit_select.onchange = () => this.set_limit(limit_select.value);
        this.page_dom.appendChild(limit_select);
    }

    set_limit(limit) {
        this.limit = limit;
        this.update();
        return this;
    }

    async set_page(page) {
        if (page === -1) {
            // search for the last page
            // exponential steps
            let step = 0;
            page = 1;
            let reach_end = false;
            for (let i = 0; i < 32; i++) {
                const data = await this.request_data(page, this.limit);
                if (data.length < this.limit) {
                    reach_end = true;
                    break;
                }
                if (step === 0) step = 1;
                page += step;
                step *= 2;
            }

            if (!reach_end) {
                // too many pages, stop search
                this.page = page;
            } else {
                // binary search
                let left = page - step;
                let right = page;
                while (left < right) {
                    const mid = Math.floor((left + right) / 2);
                    const data = await this.request_data(mid, this.limit);
                    if (data.length < this.limit) {
                        right = mid;
                    } else {
                        left = mid + 1;
                    }
                }
                this.page = left;
            }
            this.update();
        } else {
            this.page = page;
            const count = await this.update();
            if (count === 0) {
                // jump to last page
                this.set_page(-1);
            }
        }

        this.page_pointer_node.innerHTML = this.page;
        return this;
    }

    prev_page() {
        if (this.page > 1) {
            this.set_page(this.page - 1);
        }
    }

    next_page() {
        this.set_page(this.page + 1);
    }
}

class Paged_Table extends Paged_Collection {
    constructor(table_dom, page_dom, request_data, limit = 10, filename = null) {
        super(page_dom, request_data, limit);

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
        const data = await this.request_data(this.page, this.limit, this.sort_by);
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

// synonym
Page_Table = Paged_Table;

class Paged_List extends Paged_Collection {
    constructor(list_dom, page_dom, request_data, limit = 10) {
        super(page_dom, request_data, limit);

        this.list_dom = list_dom;

        this.update();
    }

    async update() {
        const data = await this.request_data(this.page, this.limit);
        this.list_dom.innerHTML = "";
        for (const item_dom of data) {
            this.list_dom.appendChild(item_dom);
        }
        return data.length;
    }
}
